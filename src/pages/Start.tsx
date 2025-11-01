// src/pages/Start.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Start() {
  const nav = useNavigate();

  function createPdfFromHome() {
    // Navigate to calculator and auto-export via ?pdf=1
    nav('/calculator?pdf=1');
  }

  return (
    <div className="card out">
      <h1 className="v">FeedPad</h1>
      <p>Set defaults once. Calculate anywhere. Works offline when installed.</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <Link to="/defaults" className="btn">Update Defaults</Link>
        <Link to="/calculator" className="btn">Start Calculations</Link>
        {/* NEW: Create PDF from Home (routes with ?pdf=1) */}
        <button className="btn" onClick={createPdfFromHome}>Create PDF</button>
      </div>
    </div>
  );
}
