import { supabase } from './supabaseClient.js'

export const AUTH_ERROR_INVALID = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
export const AUTH_ERROR_NETWORK = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง'
export const AUTH_ERROR_GENERIC = 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
export const AUTH_ERROR_EMPTY = 'กรุณากรอกอีเมลและรหัสผ่าน'

// แปลข้อผิดพลาดของ Supabase Auth เป็นข้อความไทย
export function translateAuthError(error) {
  if (!error) return null
  const message = String(error.message ?? '').toLowerCase()
  if (error.code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return AUTH_ERROR_INVALID
  }
  if (
    error.name === 'AuthRetryableFetchError' ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return AUTH_ERROR_NETWORK
  }
  return AUTH_ERROR_GENERIC
}

// client รับเป็นพารามิเตอร์ เพื่อให้ทดสอบด้วย client จำลองได้
// คืน null เมื่อสำเร็จ หรือข้อความผิดพลาดภาษาไทย
export async function signIn(email, password, client = supabase) {
  if (!email.trim() || !password) return AUTH_ERROR_EMPTY
  try {
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    return translateAuthError(error)
  } catch (e) {
    return translateAuthError(e) ?? AUTH_ERROR_GENERIC
  }
}

export const signOut = (client = supabase) => client.auth.signOut()

export const getSession = async (client = supabase) => (await client.auth.getSession()).data.session

// คืนฟังก์ชันยกเลิกการติดตาม
export function onSessionChange(callback, client = supabase) {
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
