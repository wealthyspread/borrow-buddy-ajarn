import { supabase } from './supabaseClient.js'

export const LOAD_ERROR = 'โหลดข้อมูลการยืมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
export const SAVE_ERROR = 'บันทึกข้อมูลไม่สำเร็จ ข้อมูลบนหน้าจอยังเป็นค่าเดิม'

// ไม่มีฟังก์ชันลบ Loan โดยตั้งใจ (ฐานข้อมูลก็ไม่ให้ลบ)
export const fromRow = (row) => ({
  id: row.id,
  friendName: row.friend_name,
  itemName: row.item_name,
  borrowedDate: row.borrowed_date,
  dueDate: row.due_date,
  returnedDate: row.returned_date ?? null,
})

// ไม่ส่ง id / owner_id: id ฐานข้อมูลสร้างให้ owner_id ตั้งจากผู้ล็อกอิน
export const toRow = (loan) => ({
  friend_name: loan.friendName,
  item_name: loan.itemName,
  borrowed_date: loan.borrowedDate,
  due_date: loan.dueDate,
  returned_date: loan.returnedDate ?? null,
})

// ทุกฟังก์ชันคืน { data, error } โดย error เป็นข้อความไทยหรือ null
export async function listLoans(client = supabase) {
  try {
    const { data, error } = await client.from('loans').select('*').order('due_date')
    if (error) return { data: [], error: LOAD_ERROR }
    return { data: data.map(fromRow), error: null }
  } catch {
    return { data: [], error: LOAD_ERROR }
  }
}

export async function addLoan(loan, client = supabase) {
  try {
    const { data, error } = await client.from('loans').insert(toRow(loan)).select().single()
    if (error) return { data: null, error: SAVE_ERROR }
    return { data: fromRow(data), error: null }
  } catch {
    return { data: null, error: SAVE_ERROR }
  }
}

export async function updateLoan(loan, client = supabase) {
  try {
    const { data, error } = await client
      .from('loans')
      .update(toRow(loan))
      .eq('id', loan.id)
      .select()
      .single()
    if (error) return { data: null, error: SAVE_ERROR }
    return { data: fromRow(data), error: null }
  } catch {
    return { data: null, error: SAVE_ERROR }
  }
}

// นำเข้าหลายรายการครั้งเดียว (ใช้กับการย้ายข้อมูลเดิม) สำเร็จหมดหรือไม่สำเร็จเลย
export async function addLoans(loans, client = supabase) {
  try {
    const { error } = await client.from('loans').insert(loans.map(toRow))
    return { error: error ? SAVE_ERROR : null }
  } catch {
    return { error: SAVE_ERROR }
  }
}
