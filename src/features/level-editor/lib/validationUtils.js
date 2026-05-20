import { GRID_HEIGHT } from './editorConstants'
import { getTileCategory } from './tileData'
import { validateClearConditionInput } from '@/features/profile/lib/clearConditionContract'

// Categories that need ground support below them
const needsSupportCategories = new Set(['item', 'essential', 'enemy', 'decoration'])
// Categories that can support objects above them
const solidCategories = new Set(['ground', 'special', 'hazard', 'item'])
// GIDs that act like ground: don't need support and can support objects (exclamation marks)
const groundLikeGids = new Set([31, 32 , 41 , 42])
// GIDs that are flying enemies and don't need ground support
const flyingGids = new Set([93])
const boxGids = new Set([41, 42])
const coinGids = new Set([109, 119, 129])
const clearConditionObjectMatchers = {
  coin: (obj) => coinGids.has(obj.gid) || Boolean(obj.content),
  box: (obj) => boxGids.has(obj.gid),
  slime: (obj) => obj.gid === 91,
  snail: (obj) => obj.gid === 92,
}
const clearConditionLabels = {
  coin: ['coin', 'coins'],
  box: ['box', 'boxes'],
  slime: ['slime', 'slimes'],
  snail: ['snail', 'snails'],
}

function isPositionSupported(worldLayer, objectLayer, x, y) {
  if (y >= GRID_HEIGHT) return false
  const belowGround = worldLayer.get(`${x},${y}`)
  if (belowGround) return true
  const belowObj = objectLayer.get(`${x},${y}`)
  if (!belowObj) return false
  if (groundLikeGids.has(belowObj.gid)) return true
  const belowCat = getTileCategory(belowObj.gid)
  if (solidCategories.has(belowCat)) return true
  return false
}

export function isObjectFloating(worldLayer, objectLayer, x, y) {
  const obj = objectLayer.get(`${x},${y}`)
  if (!obj) return false

  // Ground-like objects don't need support
  if (groundLikeGids.has(obj.gid)) return false

  // Flying enemies don't need ground support
  if (flyingGids.has(obj.gid)) return false

  const category = getTileCategory(obj.gid)
  if (!needsSupportCategories.has(category)) return false

  // Bottom row has nothing below - objects there are always floating
  if (y >= GRID_HEIGHT - 1) return true
  return !isPositionSupported(worldLayer, objectLayer, x, y + 1)
}

export function getObjectIssue(worldLayer, objectLayer, x, y) {
  const obj = objectLayer.get(`${x},${y}`)
  if (!obj) return null
  
  const ground = worldLayer.get(`${x},${y}`)
  if (ground) return { type: 'overlap', message: 'This object overlaps with a ground tile.' }
  
  if (isObjectFloating(worldLayer, objectLayer, x, y)) {
    return { type: 'floating', message: 'This object has no ground support below it.' }
  }
  
  return null
}

function countObjectsForClearCondition(objectEntries, conditionType) {
  const matcher = clearConditionObjectMatchers[conditionType]
  if (!matcher) return 0

  return objectEntries.reduce((count, [_, obj]) => (
    matcher(obj) ? count + 1 : count
  ), 0)
}

export function validateLevel(worldLayer, objectLayer, clearCondition = { type: 'none', amount: 0 }) {
  const errors = []
  const warnings = []

  const startFlagGid = 69
  const doorClosedGid = 116
  const doorOpenGid = 117

  const objectEntries = [...objectLayer.entries()]
  const clearConditionType = clearCondition.type ?? 'none'
  const clearConditionAmount = clearCondition.amount ?? 0

  const clearConditionInputError = validateClearConditionInput(
    clearConditionType,
    clearConditionAmount,
  )
  if (clearConditionInputError) {
    errors.push({ message: clearConditionInputError })
  } else if (clearConditionType !== 'none') {
    const availableCount = countObjectsForClearCondition(objectEntries, clearConditionType)
    const [singularLabel, pluralLabel] = clearConditionLabels[clearConditionType] ?? [clearConditionType, `${clearConditionType}s`]
    if (availableCount < clearConditionAmount) {
      errors.push({
        message: `Clear condition requires ${clearConditionAmount} ${clearConditionAmount === 1 ? singularLabel : pluralLabel}, but the level only has ${availableCount}.`,
      })
    }
  }

  const startFlags = objectEntries.filter(([_, obj]) => obj.gid === startFlagGid)
  if (startFlags.length === 0) {
    errors.push({ message: 'Level must have a Start Flag' })
  } else if (startFlags.length > 1) {
    errors.push({ message: 'Level can only have one Start Flag' })
  }

  const exitDoors = objectEntries.filter(
    ([_, obj]) => obj.gid === doorClosedGid || obj.gid === doorOpenGid
  )
  if (exitDoors.length === 0) {
    errors.push({ message: 'Level must have an Exit Door' })
  }

  const tileErrors = []
  for (const [pos] of objectEntries) {
    const [x, y] = pos.split(',').map(Number)
    const issue = getObjectIssue(worldLayer, objectLayer, x, y)
    if (issue) {
      tileErrors.push({ message: `${issue.message.charAt(0).toUpperCase() + issue.message.slice(1)} at (${x},${y})`, x, y, type: issue.type })
    }
  }
  tileErrors.sort((a, b) => a.x - b.x)
  errors.push(...tileErrors)

  if (startFlags.length === 1) {
    const [pos] = startFlags[0]
    const [x, y] = pos.split(',').map(Number)
    const belowPos = `${x},${y + 1}`
    if (!worldLayer.has(belowPos) && y + 1 < GRID_HEIGHT) {
      warnings.push({ message: 'Start Flag should be placed above ground', x, y })
    }
  }

  if (worldLayer.size === 0) {
    warnings.push({ message: 'Level has no ground tiles' })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
