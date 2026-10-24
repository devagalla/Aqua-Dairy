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
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    precipitation: number
    cloud_cover: number
    shortwave_radiation: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
    cloud_cover_mean: number[]
    shortwave_radiation_sum: number[]
  }
}

type HistoricalWeatherResponse = {
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation: number[]
    cloud_cover: number[]
    shortwave_radiation: number[]
  }
}

type ForecastState = {
  loading: boolean
  error?: string
  data?: WeatherResponse
  historyLoading: boolean
  historyError?: string
  history?: HistoricalWeatherResponse
}

function previousLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - 1, 12)).toISOString().slice(0, 10)
}

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

// Compact card for ponds without coordinates
function PondWeatherUnconfigured({ pond }: { pond: WeatherPond }) {
  return (
    <article className="card-surface pond-weather-card pond-weather-card--compact">
      <div className="weather-card-heading">
        <div>
          <strong>{pond.name}</strong>
          <span>{pond.locality ? `${pond.locality}, ${pond.farmName}` : pond.farmName}</span>
        </div>
        <span className="weather-location-badge" aria-label="Location not set">📍</span>
      </div>
      <div className="weather-empty">
        <p className="quiet-state">Location not set — weather unavailable</p>
        <Link href={`/ponds?edit=${pond.id}`} className="btn-set-location">
          <span aria-hidden="true">📍</span> Set Location
        </Link>
      </div>
    </article>
  )
}

export function PondWeather({ ponds, activePondId }: { ponds: WeatherPond[]; activePondId?: string | null }) {
  const [forecastByPond, setForecastByPond] = useState<Record<string, ForecastState>>({})

  useEffect(() => {
    let cancelled = false
    const locatedPonds = ponds.filter(
      (pond): pond is WeatherPond & { latitude: number; longitude: number } =>
        pond.latitude !== null && pond.longitude !== null,
    )
    setForecastByPond(Object.fromEntries(locatedPonds.map((pond) => [pond.id, {
      loading: true,
      historyLoading: true,
    }])))

    async function loadForecast(pond: WeatherPond & { latitude: number; longitude: number }) {
      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
      forecastUrl.searchParams.set('latitude', String(pond.latitude))
      forecastUrl.searchParams.set('longitude', String(pond.longitude))
      forecastUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,cloud_cover,shortwave_radiation,weather_code,wind_speed_10m')
      forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,cloud_cover_mean,shortwave_radiation_sum')
      forecastUrl.searchParams.set('timezone', 'auto')
      forecastUrl.searchParams.set('forecast_days', '7')

      const forecastResult = await fetch(forecastUrl, { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error(`Forecast unavailable (${response.status})`)
        return response.json() as Promise<WeatherResponse>
      })

      const historyUrl = new URL('https://api.open-meteo.com/v1/forecast')
      historyUrl.searchParams.set('latitude', String(pond.latitude))
      historyUrl.searchParams.set('longitude', String(pond.longitude))
      const yesterday = previousLocalDate(forecastResult.current.time.slice(0, 10))
      historyUrl.searchParams.set('start_date', yesterday)
      historyUrl.searchParams.set('end_date', yesterday)
      historyUrl.searchParams.set('hourly', 'temperature_2m,precipitation,cloud_cover,shortwave_radiation')
      historyUrl.searchParams.set('timezone', 'auto')

      const historyResult = await fetch(historyUrl, { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error(`Historical data unavailable (${response.status})`)
        return response.json() as Promise<HistoricalWeatherResponse>
      })

      if (!cancelled) {
        setForecastByPond((prev) => ({
          ...prev,
          [pond.id]: { loading: false, data: forecastResult, historyLoading: false, history: historyResult },
        }))
      }
    }

    locatedPonds.forEach((pond) => loadForecast(pond))

    return () => {
      cancelled = true
    }
  }, [ponds])

  // Sort ponds: active pond first (if located), then other located ponds, then unconfigured ponds
  const activePond = ponds.find(p => p.id === activePondId)
  const otherLocatedPonds = ponds.filter(
    p => p.id !== activePondId && p.latitude !== null && p.longitude !== null
  )
  const unconfiguredPonds = ponds.filter(p => p.latitude === null || p.longitude === null)

  const displayPonds = [
    ...(activePond && activePond.latitude !== null && activePond.longitude !== null ? [activePond] : []),
    ...otherLocatedPonds,
    ...unconfiguredPonds,
  ]

  return (
    <section className="pond-weather-section">
      <div className="section-heading">
        <div><span className="eyebrow">WEATHER WATCH</span><h2>Pond Weather</h2></div>
        <span className="section-meta">LIVE CONDITIONS + 7-DAY OUTLOOK&nbsp; ↘</span>
      </div>
      <div className="pond-weather-grid">
        {displayPonds.map((pond) => {
          const isActive = pond.id === activePondId
          const hasCoordinates = pond.latitude !== null && pond.longitude !== null

          if (!hasCoordinates) {
            return <PondWeatherUnconfigured key={pond.id} pond={pond} />
          }

          const forecast = forecastByPond[pond.id]

          return (
            <article
              key={pond.id}
              className={`card-surface pond-weather-card${isActive ? ' pond-weather-card--active' : ''}`}
            >
              <div className="weather-card-heading">
                <div>
                  <strong>{pond.name}</strong>
                  <span>{pond.locality ? `${pond.locality}, ${pond.farmName}` : pond.farmName}</span>
                </div>
                <span aria-hidden="true">☀</span>
              </div>
              {forecast?.loading ? (
                <p className="quiet-state">Loading weather…</p>
              ) : forecast?.error ? (
                <p className="form-message error-message" role="alert">{forecast.error}</p>
              ) : forecast?.data ? (
                <>
                  <div className="weather-current">
                    <strong>{Math.round(forecast.data.current.temperature_2m)}°</strong>
                    <div>
                      <span>{weatherDescription(forecast.data.current.weather_code)}</span>
                      <small>Feels like {Math.round(forecast.data.current.apparent_temperature)}°</small>
                      <small>Updated today at {forecast.data.current.time.slice(-5)} local time</small>
                    </div>
                  </div>
                  <div className="weather-details">
                    <span>Humidity <b>{forecast.data.current.relative_humidity_2m}%</b></span>
                    <span>Wind <b>{Math.round(forecast.data.current.wind_speed_10m)} km/h</b></span>
                    <span>Rain now <b>{forecast.data.current.precipitation} mm</b></span>
                    <span>Cloud cover <b>{forecast.data.current.cloud_cover}%</b></span>
                    <span>Solar radiation <b>{Math.round(forecast.data.current.shortwave_radiation)} W/m²</b></span>
                  </div>
                  <div className="weather-days">
                    {forecast.data.daily.time.slice(0, 7).map((date, index) => (
                      <div key={date}>
                        <strong>{index === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</strong>
                        <span>{weatherDescription(forecast.data!.daily.weather_code[index])}</span>
                        <small>{Math.round(forecast.data!.daily.temperature_2m_max[index])}° / {Math.round(forecast.data!.daily.temperature_2m_min[index])}°</small>
                        <small>{forecast.data!.daily.precipitation_probability_max[index]}% rain</small>
                        <small>{forecast.data!.daily.precipitation_sum[index].toFixed(1)} mm · {forecast.data!.daily.cloud_cover_mean[index]}% clouds</small>
                        <small>{Math.round(forecast.data!.daily.shortwave_radiation_sum[index])} Wh/m² solar</small>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {forecast?.historyLoading ? (
                <p className="quiet-state weather-history-state">Loading hourly historical weather…</p>
              ) : forecast?.history ? (
                <details className="weather-history">
                  <summary>Yesterday · {forecast.history.hourly.time[0]?.slice(0, 10) ?? 'recent day'}</summary>
                  <div className="weather-history-grid">
                    {forecast.history.hourly.time.map((time, index) => (
                      <div key={time}>
                        <strong>{time.slice(-5)}</strong>
                        <span>{Math.round(forecast.history!.hourly.temperature_2m[index])}°C</span>
                        <small>{forecast.history!.hourly.precipitation[index]} mm rain</small>
                        <small>{forecast.history!.hourly.cloud_cover[index]}% clouds</small>
                        <small>{Math.round(forecast.history!.hourly.shortwave_radiation[index])} W/m² solar</small>
                      </div>
                    ))}
                  </div>
                </details>
              ) : forecast?.historyError ? (
                <p className="form-message error-message weather-history-state" role="alert">{forecast.historyError}</p>
              ) : null}
            </article>
          )
        })}
      </div>
      <p className="weather-attribution">Current conditions and forecast by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>, refreshed on load. The expandable hourly view shows yesterday's historical weather for the saved pond location.</p>
    </section>
  )
}