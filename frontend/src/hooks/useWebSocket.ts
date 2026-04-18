"use client"

import { useCallback, useEffect, useState } from "react"

import { createSyntheticIncident, type SocIncident } from "@/lib/soc-data"

const PUSH_INTERVAL_MS = 8000

/**
 * Mock WebSocket: pushes synthetic login events on an interval (Kinesis + API GW simulation).
 */
export function useWebSocket(initial: SocIncident[]) {
  const [incidents, setIncidents] = useState<SocIncident[]>(initial)

  const pushSyntheticEvent = useCallback(() => {
    setIncidents((prev) => [createSyntheticIncident(), ...prev])
  }, [])

  useEffect(() => {
    const id = window.setInterval(pushSyntheticEvent, PUSH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [pushSyntheticEvent])

  return { incidents, setIncidents, pushSyntheticEvent }
}
