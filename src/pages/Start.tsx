import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Start() {
  const nav = useNavigate()
  return (
    <div className="calc-wrap">
      <h1 style={{ margin: 0 }}>FeedPad</h1>
      <p style={{ marginTop: 6, color: '#6b7280' }}>
        Set defaults once. Calculate anywhere. Works offline when installed.
      </p>
      <div className="actions" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        <button className="btn" onClick={() => nav('/defaults')}>Update Defaults</button>
        <button className="btn" onClick={() => nav('/calculator')}>Start Calculations</button>
        <button className="btn" onClick={() => nav('/export')}>Create PDF</button>
      </div>
    </div>
  )
}
