// This file contains utility functions for normalizing text values in the LevelListElement component.

export function normalizeText(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}