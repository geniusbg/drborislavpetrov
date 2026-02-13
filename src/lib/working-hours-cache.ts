/**
 * Глобален кеш за working-hours – една заявка на месец за целия таб.
 * Всички компоненти споделят същия кеш и in-flight promise.
 */
import type { WorkingHours } from '@/types/global'

const cache = new Map<string, WorkingHours[]>()
const inFlight = new Map<string, Promise<WorkingHours[]>>()

export async function fetchWorkingHoursCached(startDate: string, endDate: string): Promise<WorkingHours[]> {
  const key = `${startDate}-${endDate}`
  const cached = cache.get(key)
  if (cached) return cached

  let promise = inFlight.get(key)
  if (!promise) {
    promise = fetch(`/api/admin/working-hours?startDate=${startDate}&endDate=${endDate}`, {
      credentials: 'include'
    })
      .then((r) => (r.ok ? r.json() : { workingHours: [] }))
      .then((data: { workingHours: WorkingHours[] }) => {
        const list = data.workingHours ?? []
        cache.set(key, list)
        inFlight.delete(key)
        return list
      })
      .catch((err) => {
        inFlight.delete(key)
        throw err
      })
    inFlight.set(key, promise)
  }
  return promise
}

/** Изчисти кеша за диапазон (напр. при socket working-hours-updated) или целия кеш */
export function invalidateWorkingHoursCache(range?: { startDate: string; endDate: string }): void {
  if (range) {
    const key = `${range.startDate}-${range.endDate}`
    cache.delete(key)
    inFlight.delete(key)
  } else {
    cache.clear()
    inFlight.clear()
  }
}
