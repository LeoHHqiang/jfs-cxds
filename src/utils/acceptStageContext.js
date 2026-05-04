const KEY = 'acceptStageContext'

export function writeAcceptStageContext(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data || {}))
  } catch (e) {
    // ignore
  }
}

export function readAcceptStageContext() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function clearAcceptStageContext() {
  try {
    sessionStorage.removeItem(KEY)
  } catch (e) {
    // ignore
  }
}
