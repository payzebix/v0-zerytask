export type MissionState = 'locked' | 'available' | 'completed' | 'expired' | 'pending_review'

export interface MissionStatusResult {
  state: MissionState
  message: string
  timeUntilAvailable?: number // milliseconds
  timeRemaining?: number // milliseconds
}

export function getMissionStatus(
  startDate?: string,
  startTime?: string,
  endDate?: string,
  endTime?: string,
  completionStatus?: 'completed' | 'pending_review' | 'not_started'
): MissionStatusResult {
  const now = new Date()

  // Check if completed or pending review
  if (completionStatus === 'completed') {
    return {
      state: 'completed',
      message: 'Mission completed',
    }
  }

  if (completionStatus === 'pending_review') {
    return {
      state: 'pending_review',
      message: 'Pending admin review',
    }
  }

  // Parse dates (times are optional and not used from DB, only for UI display)
  const startDateTime = startDate ? new Date(`${startDate}T00:00:00`) : null
  const endDateTime = endDate ? new Date(`${endDate}T23:59:59`) : null

  // Check if mission hasn't started yet
  if (startDateTime && now < startDateTime) {
    const timeUntilAvailable = startDateTime.getTime() - now.getTime()
    return {
      state: 'locked',
      message: `Available in ${formatTimeRemaining(timeUntilAvailable)}`,
      timeUntilAvailable,
    }
  }

  // Check if mission has expired
  if (endDateTime && now > endDateTime) {
    return {
      state: 'expired',
      message: 'Mission time expired',
    }
  }

  // Calculate time remaining
  let timeRemaining: number | undefined
  if (endDateTime) {
    timeRemaining = endDateTime.getTime() - now.getTime()
  }

  return {
    state: 'available',
    message: timeRemaining ? `${formatTimeRemaining(timeRemaining)} remaining` : 'Available',
    timeRemaining,
  }
}

export function formatTimeRemaining(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function getCountdownTimer(ms: number): { value: number; unit: string } {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return { value: days, unit: 'd' }
  if (hours > 0) return { value: hours, unit: 'h' }
  if (minutes > 0) return { value: minutes, unit: 'm' }
  return { value: seconds, unit: 's' }
}
