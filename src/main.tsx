// src/main.tsx — minimal, stable mount
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  const m = 'Root element #root not found'
  console.error(m)
  alert(m)
}

ReactDOM.createRoot(rootEl!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
