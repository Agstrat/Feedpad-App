// src/pages/Calculator.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { downloadJSON, downloadPDF } from '../lib/export';

type Inputs = {
  cows: number;
  bunkWidth: number;  // m/cow
};

export default function Calculator() {
  // ===== Top-level hooks (do NOT move these inside conditionals) =====
  const [inputs, setInputs] = useState<Inputs>({ cows: 0, bunkWidth: 0.67 });

  // Example derived value (safe: useMemo at top level)
  const feedlaneMetres = useMemo(() => {
    if (!Number.isFinite(inputs.cows) || !Number.isFinite(inputs.bunkWidth)) return 0;
    return Math.max(0, inputs.cows * inputs.bunkWidth);
  }, [inputs.cows, inputs.bunkWidth]);

  // Example one-time effect (safe: top level)
  useEffect(() => {
    // Place any init that must run once here (e.g., load defaults from IndexedDB)
    // Do not call hooks inside this effect.
  }, []);

  // ===== Handlers =====
  const onExportJSON = () => {
    downloadJSON({ inputs, feedlaneMetres }, 'feedpad.json');
  };

  const onExportPDF = () => {
    // Export the visible calculator section; fallback is handled in helper
    downloadPDF('#calculator-root', 'feedpad.pdf');
  };

  // ===== Render =====
  return (
    <div id="calculator-root" className="card out">
      <h2 className="v">Calculator</h2>

      {/* --- SIMPLE DEMO UI (replace with your full UI; keep hooks above) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <label>
          Cows
          <input
            type="number"
            value={inputs.cows}
            onChange={(e) => setInputs(s => ({ ...s, cows: Number(e.target.value) }))}
          />
        </label>

        <label>
          Bunk width (m/cow)
          <input
            type="number"
            step="0.01"
            value={inputs.bunkWidth}
            onChange={(e) => setInputs(s => ({ ...s, bunkWidth: Number(e.target.value) }))}
          />
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Feedlane length:</strong> {feedlaneMetres.toFixed(2)} m
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn" onClick={onExportJSON}>Export JSON</button>
        <button className="btn" onClick={onExportPDF}>Export PDF</button>
      </div>
    </div>
  );
}
