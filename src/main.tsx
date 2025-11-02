// src/main.tsx — FIXED (drop-in)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

// Explicit extension so Linux/GitHub runner resolves it 100% reliably
import App from './App.tsx'

// You have styles.css (not index.css)
import './styles.css'

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
