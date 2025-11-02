// src/main.tsx — STABLE PWA HANDLER (fixes iPhone reload loop)
import { registerSW } from 'virtual:pwa-register'

// Use update flow that avoids iOS refresh loop
const updateSW = registerSW({
  onNeedRefresh() {
    // optional: silently trigger update once user closes app
    updateSW(true)
  },
  onOfflineReady() {
    console.log('FeedPad ready for offline use.')
  }
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './styles.css'

import Start from './pages/Start'
import Defaults from './pages/Defaults'
import Calculator from './pages/Calculator'

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
