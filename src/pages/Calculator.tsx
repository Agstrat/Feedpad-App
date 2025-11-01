// src/pages/Calculator.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { loadDefaults, type Defaults } from '../db';
import { deriveFromDefaults } from '../lib/calc';
import { downloadJSON, downloadPDF } from '../lib/export';

export default function Calculator() {
  const [defs, setDefs] = useState<Defaults | null>(null);

  useEffect(() => {
    (async () => setDefs(await loadDefaults()))();
  }, []);

  if (!defs) return <div className="card out"><p>Loading…</p></div>;

  // Example of runtime overrides (if you want editable cows, etc.)
  const [cows, setCows] = useState<number>(defs.totalCows);

  const bunkPerCow = defs.bunkPerCow;
  const lanes = defs.feedLanes;

  // Derived (grey) values driven by defaults + runtime cows
  const derived = useMemo(() => {
    return deriveFromDefaults({ ...defs, totalCows: cows });
  }, [defs, cows]);

  const totalBunkLen = derived.totalBunkLenAllLanes; // m

  const onExportJSON = () => {
    downloadJSON({ defaults: defs, cowsRuntime: cows, derived }, 'feedpad.json');
  };

  const onExportPDF = () => {
    downloadPDF('#calculator-root', 'feedpad.pdf');
  };

  return (
    <div id="calculator-root" className="card out">
      <h2 className="v">Calculator</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
        <label>
          Cows
          <input
            type="number"
            value={cows}
            onChange={(e) => setCows(Number(e.target.value))}
          />
        </label>

        <label>
          Bunk width (m/cow)
          <input type="number" step="0.01" value={bunkPerCow} readOnly />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <div><strong>Lanes:</strong> {lanes}</div>
        <div><strong>Can eat at once:</strong> {derived.cowsCanEatAtOnce}</div>
        <div><strong>Cows per lane:</strong> {derived.cowsPerLane.toFixed(0)}</div>
        <div><strong>Bunk length per lane:</strong> {derived.bunkLenPerLane.toFixed(2)} m</div>
        <div><strong>Total bunk length (all lanes):</strong> {totalBunkLen.toFixed(2)} m</div>
        <div><strong>Feed lane width (grey):</strong> {defs.feedLaneWidth} m</div>
        <div><strong>Tractor lane width (grey):</strong> {defs.tractorLaneWidth} m</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn" onClick={onExportJSON}>Export JSON</button>
        <button className="btn" onClick={onExportPDF}>Export PDF</button>
      </div>
    </div>
  );
}
