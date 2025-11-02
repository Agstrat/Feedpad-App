import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Start from './pages/Start'
import Calculator from './pages/Calculator'
import DefaultsPage from './pages/Defaults'
import ExportPage from './pages/export'

export default function App() {
  const base = import.meta.env.BASE_URL
  return (
    <BrowserRouter basename={base}>
      <div style={{ padding: 12 }}>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <Link to="/" style={{ fontWeight: 800, textDecoration: 'none', color: '#111' }}>AGSTRAT</Link>
          <Link to="/">Home</Link>
          <Link to="/calculator">Calculator</Link>
          <Link to="/defaults">Defaults</Link>
          <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 12 }}>
            BASE_URL: {base}
          </div>
        </nav>
      </div>
      <Routes>
        <Route path="/" element={<Start/>} />
        <Route path="/calculator" element={<Calculator/>} />
        <Route path="/defaults" element={<DefaultsPage/>} />
        <Route path="/export" element={<ExportPage/>} />
      </Routes>
    </BrowserRouter>
  )
}
