'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface FarmContextType {
  farmerName: string
  farmName: string
  location: string
  ponds: PondSummary[]
  activePondId: string | null
  activePond: PondSummary | null
  setActivePondId: (id: string) => void
  loading: boolean
  refresh: () => Promise<void>
}

export interface PondSummary {
  id: string
  name: string
  areaAcres: number | null
  farmId: string
  farmName: string
  locality: string | null
  activeCycle?: {
    id: string
    stockingDate: string
    seedStocked: number
    pl: string | null
    targetDays: number | null
    doc: number
  }
}

const STORAGE_ACTIVE_POND_KEY = 'aqua_dairy_active_pond_id'

const FarmContext = createContext<FarmContextType | null>(null)

export function useFarm() {
  const ctx = useContext(FarmContext)
  if (!ctx) {
    throw new Error('useFarm must be used within a FarmProvider')
  }
  return ctx
}

export function FarmProvider({
  userId,
  userEmail,
  children,
}: {
  userId: string
  userEmail: string
  children: React.ReactNode
}) {
  const [ponds, setPonds] = useState<PondSummary[]>([])
  const [activePondId, setActivePondIdState] = useState<string | null>(null)
  const [farmerName, setFarmerName] = useState<string>('')
  const [farmName, setFarmName] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const setActivePondId = useCallback((id: string) => {
    setActivePondIdState(id)
    try {
      localStorage.setItem(STORAGE_ACTIVE_POND_KEY, id)
    } catch {
      // localStorage disabled / private mode
    }
  }, [])

  const loadFarmData = useCallback(async () => {
    try {
      const [farmRes, pondRes, cycleRes, profileRes] = await Promise.all([
        supabase.from('farms').select('id, name, region').order('created_at'),
        supabase
          .from('ponds')
          .select('id, name, area_acres, farm_id, locality, farms(name)')
          .order('created_at'),
        supabase
          .from('culture_cycles')
          .select('id, pond_id, stocking_date, target_harvest_days, seed_stocked, pl, status')
          .eq('status', 'active'),
        supabase
          .from('profiles')
          .select('full_name, farmer_name')
          .eq('id', userId)
          .maybeSingle(),
      ])

      const firstFarm = farmRes.data?.[0]
      const derivedFarmName = firstFarm?.name || 'Coastal Aqua Farm'
      const derivedLocation = firstFarm?.region || 'Andhra Pradesh'
      setFarmName(derivedFarmName)
      setLocation(derivedLocation)

      const profileData = profileRes.data as { full_name?: string; farmer_name?: string } | null

      // Farmer Name logic:
      // 1. Profile farmer_name
      // 2. Profile full_name
      // 3. User email prefix - ONLY if no profile name exists
      const derivedFarmerName =
        profileData?.farmer_name ||
        profileData?.full_name ||
        'Farmer'
      setFarmerName(derivedFarmerName)

      const activeCyclesByPond = new Map<string, any>()
      ;(cycleRes.data || []).forEach((c) => {
        activeCyclesByPond.set(c.pond_id, c)
      })

      const loadedPonds: PondSummary[] = (pondRes.data || []).map((p: any) => {
        const cycle = activeCyclesByPond.get(p.id)
        let activeCycleInfo: PondSummary['activeCycle']
        if (cycle) {
          const stockingMs = Date.parse(`${cycle.stocking_date}T00:00:00Z`)
          const doc = Math.max(0, Math.floor((Date.now() - stockingMs) / 86_400_000))
          activeCycleInfo = {
            id: cycle.id,
            stockingDate: cycle.stocking_date,
            seedStocked: cycle.seed_stocked,
            pl: cycle.pl,
            targetDays: cycle.target_harvest_days,
            doc,
          }
        }
        return {
          id: p.id,
          name: p.name,
          areaAcres: p.area_acres,
          farmId: p.farm_id,
          farmName: p.farms?.name || derivedFarmName,
          locality: p.locality,
          activeCycle: activeCycleInfo,
        }
      })

      setPonds(loadedPonds)

      // Restore active pond from localStorage or fallback to first
      let chosenId: string | null = null
      try {
        chosenId = localStorage.getItem(STORAGE_ACTIVE_POND_KEY)
      } catch {
        // ignore
      }
      if (!chosenId || !loadedPonds.some((p) => p.id === chosenId)) {
        chosenId = loadedPonds[0]?.id || null
      }
      setActivePondIdState(chosenId)
    } finally {
      setLoading(false)
    }
  }, [userId, userEmail])

  useEffect(() => {
    void loadFarmData()
  }, [loadFarmData])

  const activePond = useMemo(
    () => ponds.find((p) => p.id === activePondId) || null,
    [ponds, activePondId]
  )

  const value = useMemo(
    () => ({
      farmerName,
      farmName,
      location,
      ponds,
      activePondId,
      activePond,
      setActivePondId,
      loading,
      refresh: loadFarmData,
    }),
    [
      farmerName,
      farmName,
      location,
      ponds,
      activePondId,
      activePond,
      setActivePondId,
      loading,
      loadFarmData,
    ]
  )

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}
