import { useEffect, useMemo, useState } from 'react';
import { loadSettings, saveSettings, db } from '../db';
import { downloadJSON, downloadPDF } from '../lib/export';

export default function Calculator() {
  const [v, setV] = useState<any>(null);
  useEffect(() => { loadSettings().then(setV); }, []);
  if (!v) return null;

  const upd = (k: string) => (e: any) => setV({ ...v, [k]: Number(e.target.value) });

  const width = useMemo(() => (v.feedLanes * v.feedLaneWidth) + v.tractorLaneWidth, [v]);
  const length = useMemo(() => v.feedLanesLen + v.entranceLen + v.turnLen, [v]);
  const area = useMemo(() => width * length, [width, length]);

  const saveAsDefaults = async () => { await saveSettings(v); alert('Saved as defaults'); };

  const exportSummary = async () => {
    const summary = {
      timestamp: new Date().toISOString(),
      projectName: 'FeedPad',
      inputs: {
        feedLanes: v.feedLanes, feedLaneWidth_m: v.feedLaneWidth, tractorLaneWidth_m: v.tractorLaneWidth,
        feedLanesLength_m: v.feedLanesLen, entranceLength_m: v.entranceLen, turnaroundLength_m: v.turnLen
      },
      outputs: {
        width_m: +width.toFixed(2),
        overallLength_m: +length.toFixed(2),
        area_m2: Math.round(area)
      }
    };
    // persist locally too
    await db.summaries.add(summary);
    // download files
    downloadJSON(`feedpad-summary-${Date.now()}.json`, summary);
    downloadPDF(`feedpad-summary-${Date.now()}.pdf`, summary);
  };

  return (
    <div className="wrap">
      <div className="card">
        <h1>Calculator</h1>
        <p className="muted">Adjust anything. Values loaded from your defaults.</p>

        <div className="grid three">
          <div><label>Feed lanes (count)</label><input type="number" step="1" value={v.feedLanes} onChange={upd('feedLanes')} /></div>
          <div><label>Feed lane width (m)</label><input type="number" step="0.01" value={v.feedLaneWidth} onChange={upd('feedLaneWidth')} /></div>
          <div><label>Tractor lane width (m)</label><input type="number" step="0.01" value={v.tractorLaneWidth} onChange={upd('tractorLaneWidth')} /></div>

          <div><label>Feed-lanes length (m)</label><input type="number" step="0.01" value={v.feedLanesLen} onChange={upd('feedLanesLen')} /></div>
          <div><label>Entrance length (m)</label><input type="number" step="0.01" value={v.entranceLen} onChange={upd('entranceLen')} /></div>
          <div><label>Turn-around length (m)</label><input type="number" step="0.01" value={v.turnLen} onChange={upd('turnLen')} /></div>
        </div>

        <div className="out">
          <div><div className="k">Feed pad width (m)</div><div className="v">{width.toFixed(2)}</div></div>
          <div><div className="k">Overall length (m)</div><div className="v">{length.toFixed(2)}</div></div>
          <div><div className="k">Total surface area (m²)</div><div className="v">{Math.round(area)}</div></div>
          <div></div>
        </div>

        <div className="row" style={{marginTop:16}}>
          <button className="btn" onClick={saveAsDefaults}>Save as new defaults</button>
          <button className="btn" onClick={exportSummary}>Export Summary (JSON + PDF)</button>
          <a className="btn ghost" href="/">Back</a>
        </div>
      </div>
    </div>
  );
}
