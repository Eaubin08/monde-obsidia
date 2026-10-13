import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {liveDirectory} from './live-events.mjs'

export const defaultStateFile = resolve(liveDirectory, 'cssa_sport_state.json')

const DEFAULT_STATE = {
  version: 'CSSA_SPORT_STATE_V1',
  updatedAt: new Date().toISOString(),
  notes: {},
  checks: {},
  reviewed: {},
  tasks: {}
}

export function readCssaSportState(filePath = defaultStateFile) {
  if (!existsSync(filePath)) {
    return {...DEFAULT_STATE}
  }
  try {
    const raw = readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      version: parsed.version || DEFAULT_STATE.version,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      notes: typeof parsed.notes === 'object' && parsed.notes ? parsed.notes : {},
      checks: typeof parsed.checks === 'object' && parsed.checks ? parsed.checks : {},
      reviewed: typeof parsed.reviewed === 'object' && parsed.reviewed ? parsed.reviewed : {},
      tasks: typeof parsed.tasks === 'object' && parsed.tasks ? parsed.tasks : {}
    }
  } catch {
    return {...DEFAULT_STATE}
  }
}

export function writeCssaSportState(patch = {}, filePath = defaultStateFile) {
  const current = readCssaSportState(filePath)
  const next = {
    version: DEFAULT_STATE.version,
    updatedAt: new Date().toISOString(),
    notes: {...current.notes, ...(patch.notes || {})},
    checks: {
      ...current.checks,
      ...Object.fromEntries(
        Object.entries(patch.checks || {}).map(([matchId, matchChecks]) => [
          matchId,
          {...(current.checks[matchId] || {}), ...matchChecks}
        ])
      )
    },
    reviewed: {...current.reviewed, ...(patch.reviewed || {})},
    tasks: patch.tasks !== undefined ? {...current.tasks, ...patch.tasks} : current.tasks
  }

  const dir = resolve(filePath, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
  writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8')
  return next
}
