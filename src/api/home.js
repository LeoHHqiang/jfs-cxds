import { loadDb } from './mockDb'

export const fetchHomeMeta = async () => {
  const db = loadDb()
  return {
    success: true,
    data: {
      todos: db.homeTodos || [],
      events: db.homeEvents || {}
    }
  }
}
