import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { I18nProvider } from './i18n/index.jsx'
import { NotificationsProvider } from "./context/NotificationsContext";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
