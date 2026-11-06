import { useEffect, useState, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { getSetting, setSetting } from '../data/repo'
import { LanguageProvider, t, type Language } from '../i18n'
import AddExpenseScreen from '../screens/AddExpense/AddExpenseScreen'
import AddIncomeScreen from '../screens/AddIncome/AddIncomeScreen'
import BackupScreen from '../screens/Backup/BackupScreen'
import CashCheckScreen from '../screens/CashCheck/CashCheckScreen'
import CategoriesScreen from '../screens/Categories/CategoriesScreen'
import EditEntryScreen from '../screens/EditEntry/EditEntryScreen'
import HistoryScreen from '../screens/History/HistoryScreen'
import HomeScreen from '../screens/Home/HomeScreen'
import InstallHelpScreen from '../screens/InstallHelp/InstallHelpScreen'
import MoreScreen from '../screens/More/MoreScreen'
import ReportScreen from '../screens/Report/ReportScreen'
import WelcomeScreen from '../screens/Welcome/WelcomeScreen'
import { ROUTES } from './routes'

type StoredLanguage = Language | null

function isFormPath(pathname: string): boolean {
  return (
    pathname === ROUTES.addIncome ||
    pathname === ROUTES.addExpense ||
    pathname.startsWith('/edit/')
  )
}

interface AppRoutesProps {
  storedLanguage: StoredLanguage
  onLanguageChosen: (lang: Language) => Promise<void>
}

function AppRoutes({ storedLanguage, onLanguageChosen }: AppRoutesProps) {
  const location = useLocation()
  const hideNav =
    location.pathname === ROUTES.welcome || isFormPath(location.pathname)

  function guard(element: ReactNode): ReactNode {
    return storedLanguage === null ? (
      <Navigate to={ROUTES.welcome} replace />
    ) : (
      element
    )
  }

  return (
    <>
      <Routes>
        <Route
          path={ROUTES.welcome}
          element={<WelcomeScreen onStart={onLanguageChosen} />}
        />
        <Route path={ROUTES.home} element={guard(<HomeScreen />)} />
        <Route path={ROUTES.addIncome} element={guard(<AddIncomeScreen />)} />
        <Route path={ROUTES.addExpense} element={guard(<AddExpenseScreen />)} />
        <Route path={ROUTES.edit} element={guard(<EditEntryScreen />)} />
        <Route path={ROUTES.history} element={guard(<HistoryScreen />)} />
        <Route path={ROUTES.report} element={guard(<ReportScreen />)} />
        <Route path={ROUTES.check} element={guard(<CashCheckScreen />)} />
        <Route path={ROUTES.more} element={guard(<MoreScreen />)} />
        <Route path={ROUTES.categories} element={guard(<CategoriesScreen />)} />
        <Route path={ROUTES.backup} element={guard(<BackupScreen />)} />
        <Route path={ROUTES.install} element={guard(<InstallHelpScreen />)} />
        <Route
          path="*"
          element={
            <Navigate
              to={storedLanguage === null ? ROUTES.welcome : ROUTES.home}
              replace
            />
          }
        />
      </Routes>
      {storedLanguage !== null && !hideNav ? <BottomNav /> : null}
    </>
  )
}

export default function App() {
  const [storedLanguage, setStoredLanguage] = useState<StoredLanguage | undefined>(
    undefined,
  )
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true

    getSetting('language')
      .then((value) => {
        if (!active) {
          return
        }

        setStoredLanguage(value === 'bn' || value === 'en' ? value : null)
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLanguageChosen(lang: Language): Promise<void> {
    await setSetting('language', lang)
    setStoredLanguage(lang)
  }

  if (loadFailed) {
    return (
      <LanguageProvider>
        <div className="app" role="alert">
          {t('bn', 'error.storageUnavailable')}
        </div>
      </LanguageProvider>
    )
  }

  if (storedLanguage === undefined) {
    return <div className="app" aria-busy="true" />
  }

  return (
    <LanguageProvider initialLang={storedLanguage ?? 'bn'}>
      <HashRouter>
        <div className={storedLanguage === null ? 'app' : 'app app-shell'}>
          <AppRoutes
            storedLanguage={storedLanguage}
            onLanguageChosen={handleLanguageChosen}
          />
        </div>
      </HashRouter>
    </LanguageProvider>
  )
}
