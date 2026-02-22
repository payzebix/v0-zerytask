/**
 * Level System Utility
 * 
 * Leveling formula:
 * - Start: Level 1
 * - Level 2: 100 XP required
 * - Level 3: 100 * 2.5 = 250 XP required
 * - Level 4: 250 * 2.5 = 625 XP required
 * - And so on... (double + 25%)
 * - Max level: 50
 */

const MAX_LEVEL = 50
const INITIAL_XP_REQUIREMENT = 100

/**
 * Calculate XP required to reach a specific level from the previous level
 * @param level - Target level (2-50)
 * @returns XP required to reach that level
 */
export function getXpRequiredForLevel(level: number): number {
  if (level < 2 || level > MAX_LEVEL) {
    return 0
  }

  let xpRequired = INITIAL_XP_REQUIREMENT
  
  // Calculate recursively from level 2 to target level
  for (let i = 3; i <= level; i++) {
    xpRequired = Math.floor(xpRequired * 2.5)
  }

  return xpRequired
}

/**
 * Calculate total cumulative XP needed to reach a specific level
 * @param level - Target level (1-50)
 * @returns Total XP needed from level 1
 */
export function getTotalXpForLevel(level: number): number {
  if (level < 1 || level > MAX_LEVEL) {
    return 0
  }

  if (level === 1) {
    return 0
  }

  let totalXp = 0
  for (let i = 2; i <= level; i++) {
    totalXp += getXpRequiredForLevel(i)
  }

  return totalXp
}

/**
 * Calculate current level based on total XP
 * @param totalXp - Total XP accumulated
 * @returns Current level (1-50)
 */
export function getLevelFromXp(totalXp: number): number {
  if (totalXp <= 0) {
    return 1
  }

  let currentXp = 0
  for (let level = 2; level <= MAX_LEVEL; level++) {
    const xpForThisLevel = getXpRequiredForLevel(level)
    if (currentXp + xpForThisLevel > totalXp) {
      return level - 1
    }
    currentXp += xpForThisLevel
  }

  return MAX_LEVEL
}

/**
 * Calculate progress to next level
 * @param totalXp - Total XP accumulated
 * @returns Object with current level, progress percentage, and XP details
 */
export function getProgressInfo(totalXp: number) {
  const currentLevel = getLevelFromXp(totalXp)
  
  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel: MAX_LEVEL,
      nextLevel: MAX_LEVEL,
      currentLevelTotalXp: getTotalXpForLevel(MAX_LEVEL),
      xpForNextLevel: 0,
      xpInCurrentLevel: totalXp - getTotalXpForLevel(MAX_LEVEL),
      progressPercentage: 100,
      isMaxLevel: true,
    }
  }

  const nextLevel = currentLevel + 1
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel)
  const xpForNextLevel = getTotalXpForLevel(nextLevel)
  const xpNeededThisLevel = getXpRequiredForLevel(nextLevel)
  const xpInCurrentLevel = totalXp - xpForCurrentLevel
  const progressPercentage = Math.floor((xpInCurrentLevel / xpNeededThisLevel) * 100)

  return {
    currentLevel,
    nextLevel,
    currentLevelTotalXp: xpForCurrentLevel,
    nextLevelTotalXp: xpForNextLevel,
    xpForNextLevel: xpNeededThisLevel,
    xpInCurrentLevel,
    xpRemaining: xpNeededThisLevel - xpInCurrentLevel,
    progressPercentage: Math.min(progressPercentage, 100),
    isMaxLevel: false,
  }
}

/**
 * Get all level information for display (used for UI)
 */
export function getAllLevelInfo() {
  const levels = []
  for (let level = 1; level <= MAX_LEVEL; level++) {
    levels.push({
      level,
      xpRequired: level === 1 ? 0 : getXpRequiredForLevel(level),
      totalXpNeeded: getTotalXpForLevel(level),
    })
  }
  return levels
}

export const LEVEL_SYSTEM = {
  MAX_LEVEL,
  INITIAL_XP_REQUIREMENT,
}
