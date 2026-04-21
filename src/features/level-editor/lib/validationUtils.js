import { GRID_HEIGHT } from './editorConstants'
import { getTileCategory } from './tileData'
import {submitEditorRequest} from "@/features/level-editor/lib/submitEditorUpdates.js";

// Categories that need ground support below them
const needsSupportCategories = new Set(['item', 'essential', 'enemy', 'decoration'])
// Categories that can support objects above them
const solidCategories = new Set(['ground', 'special', 'hazard', 'item'])
// GIDs that act like ground: don't need support and can support objects (exclamation marks)
const groundLikeGids = new Set([31, 32 , 41 , 42])
const uniqueObjectRules = [
  {
    key: 'startFlag',
    gids: new Set([69]),
    requiredErrorMessage: 'Level must have a Start Flag',
    duplicateErrorMessage: 'Level can only have one Start Flag',
    duplicateIssueMessage: 'There can only be one Start Flag.'
  },
  {
    key: 'exitDoor',
    gids: new Set([116, 117]),
    requiredErrorMessage: 'Level must have an Exit Door',
    duplicateErrorMessage: 'Level can only have one Exit Door',
    duplicateIssueMessage: 'There can only be one Exit Door.'
  }
]

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
  
  const category = getTileCategory(obj.gid)
  if (!needsSupportCategories.has(category)) return false
  
  // Bottom row has nothing below - objects there are always floating
  if (y >= GRID_HEIGHT - 1) return true
  return !isPositionSupported(worldLayer, objectLayer, x, y + 1)
}

export function getUniqueObjectStats(objectLayer) {
  const ruleCounts = new Map()
  const ruleEntries = new Map()
  for (const rule of uniqueObjectRules) {
    ruleCounts.set(rule.key, 0)
    ruleEntries.set(rule.key, [])
  }

  for (const [pos, obj] of objectLayer.entries()) {
    for (const rule of uniqueObjectRules) {
      if (rule.gids.has(obj.gid)) {
        ruleCounts.set(rule.key, ruleCounts.get(rule.key) + 1)
        ruleEntries.get(rule.key).push([pos, obj])
      }
    }
  }

  return { ruleCounts, ruleEntries }
}

function getUniqueRuleByGid(gid) {
  return uniqueObjectRules.find(rule => rule.gids.has(gid)) || null
}

export function getObjectIssue(worldLayer, objectLayer, x, y, uniqueStats = null) {
  const obj = objectLayer.get(`${x},${y}`)
  if (!obj) return null
  
  const uniqueRule = getUniqueRuleByGid(obj.gid)
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

export function validateLevel(worldLayer, objectLayer) {
  const errors = []
  const warnings = []

  const objectEntries = [...objectLayer.entries()]
  const uniqueStats = getUniqueObjectStats(objectLayer)
  const { ruleCounts, ruleEntries } = uniqueStats

  for (const rule of uniqueObjectRules) {
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