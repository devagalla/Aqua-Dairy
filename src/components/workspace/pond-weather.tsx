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

export function PondWeather({ ponds }: { ponds: WeatherPond[] }) {
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
        if (!response.ok) throw new Error(`Forecast unavailable (${response.status}).`)
        return await response.json() as WeatherResponse
      }).then(
        (data) => ({ status: 'fulfilled' as const, value: data }),
        (reason: unknown) => ({ status: 'rejected' as const, reason }),
      )

      let historyResult: PromiseSettledResult<HistoricalWeatherResponse>
      if (forecastResult.status === 'fulfilled') {
        const historyDate = previousLocalDate(forecastResult.value.daily.time[0])
        const historyUrl = new URL('https://archive-api.open-meteo.com/v1/archive')
        historyUrl.searchParams.set('latitude', String(pond.latitude))
        historyUrl.searchParams.set('longitude', String(pond.longitude))
        historyUrl.searchParams.set('hourly', 'temperature_2m,precipitation,cloud_cover,shortwave_radiation')
        historyUrl.searchParams.set('start_date', historyDate)
        historyUrl.searchParams.set('end_date', historyDate)
        historyUrl.searchParams.set('timezone', 'auto')
        historyResult = await fetch(historyUrl, { cache: 'no-store' }).then(async (response) => {
          if (!response.ok) throw new Error(`Historical weather unavailable (${response.status}).`)
          return await response.json() as HistoricalWeatherResponse
        }).then(
          (data) => ({ status: 'fulfilled' as const, value: data }),
          (reason: unknown) => ({ status: 'rejected' as const, reason }),
        )
      } else {
        historyResult = { status: 'rejected', reason: 'History unavailable because the forecast could not be loaded.' }
      }

      if (!cancelled) {
        setForecastByPond((current) => ({
          ...current,
          [pond.id]: {
            loading: false,
            historyLoading: false,
            ...(forecastResult.status === 'fulfilled'
              ? { data: forecastResult.value }
              : { error: forecastResult.reason instanceof Error ? forecastResult.reason.message : 'Could not load this forecast.' }),
            ...(historyResult.status === 'fulfilled'
              ? { history: historyResult.value }
              : { historyError: historyResult.reason instanceof Error ? historyResult.reason.message : 'Could not load historical weather.' }),
          },
        }))
      }
    }

    for (const pond of locatedPonds) void loadForecast(pond)
    return () => { cancelled = true }
  }, [ponds])

  if (ponds.length === 0) return null

  return (
    <section className="pond-weather-section">
      <div className="section-heading">
        <div><span className="eyebrow">WEATHER NEAR YOUR PONDS</span><h2>Local conditions &amp; forecast</h2><span className="telugu-subtitle" lang="te">మీ చెరువు దగ్గరి ప్రస్తుత వాతావరణం, రాబోయే ఏడు రోజుల అంచనా.</span></div>
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
      <p className="weather-attribution">Current conditions and forecast by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>, refreshed on load. The expandable hourly view shows yesterday&apos;s historical weather for the saved pond location.</p>
    </section>
  )
}
