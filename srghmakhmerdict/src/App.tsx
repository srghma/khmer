import React, { useEffect, Suspense } from 'react'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler'
import { Route, Switch, useLocation } from 'wouter'
import { useSettings } from './providers/SettingsProvider'
import { DetailsModal } from './providers/DetailsModalProvider'
import './App.css'
const AppAnki = React.lazy(() => import('./AppAnki').then(m => ({ default: m.AppAnki })))
const AppMain = React.lazy(() => import('./AppMain').then(m => ({ default: m.AppMain })))
const KhmerComplexTableView = React.lazy(() =>
  import('./components/KhmerComplexTableView').then(m => ({ default: m.KhmerComplexTableView })),
)
const AnkiTableView = React.lazy(() =>
  import('./components/AnkiTable/AnkiTableView').then(m => ({ default: m.AnkiTableView })),
)

function App() {
  const { theme } = useTheme()
  const { scaling_ui, scaling_details, khmerFontFamily } = useSettings()

  const [, setLocation] = useLocation()

  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const scale = scaling_ui / 100

    root.style.setProperty('--app-ui-scale', scale.toFixed(3))
  }, [scaling_ui])

  useEffect(() => {
    const scale = scaling_details / 100

    document.documentElement.style.setProperty('--app-details-scale', scale.toFixed(3))
  }, [scaling_details])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-khmer-font-family', khmerFontFamily || 'inherit')
  }, [khmerFontFamily])

  useDeepLinkHandler({
    resetNavigation: (word, mode) => {
      setLocation(`~/${mode}/${encodeURIComponent(word)}`)
    },
  })

  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
      <Switch>
        <Route nest path="/anki">
          <AppAnki />
        </Route>

        <Route path="/khmer_complex_table">
          <KhmerComplexTableView />
        </Route>

        <Route path="/anki_table">
          <AnkiTableView />
        </Route>

        <Route>
          <AppMain />
        </Route>
      </Switch>
      <DetailsModal />
    </Suspense>
  )
}

export default App
