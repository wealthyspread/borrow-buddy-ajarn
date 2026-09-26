import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabaseClient.js', () => ({ supabase: {} }))

const { LOAD_ERROR, SAVE_ERROR, addLoan, addLoans, fromRow, listLoans, toRow, updateLoan } =
  await import('./loanRepo.js')

const row = {
  id: 'i1',
  owner_id: 'o1',
  friend_name: 'บอย',
  item_name: 'ร่ม',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-10',
  returned_date: null,
}
const loan = {
  id: 'i1',
  friendName: 'บอย',
  itemName: 'ร่ม',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-10',
  returnedDate: null,
}

// client จำลองแบบ chain ที่คืนผลลัพธ์เดียวกันทุกขั้น
const fakeClient = (result) => {
  const chain = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'order', 'single']) chain[m] = vi.fn(() => chain)
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return { chain, from: vi.fn(() => chain) }
}

describe('แปลงชื่อฟิลด์', () => {
  it('fromRow แปลง snake_case เป็น camelCase และไม่เอา owner_id', () => {
    expect(fromRow(row)).toEqual(loan)
  })
  it('toRow ไม่ส่ง id และ owner_id', () => {
    const r = toRow(loan)
    expect(r).toEqual({
      friend_name: 'บอย',
      item_name: 'ร่ม',
      borrowed_date: '2026-09-01',
      due_date: '2026-09-10',
      returned_date: null,
    })
  })
})

describe('listLoans', () => {
  it('สำเร็จ', async () => {
    expect(await listLoans(fakeClient({ data: [row], error: null }))).toEqual({ data: [loan], error: null })
  })
  it('error คืนข้อความไทยและรายการว่าง', async () => {
    expect(await listLoans(fakeClient({ data: null, error: { message: 'x' } }))).toEqual({
      data: [],
      error: LOAD_ERROR,
    })
  })
})

describe('addLoan / updateLoan / addLoans', () => {
  it('addLoan คืน Loan จากฐานข้อมูล', async () => {
    const c = fakeClient({ data: row, error: null })
    expect(await addLoan(loan, c)).toEqual({ data: loan, error: null })
    expect(c.chain.insert).toHaveBeenCalledWith(toRow(loan))
  })
  it('updateLoan กรองด้วย id', async () => {
    const c = fakeClient({ data: row, error: null })
    await updateLoan(loan, c)
    expect(c.chain.eq).toHaveBeenCalledWith('id', 'i1')
  })
  it('บันทึกไม่สำเร็จคืนข้อความไทย', async () => {
    const c = fakeClient({ data: null, error: { message: 'x' } })
    expect((await addLoan(loan, c)).error).toBe(SAVE_ERROR)
    expect((await updateLoan(loan, c)).error).toBe(SAVE_ERROR)
    expect((await addLoans([loan], c)).error).toBe(SAVE_ERROR)
  })
  it('client โยน error ก็คืนข้อความไทย', async () => {
    const c = { from: () => { throw new Error('net') } }
    expect((await addLoan(loan, c)).error).toBe(SAVE_ERROR)
  })
  it('ไม่มีฟังก์ชันลบ', async () => {
    const mod = await import('./loanRepo.js')
    expect(Object.keys(mod).some((k) => /delete|remove/i.test(k))).toBe(false)
  })
})
