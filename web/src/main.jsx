import { createRoot } from 'react-dom/client'
import App from '@/App.jsx'
import '@/assets/global.css'
import AuthProvider from '@/context/AuthContext'
import { ThemeProvider } from './context/ThemeProvider'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </AuthProvider>,
)