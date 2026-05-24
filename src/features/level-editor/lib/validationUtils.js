import { GRID_HEIGHT } from './editorConstants'
import { getTileCategoryByTileId } from './tileData'
import {
  BOX_TILE_IDS,
  COIN_TILE_IDS,
  FLYING_TILE_IDS,
  UNIQUE_OBJECT_RULES,
  needsSupportCategories,
  solidCategories,
  CLEAR_CONDITION_TILE_IDS,
} from './editorTilePolicy'
import { validateClearConditionInput } from '@/features/profile/lib/clearConditionContract'

const clearConditionObjectMatchers = {
  coin: (obj) => COIN_TILE_IDS.has(obj.tileId) || Boolean(obj.content),
  box: (obj) => BOX_TILE_IDS.has(obj.tileId),
  slime: (obj) => obj.tileId === CLEAR_CONDITION_TILE_IDS.slime,
  snail: (obj) => obj.tileId === CLEAR_CONDITION_TILE_IDS.snail,
  bee: (obj) => obj.tileId === CLEAR_CONDITION_TILE_IDS.bee,
}
const clearConditionLabels = {
  coin: ['coin', 'coins'],
  box: ['box', 'boxes'],
  slime: ['slime', 'slimes'],
  snail: ['snail', 'snails'],
  bee: ['bee', 'bees'],
}

function isPositionSupported(worldLayer, objectLayer, x, y) {
  if (y >= GRID_HEIGHT) return false
  const belowGround = worldLayer.get(`${x},${y}`)
  if (belowGround) return true
  const belowObj = objectLayer.get(`${x},${y}`)
  if (!belowObj) return false
  if (BOX_TILE_IDS.has(belowObj.tileId)) return true
  const belowCat = getTileCategoryByTileId(belowObj.tileId)
  if (solidCategories.has(belowCat)) return true
  return false
}

export function isObjectFloating(worldLayer, objectLayer, x, y) {
  const obj = objectLayer.get(`${x},${y}`)
  if (!obj) return false

  // Ground-like objects don't need support
  if (BOX_TILE_IDS.has(obj.tileId)) return false

  // Flying enemies don't need ground support
  if (FLYING_TILE_IDS.has(obj.tileId)) return false

  const category = getTileCategoryByTileId(obj.tileId)
  if (!needsSupportCategories.has(category)) return false

  // Bottom row has nothing below - objects there are always floating
  if (y >= GRID_HEIGHT - 1) return true
  return !isPositionSupported(worldLayer, objectLayer, x, y + 1)
}

export function getUniqueObjectStats(objectLayer) {
  const ruleCounts = new Map()
  const ruleEntries = new Map()
  for (const rule of UNIQUE_OBJECT_RULES) {
    ruleCounts.set(rule.key, 0)
    ruleEntries.set(rule.key, [])
  }

  for (const [pos, obj] of objectLayer.entries()) {
    for (const rule of UNIQUE_OBJECT_RULES) {
      if (rule.tileIds.has(obj.tileId)) {
        ruleCounts.set(rule.key, ruleCounts.get(rule.key) + 1)
        ruleEntries.get(rule.key).push([pos, obj])
      }
    }
  }

  return { ruleCounts, ruleEntries }
}

function getUniqueRuleByTileId(tileId) {
  return UNIQUE_OBJECT_RULES.find(rule => rule.tileIds.has(tileId)) || null
}

export function getObjectIssue(worldLayer, objectLayer, x, y, uniqueStats = null) {
  const obj = objectLayer.get(`${x},${y}`)
  if (!obj) return null
  
  const uniqueRule = getUniqueRuleByTileId(obj.tileId)
  if (uniqueRule) {
    const stats = uniqueStats || getUniqueObjectStats(objectLayer)
    const uniqueCount = stats.ruleCounts.get(uniqueRule.key) || 0
    if (uniqueCount > 1) {
      return { type: 'unique', message: uniqueRule.duplicateIssueMessage }
    }
  }

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

  const objectEntries = [...objectLayer.entries()]
  const uniqueStats = getUniqueObjectStats(objectLayer)
  const { ruleCounts, ruleEntries } = uniqueStats
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

  for (const rule of UNIQUE_OBJECT_RULES) {
    const count = ruleCounts.get(rule.key) || 0
    if (count === 0) {
      errors.push({ message: rule.requiredErrorMessage })
    } else if (count > 1) {
      errors.push({ message: rule.duplicateErrorMessage })
    }
  }

  const tileErrors = []
  for (const [pos] of objectEntries) {
    const [x, y] = pos.split(',').map(Number)
    const issue = getObjectIssue(worldLayer, objectLayer, x, y, uniqueStats)
    if (issue) {
      if (issue.type === 'unique') continue
      tileErrors.push({ message: `${issue.message.charAt(0).toUpperCase() + issue.message.slice(1)} at (${x},${y})`, x, y, type: issue.type })
    }
  }
  tileErrors.sort((a, b) => a.x - b.x)
  errors.push(...tileErrors)


  if (worldLayer.size === 0) {
    warnings.push({ message: 'Level has no ground tiles' })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
