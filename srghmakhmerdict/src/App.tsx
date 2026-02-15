import { useEffect } from 'react'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler'
import { Route, Switch, useLocation } from 'wouter'
import { AppAnki } from './AppAnki'
import { AppMain } from './AppMain'
import { KhmerComplexTableView } from './components/KhmerComplexTableView'
import { useSettings } from './providers/SettingsProvider'
import './App.css'

function App() {
  const { theme } = useTheme()
  const { scaling_ui, scaling_details, khmerFontFamily } = useSettings()

  const [, setLocation] = useLocation()

  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme, ThemeProps.DARK, ThemeProps.LIGHT])

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
    resetNavigation: (word, mode) => setLocation(`/${mode}/${encodeURIComponent(word)}`),
  })

  return (
    <Switch>
      <Route nest path="/anki">
        <AppAnki />
      </Route>

      <Route path="/khmer_complex_table">
        <KhmerComplexTableView />
      </Route>

      <Route>
        <AppMain />
      </Route>
    </Switch>
  )
}

export default App
