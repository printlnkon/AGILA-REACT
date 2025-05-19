import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@/assets/global.css'
import Index from '@/pages/Index.jsx'
import Login from '@/pages/Login.jsx'
import ErrorMessage from '@/components/ErrorMessage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
    errorElement: <ErrorMessage />,
  },
  {
    path: '/login',
    element: <Login />,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
