import { useEffect } from 'react'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler'
import { Route, Switch, useLocation } from 'wouter'
import { AppAnki } from './AppAnki'
import { AppMain } from './AppMain'
import { KhmerComplexTableView } from './components/KhmerComplexTableView'
import './App.css'

function App() {
  const { theme } = useTheme()

  const [, setLocation] = useLocation()

  useEffect(() => {
    document.documentElement.classList.remove(theme === ThemeProps.DARK ? ThemeProps.LIGHT : ThemeProps.DARK)
    document.documentElement.classList.add(theme === ThemeProps.DARK ? ThemeProps.DARK : ThemeProps.LIGHT)
  }, [theme])

  useDeepLinkHandler({
    resetNavigation: (word, mode) => setLocation(`/${mode}/${encodeURIComponent(word)}`),
  })

  return (
    <Switch>
      <Route nest path="/anki">
        <AppAnki />
      </Route>

      <Route path="/khmer_complex_table">
        <div className="fixed inset-0 z-[100] bg-background">
          <KhmerComplexTableView />
        </div>
      </Route>

      <Route>
        <AppMain />
      </Route>
    </Switch>
  )
}

export default App
