import React, { useEffect, useMemo, useState } from 'react';
import { loadDefaults, type Defaults, saveDefaults } from '../db';

// Simple derivation matching your screenshots
function derive(cows: number, lanes: number, bunkPerCow: number) {
  const canEat = Math.max(0, Math.round(cows));                 // “Total cows that can eat at once”
  const perLane = lanes > 0 ? canEat / lanes : 0;               // cows per lane
  const bunkPerLane = perLane * bunkPerCow;                     // m
  return { canEat, perLane, bunkPerLane };
}

export default function Calculator() {
  // ---- Top-level hooks (order never changes) ----
  const [defs, setDefs] = useState<Defaults | null>(null);
  const [cows, setCows] = useState<number>(0);

  // Load defaults once, then seed cows from persisted lastCows or a safe fallback
  useEffect(() => {
    (async () => {
      const d = await loadDefaults();
      setDefs(d);
      setCows(d.totalCows ?? 0); // we still keep totalCows in DB for a seed; not shown on Defaults page
    })();
  }, []);

  // Compute greys whenever inputs change
  const greys = useMemo(() => {
    if (!defs) return { canEat: 0, perLane: 0, bunkPerLane: 0 };
    return derive(cows, defs.feedLanes, defs.bunkPerCow);
  }, [defs, cows]);

  // Persist last used cows (optional, harmless)
  useEffect(() => {
    if (!defs) return;
    const next = { ...defs, totalCows: cows as number };
    // fire-and-forget; ignore result to avoid re-render loop
    saveDefaults(next).then(() => { /* noop */ });
  }, [cows, defs]);

  // ---- Render (no conditional hooks above this line) ----
  return (
    <div id="calculator-root" className="card out">
      <h2 className="v">Calculator</h2>

      {!defs ? (
        <p>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            <label>
              Total cows
              <input
                type="number"
                value={cows}
                onChange={(e) => setCows(Number(e.target.value))}
              />
            </label>

            <label>
              Can eat at once
              <input readOnly value={greys.canEat} />
            </label>

            <label>
              Cows per lane
              <input readOnly value={Number.isFinite(greys.perLane) ? Math.round(greys.perLane) : 0} />
            </label>

            <label>
              Bunk length per lane (m)
              <input readOnly value={greys.bunkPerLane.toFixed(2)} />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <div><strong>Lanes:</strong> {defs.feedLanes}</div>
            <div><strong>Bunk per cow (m):</strong> {defs.bunkPerCow}</div>
          </div>
        </>
      )}
    </div>
  );
}
