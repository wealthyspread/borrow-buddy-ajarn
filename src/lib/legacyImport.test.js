import { describe, expect, it } from 'vitest'
import { IMPORTED_KEY, LEGACY_WARNING, markImported, readLegacyLoans } from './legacyImport.js'
import { STORAGE_KEY } from './storage.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
  }
}
const loan = { id: 'a', friendName: 'บอย', itemName: 'ร่ม', borrowedDate: '2026-09-01', dueDate: '2026-09-10', returnedDate: null }

describe('readLegacyLoans', () => {
  it('อ่านข้อมูลปกติ', () => {
    const s = memoryStorage({ [STORAGE_KEY]: JSON.stringify([loan]) })
    expect(readLegacyLoans(s)).toEqual({ loans: [loan], warning: null })
  })
  it('ว่างเปล่า', () => {
    expect(readLegacyLoans(memoryStorage())).toEqual({ loans: [], warning: null })
  })
  it('JSON เสีย / รูปแบบผิด แจ้งเตือน', () => {
    expect(readLegacyLoans(memoryStorage({ [STORAGE_KEY]: '{oops' })).warning).toBe(LEGACY_WARNING)
    expect(readLegacyLoans(memoryStorage({ [STORAGE_KEY]: '{}' })).warning).toBe(LEGACY_WARNING)
    expect(readLegacyLoans(memoryStorage({ [STORAGE_KEY]: '[{"x":1}]' })).warning).toBe(LEGACY_WARNING)
  })
  it('นำเข้าแล้วไม่ถามซ้ำ และไม่แก้ข้อมูลเดิม', () => {
    const raw = JSON.stringify([loan])
    const s = memoryStorage({ [STORAGE_KEY]: raw })
    markImported(s)
    expect(s.data[IMPORTED_KEY]).toBe('true')
    expect(readLegacyLoans(s).loans).toEqual([])
    expect(s.data[STORAGE_KEY]).toBe(raw)
  })
  it('storage อ่านไม่ได้ แจ้งเตือน', () => {
    const s = { getItem: () => { throw new Error('blocked') } }
    expect(readLegacyLoans(s).warning).toBe(LEGACY_WARNING)
  })
})
