import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App.jsx'
import '@/assets/global.css'
import AuthProvider from '@/context/AuthContext'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
)