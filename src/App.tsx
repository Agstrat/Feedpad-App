// src/App.tsx — DROP-IN
import { NavLink, Routes, Route } from 'react-router-dom'
import Start from './pages/Start.tsx'
import Calculator from './pages/Calculator.tsx'
import Defaults from './pages/Defaults.tsx'

export default function App() {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="FeedPad" style={{ height: 32 }} />
        <nav style={{ display: 'flex', gap: 12 }}>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/calculator">Calculator</NavLink>
          <NavLink to="/defaults">Defaults</NavLink>
        </nav>
        <div style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 12 }}>
          BASE_URL: {import.meta.env.BASE_URL}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/defaults" element={<Defaults />} />
      </Routes>
    </div>
  )
}
