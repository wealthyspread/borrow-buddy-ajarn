import { useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import LoginForm from './components/LoginForm.jsx'
import SearchBox from './components/SearchBox.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { getSession, onSessionChange, signOut } from './lib/authService.js'
import { toIsoDate } from './lib/dateFormat.js'
import { markImported, readLegacyLoans } from './lib/legacyImport.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from './lib/loanRules.js'
import { addLoan, addLoans, listLoans, updateLoan } from './lib/loanRepo.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

function LoanApp({ session, theme, onToggleTheme }) {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState(null)
  const [legacy, setLegacy] = useState(() => readLegacyLoans())
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    listLoans().then(({ data, error }) => {
      if (cancelled) return
      setLoans(data)
      setWarning(error)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const today = toIsoDate(new Date())
  const editingLoan = loans.find((loan) => loan.id === editingId) ?? null
  const visibleLoans = filterLoansByFriend(loans, query)

  // อัปเดตหน้าจอตามผลจริงจากฐานข้อมูลเท่านั้น ถ้าไม่สำเร็จคงข้อมูลเดิมและแจ้งเตือน
  const handleSave = async (loan) => {
    const { data, error } = loan.id ? await updateLoan(loan) : await addLoan(loan)
    setWarning(error)
    if (error) return false
    setLoans((prev) => (loan.id ? prev.map((l) => (l.id === data.id ? data : l)) : [...prev, data]))
    setEditingId(null)
    return true
  }

  const handleMarkReturned = (loan, returnedDate) =>
    handleSave(markReturned(loan, today, returnedDate))

  const handleUnmarkReturned = (loan) => handleSave(unmarkReturned(loan))

  const handleImport = async () => {
    const { error } = await addLoans(legacy.loans)
    setWarning(error)
    if (error) return
    markImported()
    setLegacy({ loans: [], warning: null })
    const result = await listLoans()
    setLoans(result.data)
    setWarning(result.error)
  }

  const handleSkipImport = () => setLegacy({ loans: [], warning: null })

  return (
    <>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <span>{session.user.email}</span>
        <button type="button" onClick={signOut}>
          ออกจากระบบ
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
      {warning && <p role="alert">{warning}</p>}
      {legacy.warning && <p role="alert">{legacy.warning}</p>}
      {legacy.loans.length > 0 && (
        <section role="status">
          <p>พบข้อมูลการยืมเดิมในเครื่องนี้ {legacy.loans.length} รายการ ต้องการนำเข้าไปเก็บในบัญชีนี้หรือไม่</p>
          <div className="form-actions">
            <button type="button" onClick={handleImport}>
              นำเข้า
            </button>
            <button type="button" onClick={handleSkipImport}>
              ไม่นำเข้าตอนนี้
            </button>
          </div>
        </section>
      )}
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <LoanList
          loans={visibleLoans}
          today={today}
          onMarkReturned={handleMarkReturned}
          onUnmarkReturned={handleUnmarkReturned}
          onEdit={(loan) => setEditingId(loan.id)}
        />
      )}
    </>
  )
}

function App() {
  // undefined = ยังตรวจเซสชันอยู่, null = ยังไม่ล็อกอิน
  const [session, setSession] = useState(undefined)
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    getSession().then(setSession)
    return onSessionChange(setSession)
  }, [])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  if (session === undefined) return <main><p>กำลังโหลด...</p></main>

  return (
    <main>
      {session ? (
        <LoanApp key={session.user.id} session={session} theme={theme} onToggleTheme={handleToggleTheme} />
      ) : (
        <>
          <header className="app-header">
            <h1>Borrow Buddy</h1>
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
          </header>
          <LoginForm />
        </>
      )}
    </main>
  )
}

export default App
