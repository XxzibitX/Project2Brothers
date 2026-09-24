import { useMemo } from "react"

export function useDefaultDateRange() {
  return useMemo(() => {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - 1)
    from.setUTCHours(0, 0, 0, 0)
    const to = new Date(today)
    to.setUTCHours(23, 59, 59, 999)
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
  }, [])
}