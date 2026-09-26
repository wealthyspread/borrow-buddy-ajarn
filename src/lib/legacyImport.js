import { STORAGE_KEY } from './storage.js'

export const IMPORTED_KEY = 'borrow-buddy:imported-to-supabase'
export const LEGACY_WARNING = 'อ่านข้อมูลเดิมในเครื่องไม่ได้ จึงข้ามการนำเข้า ข้อมูลเดิมยังไม่ถูกแก้ไข'

const isText = (v) => typeof v === 'string' && v.trim() !== ''
const isValidLoan = (l) =>
  l && isText(l.friendName) && isText(l.itemName) && isText(l.borrowedDate) && isText(l.dueDate)

// อ่านอย่างเดียว ไม่แก้/ไม่ลบ localStorage เดิม
// คืน { loans, warning } โดย loans ว่างเมื่อไม่มีอะไรให้นำเข้า หรือถูกนำเข้าแล้ว
export function readLegacyLoans(storage = globalThis.localStorage) {
  try {
    if (storage.getItem(IMPORTED_KEY) === 'true') return { loans: [], warning: null }
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return { loans: [], warning: null }
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || !data.every(isValidLoan)) {
      return { loans: [], warning: LEGACY_WARNING }
    }
    return { loans: data.map((l) => ({ ...l, returnedDate: l.returnedDate ?? null })), warning: null }
  } catch {
    return { loans: [], warning: LEGACY_WARNING }
  }
}

// ทำเครื่องหมายว่านำเข้าแล้ว (เขียนเฉพาะคีย์นี้ ไม่แตะข้อมูลเดิม)
export function markImported(storage = globalThis.localStorage) {
  try {
    storage.setItem(IMPORTED_KEY, 'true')
  } catch {
    // ถ้าเขียนไม่ได้ อาจถูกถามซ้ำ แต่ไม่กระทบข้อมูล
  }
}
