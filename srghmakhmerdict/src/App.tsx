import { useEffect } from 'react'
import { useTheme } from '@heroui/use-theme'
import { ThemeProps } from '@heroui/use-theme'
import { useDeepLinkHandler } from './hooks/useDeepLinkHandler'
import { Route, Switch, useLocation } from 'wouter'
import { AppAnki } from './AppAnki'
import { AppMain } from './AppMain'
import './App.css'

function App() {
  const { theme } = useTheme()

  const [_, setLocation] = useLocation()

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

      <Route>
        <AppMain />
      </Route>
    </Switch>
  )
}

export default App
