// ============================================
// src/main.tsx — GOLD-STANDARD DROP-IN
// ============================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles.css'

// ====== ROOT MOUNT + HARD FAIL-SAFE ======
const rootEl = document.getElementById('root')
if (!rootEl) {
  const msg = 'Critical error: #root element not found in index.html'
  console.error(msg)
  document.body.innerHTML = `<pre style="
    white-space:pre-wrap;
    padding:12px;
    margin:12px;
    border:1px solid #e5e7eb;
    border-radius:10px;
    background:#fff4f4;
    color:#b91c1c;
    font-family:ui-monospace,Menlo,Consolas,monospace;
  ">${msg}</pre>`
  throw new Error(msg)
}

// ====== GLOBAL ERROR SURFACE (no silent blank screens) ======
window.onerror = function (msg, src, line, col, err) {
  const pre = document.createElement('pre')
  pre.style.cssText = `
    white-space:pre-wrap;
    padding:12px;
    margin:12px;
    border:1px solid #e5e7eb;
    border-radius:10px;
    background:#fff4f4;
    color:#b91c1c;
    font-family:ui-monospace,Menlo,Consolas,monospace;`
  pre.textContent =
    'Runtime error:\n' +
    (err && err.stack ? err.stack : `${msg} @ ${src}:${line}:${col}`)
  document.body.appendChild(pre)
}

// ====== REACT APP MOUNT ======
try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  )
} catch (e) {
  const pre = document.createElement('pre')
  pre.style.cssText = `
    white-space:pre-wrap;
    padding:12px;
    margin:12px;
    border:1px solid #e5e7eb;
    border-radius:10px;
    background:#fff4f4;
    color:#b91c1c;
    font-family:ui-monospace,Menlo,Consolas,monospace;`
  pre.textContent =
    'Bootstrap error:\n' +
    (e instanceof Error ? e.stack || e.message : String(e))
  document.body.appendChild(pre)
  console.error(e)
}
