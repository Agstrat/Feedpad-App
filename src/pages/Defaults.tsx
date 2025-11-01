import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

export default function DefaultsPage() {
  const nav = useNavigate();
  const [d, setD] = useState<Defaults | null>(null);

  useEffect(() => { (async () => setD(await loadDefaults()))(); }, []);

  if (!d) return <div className="card out"><h2 className="v">Default Settings</h2><p>Loading…</p></div>;

  return (
    <div className="card out">
      <h2 className="v">Default Settings</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        <label> Feed Pad Slope (%)
          <input type="number" step={0.1} value={d.feedPadSlopePct ?? 1}
                 onChange={e => setD({ ...d, feedPadSlopePct: Number(e.target.value) })}/>
        </label>

        <label> Feed Wall Thickness (m)
          <input type="number" step={0.01} value={d.feedWallThickness ?? 0.2}
                 onChange={e => setD({ ...d, feedWallThickness: Number(e.target.value) })}/>
        </label>

        <label> Nib Wall Thickness (m)
          <input type="number" step={0.01} value={d.nibWallThickness ?? 0.15}
                 onChange={e => setD({ ...d, nibWallThickness: Number(e.target.value) })}/>
        </label>

        <label> Feed Wall Post Spacing (m)
          <input type="number" step={0.1} value={d.feedWallPostSpacing ?? 3}
                 onChange={e => setD({ ...d, feedWallPostSpacing: Number(e.target.value) })}/>
        </label>

        <label> Feed Wall Post Size
          <select value={d.feedWallPostSize ?? '65NB'}
                  onChange={e => setD({ ...d, feedWallPostSize: e.target.value })}>
            <option>80NB</option><option>65NB</option><option>50NB</option><option>40NB</option>
          </select>
        </label>

        <label> Cow Lane Post Spacing (m)
          <input type="number" step={0.1} value={d.cowLanePostSpacing ?? 2.5}
                 onChange={e => setD({ ...d, cowLanePostSpacing: Number(e.target.value) })}/>
        </label>

        <label> Cow Lane Post Size
          <select value={d.cowLanePostSize ?? '50NB'}
                  onChange={e => setD({ ...d, cowLanePostSize: e.target.value })}>
            <option>80NB</option><option>65NB</option><option>50NB</option><option>40NB</option>
          </select>
        </label>

        <label> Turning Circle Allowance (m)
          <input type="number" min={19} step={1} value={d.turningCircle ?? 23}
                 onChange={e => setD({ ...d, turningCircle: Number(e.target.value) })}/>
        </label>

        <label> Entrance Allowance (m)
          <input type="number" step={1} value={d.entranceAllowance ?? 10}
                 onChange={e => setD({ ...d, entranceAllowance: Number(e.target.value) })}/>
        </label>

        {/* NEW: Cross Over Width */}
        <label> Cross Over Width (m)
          <input type="number" step={0.1} min={0} value={d.crossOverWidth ?? 0}
                 onChange={e => setD({ ...d, crossOverWidth: Number(e.target.value) })}/>
        </label>

        <label> End Post Offset (m)
          <input type="number" step={0.01} value={d.endPostOffset ?? 0.15}
                 onChange={e => setD({ ...d, endPostOffset: Number(e.target.value) })}/>
        </label>

        <label> Stay Post Offset (m)
          <input type="number" step={0.1} value={d.stayPostOffset ?? 1}
                 onChange={e => setD({ ...d, stayPostOffset: Number(e.target.value) })}/>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button
          className="btn"
          onClick={async () => { await saveDefaults(d); nav('/'); }}
        >
          Save Defaults
        </button>
        <button className="btn ghost" onClick={() => nav('/')}>Cancel</button>
      </div>
    </div>
  );
}
