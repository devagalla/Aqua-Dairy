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

function locationSearchError(caught: unknown) {
  const detail = caught instanceof Error ? caught.message : String(caught)
  if (
    detail.includes('Places API (New)') &&
    (detail.includes('not been used') || detail.includes('disabled'))
  ) {
    return 'Google Places API (New) is not enabled for this Google Cloud project. Enable it in Google Cloud Console → APIs & Services → Library. Adding it to the API key restrictions alone does not enable the API.'
  }
  if (detail.includes('PERMISSION_DENIED')) {
    return `Google Places rejected this key. Check that Places API (New) is enabled for its project and allowed in this key's API restrictions. ${detail}`
  }
  return detail || 'Could not search for this location.'
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

// --- New: Caching & Fallback Utilities ---

const LOCATION_CACHE_KEY = 'pond_location_cache_v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCachedLocations(): PondLocation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY)
    if (!raw) return []
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(LOCATION_CACHE_KEY)
      return []
    }
    return data
  } catch {
    return []
  }
}

function saveToCache(location: PondLocation) {
  if (typeof window === 'undefined') return
  try {
    const cached = getCachedLocations()
    const filtered = cached.filter(l => l.label !== location.label)
    const updated = [location, ...filtered].slice(0, 10)
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ data: updated, timestamp: Date.now() }))
  } catch {
    // ignore storage errors
  }
}

async function searchNominatim(query: string): Promise<PondLocation[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=5&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!res.ok) throw new Error('Nominatim request failed')
    const data = await res.json()
    return data.map((item: any) => ({
      label: item.display_name.split(',').slice(0, 3).join(', '),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }))
  } catch {
    return []
  }
}

async function geocodeNominatim(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address || {}
    return [addr.village, addr.town, addr.city, addr.county, addr.state].filter(Boolean).slice(0, 2).join(', ')
  } catch {
    return null
  }
}

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 500): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < maxRetries) {
        const isRateLimit = e instanceof Error && (e.message.includes('OVER_QUERY_LIMIT') || e.message.includes('429'))
        const delay = isRateLimit ? baseDelay * Math.pow(2, attempt) * 2 : baseDelay * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
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
        let results: PondLocation[] = []
        let usedFallback = false

        if (key) {
          try {
            const maps = await loadGoogleMaps(key)
            const places = await maps.importLibrary('places') as GooglePlacesLibrary
            const result = await retryWithBackoff(() =>
              places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: search,
                includedRegionCodes: ['in'],
              })
            )
            results = (result.suggestions ?? []).flatMap((suggestion) =>
              suggestion.placePrediction
                ? [{ label: suggestion.placePrediction.text.toString(), latitude: 0, longitude: 0, _prediction: suggestion.placePrediction }]
                : [],
            )
          } catch (googleError) {
            console.warn('Google Places autocomplete failed, falling back to Nominatim:', googleError)
            usedFallback = true
            results = await searchNominatim(search)
          }
        } else {
          results = await searchNominatim(search)
          usedFallback = true
        }

        if (!controller.signal.aborted) {
          // Convert to GooglePlacePrediction-like objects for compatibility
          setSuggestions(
            results.map((r: any) => ({
              text: { toString: () => r.label },
              toPlace: () => ({
                formattedAddress: r.label,
                location: { lat: () => r.latitude, lng: () => r.longitude },
                fetchFields: async () => {},
              }),
            }))
          )
          if (usedFallback) {
            setNotice('Using OpenStreetMap for location search (Google Places unavailable).')
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) return
        setError(locationSearchError(caught))
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
      saveToCache(location)
      setNotice('Location saved for this pond.')
    } catch (caught) {
      setError(locationSearchError(caught))
    }
  }

  async function chooseLocation(prediction: GooglePlacePrediction) {
    setBusy(true)
    setSuggestions([])
    setError('')
    setNotice('')
    try {
      const place = prediction.toPlace()
      // Check if this is a Nominatim fallback result (has no fetchFields or lat/lng directly)
      const hasRealLocation = typeof place.location?.lat === 'function' && place.location.lat() !== 0
      
      if (hasRealLocation) {
        await place.fetchFields({ fields: ['formattedAddress', 'location'] })
      }
      
      const lat = place.location?.lat() ?? 0
      const lng = place.location?.lng() ?? 0
      
      if (!hasRealLocation || lat === 0 || lng === 0) {
        // Need to geocode via Nominatim
        const query = prediction.text.toString()
        const results = await searchNominatim(query)
        if (results.length > 0) {
          await saveLocation(results[0])
          return
        }
        throw new Error('Could not find coordinates for this location.')
      }
      
      await saveLocation({
        label: place.formattedAddress ?? prediction.text.toString(),
        latitude: lat,
        longitude: lng,
      })
    } catch (caught) {
      setError(locationSearchError(caught))
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
      
      // Try Google first if key available, fallback to Nominatim
      let label: string
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (key) {
        try {
          const maps = await loadGoogleMaps(key)
          const geocoder = new maps.Geocoder()
          const { results } = await retryWithBackoff(() =>
            geocoder.geocode({ location: { lat: latitude, lng: longitude } })
          )
          const address = results[0]
          const locality = address?.address_components.find((component) =>
            component.types.some((type) => ['locality', 'postal_town', 'sublocality', 'administrative_area_level_3'].includes(type)),
          )?.long_name
          const state = address?.address_components.find((component) =>
            component.types.includes('administrative_area_level_1'),
          )?.long_name
          label = [locality, state].filter(Boolean).join(', ') || address?.formatted_address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        } catch (googleError) {
          console.warn('Google reverse geocoding failed, falling back to Nominatim:', googleError)
          const nominatimLabel = await geocodeNominatim(latitude, longitude)
          label = nominatimLabel || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          setNotice('Using OpenStreetMap for address lookup (Google Maps unavailable).')
        }
      } else {
        const nominatimLabel = await geocodeNominatim(latitude, longitude)
        label = nominatimLabel || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      }
      
      await saveLocation({ label, latitude, longitude })
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
        : locationSearchError(caught)
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
      {(() => {
        const recent = getCachedLocations()
        if (recent.length > 0 && !chosenLabel && query.trim().length < 3) {
          return (
            <div className="recent-locations" style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 8 }}>Recent locations</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recent.map((loc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void saveLocation(loc)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      background: 'var(--color-surface)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          )
        }
        return null
      })()}
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
