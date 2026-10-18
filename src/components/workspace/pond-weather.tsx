'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type WeatherPond = {
  id: string
  name: string
  locality: string | null
  latitude: number | null
  longitude: number | null
  farmName: string
}

type WeatherResponse = {
  current: {
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    precipitation: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
}

type ForecastState = { loading: boolean; error?: string; data?: WeatherResponse }

function weatherDescription(code: number) {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Weather update'
}

export function PondWeather({ ponds }: { ponds: WeatherPond[] }) {
  const [forecastByPond, setForecastByPond] = useState<Record<string, ForecastState>>({})

  useEffect(() => {
    let cancelled = false
    const locatedPonds = ponds.filter(
      (pond): pond is WeatherPond & { latitude: number; longitude: number } =>
        pond.latitude !== null && pond.longitude !== null,
    )
    setForecastByPond(Object.fromEntries(locatedPonds.map((pond) => [pond.id, { loading: true }])))

    async function loadForecast(pond: WeatherPond & { latitude: number; longitude: number }) {
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast')
        url.searchParams.set('latitude', String(pond.latitude))
        url.searchParams.set('longitude', String(pond.longitude))
        url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m')
        url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max')
        url.searchParams.set('timezone', 'auto')
        url.searchParams.set('forecast_days', '3')
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Forecast unavailable (${response.status}).`)
        const data = await response.json() as WeatherResponse
        if (!cancelled) setForecastByPond((current) => ({ ...current, [pond.id]: { loading: false, data } }))
      } catch (caught) {
        if (!cancelled) {
          setForecastByPond((current) => ({
            ...current,
            [pond.id]: {
              loading: false,
              error: caught instanceof Error ? caught.message : 'Could not load this forecast.',
            },
          }))
        }
      }
    }

    for (const pond of locatedPonds) void loadForecast(pond)
    return () => { cancelled = true }
  }, [ponds])

  if (ponds.length === 0) return null

  return (
    <section className="pond-weather-section">
      <div className="section-heading">
        <div><span className="eyebrow">WEATHER NEAR YOUR PONDS</span><h2>Local conditions &amp; forecast</h2><span className="telugu-subtitle" lang="te">మీ చెరువు దగ్గరి ప్రస్తుత వాతావరణం, రాబోయే మూడు రోజుల అంచనా.</span></div>
        <span className="section-meta">OPEN-METEO&nbsp; ↗</span>
      </div>
      <div className="pond-weather-grid">
        {ponds.map((pond) => {
          const forecast = forecastByPond[pond.id]
          return (
            <article className="card-surface pond-weather-card" key={pond.id}>
              <div className="weather-card-heading">
                <div><strong>{pond.name}</strong><span>{pond.farmName}{pond.locality ? ` · ${pond.locality}` : ''}</span></div>
                <span aria-hidden="true">☼</span>
              </div>
              {pond.latitude === null || pond.longitude === null ? (
                <div className="weather-empty">
                  <p>Add this pond&apos;s location to see local weather and temperature.</p>
                  <Link href="/ponds">Set pond location <span aria-hidden="true">→</span></Link>
                </div>
              ) : !forecast || forecast.loading ? (
                <p className="quiet-state">Loading local forecast…</p>
              ) : forecast.error ? (
                <p className="form-message error-message" role="alert">{forecast.error}</p>
              ) : forecast.data ? (
                <>
                  <div className="weather-current">
                    <strong>{Math.round(forecast.data.current.temperature_2m)}°</strong>
                    <div><span>{weatherDescription(forecast.data.current.weather_code)}</span><small>Feels like {Math.round(forecast.data.current.apparent_temperature)}°</small></div>
                  </div>
                  <div className="weather-details">
                    <span>Humidity <b>{forecast.data.current.relative_humidity_2m}%</b></span>
                    <span>Wind <b>{Math.round(forecast.data.current.wind_speed_10m)} km/h</b></span>
                    <span>Rain now <b>{forecast.data.current.precipitation} mm</b></span>
                  </div>
                  <div className="weather-days">
                    {forecast.data.daily.time.slice(0, 3).map((date, index) => (
                      <div key={date}>
                        <strong>{index === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</strong>
                        <span>{weatherDescription(forecast.data!.daily.weather_code[index])}</span>
                        <small>{Math.round(forecast.data!.daily.temperature_2m_max[index])}° / {Math.round(forecast.data!.daily.temperature_2m_min[index])}°</small>
                        <small>{forecast.data!.daily.precipitation_probability_max[index]}% rain</small>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </article>
          )
        })}
      </div>
      <p className="weather-attribution">Forecast by Open-Meteo. Weather is an estimate for the saved pond location.</p>
    </section>
  )
}
