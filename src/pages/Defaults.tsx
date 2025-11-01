import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

export default function DefaultsPage() {
  const [form, setForm] = useState<Defaults | null>(null);
  const [saving, setSaving] = useState(false);
  const nav = useNavigate();

  useEffect(() => { (async () => setForm(await loadDefaults()))(); }, []);
  if (!form) return <div className="card out"><p>Loading…</p></div>;

  function set<K extends keyof Defaults>(key: K, val: Defaults[K]) {
    setForm(prev => (prev ? { ...prev, [key]: val } : prev));
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveDefaults(form!);
      nav('/'); // return to Home automatically
    } finally { setSaving(false); }
  }

  return (
    <div className="card out">
      <h2 className="v">Default Settings</h2>

      {/* Keep structural defaults. Removed Cow Type & Bunk/ Cow. */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        <label> Feed Pad Slope (%)
          <input type="number" step="0.1" value={form.feedPadSlopePct}
                 onChange={e => set('feedPadSlopePct', Number(e.target.value))}/>
        </label>

        <label> Feed Wall Thickness (m)
          <input type="number" step="0.01" value={form.feedWallThickness}
                 onChange={e => set('feedWallThickness', Number(e.target.value))}/>
        </label>

        <label> Nib Wall Thickness (m)
          <input type="number" step="0.01" value={form.nibWallThickness}
                 onChange={e => set('nibWallThickness', Number(e.target.value))}/>
        </label>

        <label> Feed Wall Post Spacing (m)
          <input type="number" step="0.1" value={form.feedWallPostSpacing}
                 onChange={e => set('feedWallPostSpacing', Number(e.target.value))}/>
        </label>

        <label> Feed Wall Post Size
          <select value={form.feedWallPostSize}
                  onChange={e => set('feedWallPostSize', e.target.value)}>
            <option>40NB</option><option>50NB</option><option>65NB</option><option>80NB</option>
          </select>
        </label>

        <label> Cow Lane Post Spacing (m)
          <input type="number" step="0.1" value={form.cowLanePostSpacing}
                 onChange={e => set('cowLanePostSpacing', Number(e.target.value))}/>
        </label>

        <label> Cow Lane Post Size
          <select value={form.cowLanePostSize}
                  onChange={e => set('cowLanePostSize', e.target.value)}>
            <option>40NB</option><option>50NB</option><option>65NB</option><option>80NB</option>
          </select>
        </label>

        <label> Turning Circle Allowance (m)
          <input type="number" step="0.1" value={form.turningCircle}
                 onChange={e => set('turningCircle', Number(e.target.value))}/>
        </label>

        <label> Entrance Allowance (m)
          <input type="number" step="0.1" value={form.entranceAllowance}
                 onChange={e => set('entranceAllowance', Number(e.target.value))}/>
        </label>

        <label> End Post Offset (m)
          <input type="number" step="0.01" value={form.endPostOffset}
                 onChange={e => set('endPostOffset', Number(e.target.value))}/>
        </label>

        <label> Stay Post Offset (m)
          <input type="number" step="0.01" value={form.stayPostOffset}
                 onChange={e => set('stayPostOffset', Number(e.target.value))}/>
        </label>

        {/* Optional crossover if you’ve stored it; otherwise leave out of the UI.
            We read it in Calculator with a default 0. */}
      </section>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Defaults'}
        </button>
        <button className="btn ghost" onClick={() => nav('/')}>Cancel</button>
      </div>
    </div>
  );
}
