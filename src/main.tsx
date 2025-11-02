// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './styles.css'

import Start from './pages/Start'
import Defaults from './pages/Defaults'
import Calculator from './pages/Calculator'

// ✅ register the service worker provided by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

const basename = import.meta.env.BASE_URL

const router = createBrowserRouter(
  [
    { path: '/', element: <Start /> },
    { path: '/defaults', element: <Defaults /> },
    { path: '/calculator', element: <Calculator /> },
    { path: '*', element: <Start /> },
  ],
  { basename }
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
