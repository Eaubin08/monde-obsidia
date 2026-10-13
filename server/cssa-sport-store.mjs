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

import {syncSportTasksToOps, readCssaOpsState, defaultOpsFile} from './cssa-ops-store.mjs'

export function readCssaSportState(filePath = defaultStateFile, opsFilePath = null) {
  let baseState = {...DEFAULT_STATE}
  if (existsSync(filePath)) {
    try {
      const raw = readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      baseState = {
        version: parsed.version || DEFAULT_STATE.version,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        notes: typeof parsed.notes === 'object' && parsed.notes ? parsed.notes : {},
        checks: typeof parsed.checks === 'object' && parsed.checks ? parsed.checks : {},
        reviewed: typeof parsed.reviewed === 'object' && parsed.reviewed ? parsed.reviewed : {},
        tasks: typeof parsed.tasks === 'object' && parsed.tasks ? parsed.tasks : {}
      }
    } catch {
      baseState = {...DEFAULT_STATE}
    }
  }

  // Fusionner les tâches des opérations globales qui pointent vers ce match si en live ou si ops file spécifié
  const targetOps = opsFilePath || (filePath === defaultStateFile ? defaultOpsFile : resolve(filePath, '..', 'cssa_ops_state.json'))
  if (existsSync(targetOps) || (filePath === defaultStateFile && !opsFilePath)) {
    try {
      const ops = readCssaOpsState(targetOps)
      const mergedTasks = {...baseState.tasks}
      for (const t of ops.tasks) {
        if (t.matchRef) {
          const list = mergedTasks[t.matchRef] || []
          const existingIdx = list.findIndex(item => item.id === t.id)
          const matchTask = {
            id: t.id,
            label: t.title,
            done: t.status === 'TERMINE',
            createdAt: t.history?.[0]?.at || new Date().toISOString(),
            status: t.status,
            priority: t.priority,
            dueAt: t.dueAt,
            origin: t.origin,
            responsible: t.responsible,
            source: t.source,
            truthClass: t.truthClass,
            notes: t.notes
          }
          if (existingIdx >= 0) {
            list[existingIdx] = {...list[existingIdx], ...matchTask}
          } else {
            list.push(matchTask)
          }
          mergedTasks[t.matchRef] = list
        }
      }
      baseState.tasks = mergedTasks
    } catch {}
  }

  return baseState
}

export function writeCssaSportState(patch = {}, filePath = defaultStateFile, opsFilePath = null) {
  const current = readCssaSportState(filePath, opsFilePath)
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

  if (patch.tasks) {
    try {
      const targetOps = opsFilePath || (filePath === defaultStateFile ? defaultOpsFile : resolve(filePath, '..', 'cssa_ops_state.json'))
      for (const [mId, mTasks] of Object.entries(patch.tasks)) {
        syncSportTasksToOps(mId, mTasks, targetOps)
      }
    } catch {}
  }

  return next
}
