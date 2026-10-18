'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export type PondLocation = {
  label: string
  latitude: number
  longitude: number
}

type GooglePlace = {
  formattedAddress?: string
  location?: { lat: () => number; lng: () => number }
  fetchFields: (options: { fields: string[] }) => Promise<void>
}

type GooglePlacePrediction = {
  text: { toString: () => string }
  toPlace: () => GooglePlace
}

type GooglePlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (options: {
      input: string
      includedRegionCodes: string[]
    }) => Promise<{ suggestions: Array<{ placePrediction?: GooglePlacePrediction }> }>
  }
}

type GoogleGeocoderResult = {
  formatted_address: string
  address_components: Array<{ long_name: string; types: string[] }>
}

type GoogleMapsApi = {
  importLibrary: (name: string) => Promise<unknown>
  Geocoder: new () => {
    geocode: (request: { location: { lat: number; lng: number } }) => Promise<{
      results: GoogleGeocoderResult[]
    }>
  }
}

declare global {
  interface Window {
    google?: { maps: GoogleMapsApi }
  }
}

let mapsScriptPromise: Promise<GoogleMapsApi> | null = null

function loadGoogleMaps(key: string): Promise<GoogleMapsApi> {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (mapsScriptPromise) return mapsScriptPromise

  mapsScriptPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-google-maps-places]')
    if (!script) {
      script = document.createElement('script')
      script.dataset.googleMapsPlaces = 'true'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async`
      script.async = true
      script.defer = true
    }

    const onLoad = () => {
      if (window.google?.maps) resolve(window.google.maps)
      else reject(new Error('Google Maps loaded without its JavaScript API. Check that the Maps JavaScript API is enabled for this key.'))
    }
    const onError = () => reject(new Error('Could not load Google Maps. Check the API key and network connection.'))
    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    if (!script.isConnected) document.head.append(script)
  }).catch((caught: unknown) => {
    mapsScriptPromise = null
    throw caught
  })

  return mapsScriptPromise
}

export function PondLocationPicker({
  initialValue,
  onSelect,
  onQueryChange,
}: {
  initialValue?: PondLocation | null
  onSelect: (location: PondLocation | null) => void | Promise<void>
  onQueryChange?: (query: string) => void
}) {
  const [query, setQuery] = useState(initialValue?.label ?? '')
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([])
  const [chosenLabel, setChosenLabel] = useState(initialValue?.label ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const search = query.trim()
    if (search.length < 3 || search === chosenLabel) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setBusy(true)
      setError('')
      try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!key) throw new Error('Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart the dev server.')
        const maps = await loadGoogleMaps(key)
        const places = await maps.importLibrary('places') as GooglePlacesLibrary
        const result = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: search,
          includedRegionCodes: ['in'],
        })
        if (!controller.signal.aborted) {
          setSuggestions((result.suggestions ?? []).flatMap((suggestion) =>
            suggestion.placePrediction ? [suggestion.placePrediction] : [],
          ))
        }
      } catch (caught) {
        if (controller.signal.aborted) return
        setError(caught instanceof Error ? caught.message : 'Could not search for this location.')
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }, 900)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [chosenLabel, query])

  async function saveLocation(location: PondLocation) {
    setQuery(location.label)
    setChosenLabel(location.label)
    setSuggestions([])
    setError('')
    setNotice('')
    try {
      await onSelect(location)
      setNotice('Location saved for this pond.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this pond location.')
    }
  }

  async function chooseLocation(prediction: GooglePlacePrediction) {
    setBusy(true)
    setSuggestions([])
    setError('')
    setNotice('')
    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['formattedAddress', 'location'] })
      if (!place.location) throw new Error('Google Maps did not return coordinates for this location.')
      await saveLocation({
        label: place.formattedAddress ?? prediction.text.toString(),
        latitude: place.location.lat(),
        longitude: place.location.lng(),
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this pond location.')
    } finally {
      setBusy(false)
    }
  }

  async function useCurrentLocation() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (!navigator.geolocation) throw new Error('Location access is not available in this browser.')
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000,
        })
      })
      const { latitude, longitude } = position.coords
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!key) throw new Error('Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart the dev server.')
      const maps = await loadGoogleMaps(key)
      const geocoder = new maps.Geocoder()
      const { results } = await geocoder.geocode({ location: { lat: latitude, lng: longitude } })
      const address = results[0]
      const locality = address?.address_components.find((component) =>
        component.types.some((type) => ['locality', 'postal_town', 'sublocality', 'administrative_area_level_3'].includes(type)),
      )?.long_name
      const state = address?.address_components.find((component) =>
        component.types.includes('administrative_area_level_1'),
      )?.long_name
      await saveLocation({
        label: [locality, state].filter(Boolean).join(', ') || address?.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
      })
    } catch (caught) {
      const geolocationCode = typeof caught === 'object' && caught !== null
        && 'code' in caught && typeof caught.code === 'number'
        ? caught.code
        : null
      const message = caught instanceof Error && caught.message.startsWith('Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')
        ? caught.message
        : geolocationCode !== null
        ? geolocationCode === 1
          ? 'Location permission was denied. Allow it in browser settings, or search for your locality.'
          : 'Could not get your location. Search for your locality instead.'
        : caught instanceof Error ? caught.message : 'Could not use your current location.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  function updateQuery(value: string) {
    setQuery(value)
    setChosenLabel('')
    setSuggestions([])
    setNotice('')
    onQueryChange?.(value)
  }

  async function clearLocation() {
    setQuery('')
    setChosenLabel('')
    setSuggestions([])
    setError('')
    setNotice('')
    try {
      await onSelect(null)
      setNotice('Saved pond location cleared.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not clear this pond location.')
    }
  }

  return (
    <div className="pond-location-picker">
      <label className="field">
        <span>Pond location <small>Optional</small></span>
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search a village, town, or nearby locality"
          autoComplete="off"
        />
        <span className="telugu-hint" lang="te">వాతావరణ సమాచారం కోసం ఊరు లేదా దగ్గరలోని ప్రాంతం వెతకండి, లేదా మీ స్థానం వాడండి.</span>
      </label>
      <Button type="button" className="pond-location-button" onClick={useCurrentLocation} disabled={busy}>
        {busy ? 'Finding location…' : '◎ Use my current location'}
      </Button>
      <p className="location-attribution">Your browser asks permission first. Google Maps suggests nearby localities; saved coordinates are used for this pond&apos;s forecast.</p>
      {chosenLabel && <button type="button" className="pond-location-clear" onClick={() => void clearLocation()}>Clear saved location</button>}
      {suggestions.length > 0 && (
        <ul className="location-suggestions" aria-label="Location suggestions">
          {suggestions.map((prediction) => (
            <li key={prediction.text.toString()}>
              <button type="button" onClick={() => void chooseLocation(prediction)}>
                <strong>{prediction.text.toString()}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}
      {busy && query.trim().length >= 3 && suggestions.length === 0 && <p className="location-attribution">Searching nearby localities…</p>}
      {error && <p className="location-error" role="alert">{error}</p>}
      {notice && <p className="location-notice" role="status">{notice}</p>}
      <p className="location-attribution">Location suggestions and address lookup by Google Maps Platform. Forecasts by Open-Meteo.</p>
    </div>
  )
}
