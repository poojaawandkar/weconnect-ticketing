import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { TicketsProvider } from './tickets/TicketsProvider.jsx'
import { NotificationsProvider } from './notifications/NotificationsProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <TicketsProvider>
          <App />
        </TicketsProvider>
      </NotificationsProvider>
    </AuthProvider>
  </StrictMode>,
)