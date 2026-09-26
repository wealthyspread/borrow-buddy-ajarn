import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabaseClient.js', () => ({ supabase: {} }))

const {
  AUTH_ERROR_EMPTY,
  AUTH_ERROR_GENERIC,
  AUTH_ERROR_INVALID,
  AUTH_ERROR_NETWORK,
  signIn,
  translateAuthError,
} = await import('./authService.js')

const clientReturning = (result) => ({ auth: { signInWithPassword: vi.fn().mockResolvedValue(result) } })

describe('translateAuthError', () => {
  it('ไม่มี error คืน null', () => {
    expect(translateAuthError(null)).toBeNull()
  })
  it('รหัสผ่านผิด', () => {
    expect(translateAuthError({ code: 'invalid_credentials', message: 'x' })).toBe(AUTH_ERROR_INVALID)
    expect(translateAuthError({ message: 'Invalid login credentials' })).toBe(AUTH_ERROR_INVALID)
  })
  it('เครือข่ายล่ม', () => {
    expect(translateAuthError({ name: 'AuthRetryableFetchError', message: 'x' })).toBe(AUTH_ERROR_NETWORK)
  })
  it('กรณีอื่น', () => {
    expect(translateAuthError({ message: 'boom' })).toBe(AUTH_ERROR_GENERIC)
  })
})

describe('signIn', () => {
  it('ช่องว่างไม่เรียก client', async () => {
    const client = clientReturning({ error: null })
    expect(await signIn(' ', '', client)).toBe(AUTH_ERROR_EMPTY)
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled()
  })
  it('สำเร็จคืน null', async () => {
    expect(await signIn('a@b.co', 'pw', clientReturning({ error: null }))).toBeNull()
  })
  it('ล้มเหลวคืนข้อความไทย', async () => {
    const client = clientReturning({ error: { code: 'invalid_credentials', message: 'x' } })
    expect(await signIn('a@b.co', 'pw', client)).toBe(AUTH_ERROR_INVALID)
  })
  it('client โยน error คืนข้อความไทย', async () => {
    const client = { auth: { signInWithPassword: vi.fn().mockRejectedValue(new Error('Failed to fetch')) } }
    expect(await signIn('a@b.co', 'pw', client)).toBe(AUTH_ERROR_NETWORK)
  })
})
