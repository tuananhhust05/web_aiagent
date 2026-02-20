/**
 * Atlas Initial Onboarding – progress per user.
 * Persisted so it resumes after refresh or relogin.
 */

const PREFIX = 'atlas_onboarding_'

export type AtlasSectionId =
  | 'calendar'
  | 'calls'
  | 'insights'
  | 'todo'
  | 'qna'
  | 'knowledge'
  | 'record'

export interface AtlasOnboardingState {
  firstModalDone: boolean
  sectionsVisited: AtlasSectionId[]
}

function storageKey(userId: string): string {
  return `${PREFIX}${userId}`
}

export function getAtlasOnboardingState(userId: string | undefined): AtlasOnboardingState {
  if (!userId) return { firstModalDone: false, sectionsVisited: [] }
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { firstModalDone: false, sectionsVisited: [] }
    const parsed = JSON.parse(raw) as Partial<AtlasOnboardingState>
    return {
      firstModalDone: !!parsed.firstModalDone,
      sectionsVisited: Array.isArray(parsed.sectionsVisited) ? parsed.sectionsVisited : [],
    }
  } catch {
    return { firstModalDone: false, sectionsVisited: [] }
  }
}

export function setAtlasOnboardingState(
  userId: string | undefined,
  update: Partial<AtlasOnboardingState>
): void {
  if (!userId) return
  try {
    const current = getAtlasOnboardingState(userId)
    const next: AtlasOnboardingState = {
      firstModalDone: update.firstModalDone ?? current.firstModalDone,
      sectionsVisited: update.sectionsVisited ?? current.sectionsVisited,
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {}
}

export function markFirstModalDone(userId: string | undefined): void {
  setAtlasOnboardingState(userId, { firstModalDone: true })
}

export function markSectionVisited(userId: string | undefined, section: AtlasSectionId): void {
  const state = getAtlasOnboardingState(userId)
  if (state.sectionsVisited.includes(section)) return
  setAtlasOnboardingState(userId, {
    sectionsVisited: [...state.sectionsVisited, section],
  })
}

/** Map pathname to section id for sidebar and section guide */
export function pathToSectionId(pathname: string): AtlasSectionId | null {
  const match = pathname.match(/\/atlas\/([^/]+)/)
  if (!match) return null
  const id = match[1] as AtlasSectionId
  const valid: AtlasSectionId[] = ['calendar', 'calls', 'insights', 'todo', 'qna', 'knowledge', 'record']
  return valid.includes(id) ? id : null
}
