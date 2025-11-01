// src/pages/Defaults.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

function num(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const POST_SIZES = ['80NB', '65NB', '50NB', '40NB'];

export default function DefaultsPage() {
  const nav = useNavigate();
  const [d, setD] = useState<Defaults | null>(null);

  useEffect(() => {
    (async () => setD(await loadDefaults()))();
  }, []);

  if (!d) {
    return (
      <div className="card">
        <h2 className="v">Default Settings</h2>
        <p>Loading…</p>
      </div>
    );
  }

  // controlled setters
  const set = <K extends keyof Defaults>(k: K, v: Defaults[K]) =>
    setD({ ...d, [k]: v });

  async function onSave() {
    await saveDefaults(d);
    nav('/');
  }

  return (
    <div className="card">
      <h2 className="v">Default Settings</h2>

      <div className="form-grid" style={{ marginTop: 8 }}>
        {/* Row 1 */}
        <label>
          Feed Pad Slope (%)
          <input
            type="number"
            step={0.01}
            value={d.feedPadSlopePct}
            onChange={e => set('feedPadSlopePct', num(e.target.value, 0))}
          />
        </label>

        <label>
          Feed Wall Thickness (m)
          <input
            type="number"
            step={0.01}
            value={d.feedWallThickness}
            onChange={e => set('feedWallThickness', num(e.target.value, 0))}
          />
        </label>

        <label>
          Nib Wall Thickness (m)
          <input
            type="number"
            step={0.01}
            value={d.nibWallThickness}
            onChange={e => set('nibWallThickness', num(e.target.value, 0))}
          />
        </label>

        {/* Row 2 */}
        <label>
          Feed Wall Post Spacing (m)
          <input
            type="number"
            step={0.1}
            value={d.feedWallPostSpacing}
            onChange={e => set('feedWallPostSpacing', num(e.target.value, 0))}
          />
        </label>

        <label>
          Feed Wall Post Size
          <select
            value={d.feedWallPostSize ?? '65NB'}
            onChange={e => set('feedWallPostSize', e.target.value)}
          >
            {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Cow Lane Post Spacing (m)
          <input
            type="number"
            step={0.1}
            value={d.cowLanePostSpacing}
            onChange={e => set('cowLanePostSpacing', num(e.target.value, 0))}
          />
        </label>

        {/* Row 3 */}
        <label>
          Cow Lane Post Size
          <select
            value={d.cowLanePostSize ?? '50NB'}
            onChange={e => set('cowLanePostSize', e.target.value)}
          >
            {POST_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Turning Circle Allowance (m)
          <input
            type="number"
            step={1}
            value={d.turningCircle}
            onChange={e => set('turningCircle', num(e.target.value, 0))}
            onBlur={e => {
              const v = num(e.currentTarget.value, 0);
              if (v > 0 && v < 19) set('turningCircle', 19);
            }}
          />
        </label>

        <label>
          Entrance Allowance (m)
          <input
            type="number"
            step={1}
            value={d.entranceAllowance}
            onChange={e => set('entranceAllowance', num(e.target.value, 0))}
          />
        </label>

        {/* Row 4 */}
        <label>
          Cross Over Width (m)
          <input
            type="number"
            step={0.1}
            value={d.crossOverWidth}
            onChange={e => set('crossOverWidth', num(e.target.value, 0))}
          />
        </label>

        <label>
          End Post Offset (m)
          <input
            type="number"
            step={0.01}
            value={d.endPostOffset}
            onChange={e => set('endPostOffset', num(e.target.value, 0))}
          />
        </label>

        <label>
          Stay Post Offset (m)
          <input
            type="number"
            step={0.1}
            value={d.stayPostOffset}
            onChange={e => set('stayPostOffset', num(e.target.value, 0))}
          />
        </label>

        {/* Row 5 — NEW defaults requested (no calculator inputs) */}
        <label>
          Feed Lane Width (m)
          <input
            type="number"
            step={0.1}
            value={d.feedLaneWidth}
            onChange={e => set('feedLaneWidth', num(e.target.value, 4.7))}
          />
        </label>

        <label>
          Tractor Lane Width (m)
          <input
            type="number"
            step={0.1}
            value={d.tractorLaneWidth}
            onChange={e => set('tractorLaneWidth', num(e.target.value, 6.0))}
          />
        </label>

        <label>
          Feed Above Cow Lane (m)
          <input
            type="number"
            step={0.01}
            value={d.feedAboveCow}
            onChange={e => set('feedAboveCow', num(e.target.value, 0.15))}
          />
        </label>
      </div>

      <div className="actions" style={{ marginTop: 18 }}>
        <button className="btn btn-sm" onClick={onSave}>Save Defaults</button>
        <button className="btn btn-sm ghost" onClick={() => nav('/')}>Cancel</button>
      </div>
    </div>
  );
}
