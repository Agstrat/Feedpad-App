import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

/* Cow class → bunk allowance (m/cow) */
const CLASSES = [
  ['HF < 60kg',        0.30],
  ['HF 60 - 100kg',    0.36],
  ['HF 100 - 150kg',   0.41],
  ['HF 150 - 200kg',   0.51],
  ['HF 200 - 300kg',   0.56],
  ['HF 300 - 400kg',   0.61],
  ['JX 410 - 500kg',   0.56],
  ['HF 500 - 590kg',   0.61],
  ['HF 590 - 690kg',   0.67],
  ['HF 690 - 780kg',   0.72],
] as const;

const CLASS_LABELS = CLASSES.map(c => c[0]);
const bunkFor = (label: string) => CLASSES.find(c => c[0] === label)?.[1] ?? 0.67;

type CalcInputs = {
  totalCows: number;
  pctEat: number;          // %
  lanes: 2 | 4;
  cowClass: string;
  turning: number;         // m
  entrance: number;        // m
  postSpace: number;       // D7 feed-wall post spacing
  endOff: number;          // D15
  stayOff: number;         // D16
  crossOver: number;       // D12 (optional)
  slopePct: number;        // %
};

function excel_OP4_lenFeedLanes(i: CalcInputs) {
  const cowsEating = i.totalCows * (i.pctEat / 100);
  const perRowFactor = i.lanes === 4 ? 0.25 : 0.5;     // 4 lanes → 4 faces, 2 lanes → 2 faces
  const cowAllow = bunkFor(i.cowClass);                // L1 from class

  // raw continuous feed-face length
  const rawLen = cowsEating * perRowFactor * cowAllow;

  // round up to whole bays
  const bayCount = i.postSpace > 0 ? Math.ceil(rawLen / i.postSpace) : 0;
  const feedLen = bayCount * i.postSpace;

  // add both ends, then include crossover
  const baseLen = feedLen + 2 * (i.endOff + i.stayOff);
  const finalLen = baseLen + (i.crossOver || 0);

  // cows per lane (your OP page shows 500 cows @ 2 lanes → 250)
  const cowsPerLane = cowsEating / i.lanes;

  return { rawLen, feedLen, finalLen, cowAllow, cowsEating, cowsPerLane, perRowFactor };
}

function excel_OP6_overallLen(op4: number, turning: number, entrance: number) {
  return op4 + (turning || 0) + (entrance || 0);
}

export default function Calculator() {
  const nav = useNavigate();
  const [defs, setDefs] = useState<Defaults | null>(null);

  // runtime inputs
  const [totalCows, setTotalCows] = useState(0);
  const [pctEat, setPctEat] = useState(100);
  const [lanes, setLanes] = useState<2 | 4>(2);
  const [cowClass, setCowClass] = useState<string>('HF 590 - 690kg');
  const [turning, setTurning] = useState(23);
  const [entrance, setEntrance] = useState(10);

  useEffect(() => {
    (async () => {
      const d = await loadDefaults();
      setDefs(d);
      setTotalCows(d.totalCows ?? 0);
      setPctEat(d.stockingRatePct ?? 100);
      setTurning(d.turningCircle ?? 23);
      setEntrance(d.entranceAllowance ?? 10);
      setCowClass(d.cowType ?? 'HF 590 - 690kg');
      setLanes((d.feedLanes as 2 | 4) ?? 2);
    })();
  }, []);

  const out = useMemo(() => {
    if (!defs) return null;

    const inputs: CalcInputs = {
      totalCows,
      pctEat,
      lanes,
      cowClass,
      turning,
      entrance,
      postSpace: defs.feedWallPostSpacing ?? 3,     // D7
      endOff: defs.endPostOffset ?? 0.15,          // D15
      stayOff: defs.stayPostOffset ?? 1,           // D16
      crossOver: (defs as any).crossOverWidth ?? 0,
      slopePct: defs.feedPadSlopePct ?? 1,
    };

    const op4 = excel_OP4_lenFeedLanes(inputs);
    const op6 = excel_OP6_overallLen(op4.finalLen, turning, entrance);
    const rise = op6 * (inputs.slopePct / 100);

    return { inputs, op4, op6, rise };
  }, [defs, totalCows, pctEat, lanes, cowClass, turning, entrance]);

  // persist last-used session values
  useEffect(() => {
    if (!defs) return;
    void saveDefaults({ ...defs,
      totalCows,
      stockingRatePct: pctEat,
      feedLanes: lanes,
      cowType: cowClass,
      turningCircle: turning,
      entranceAllowance: entrance,
    });
  }, [defs, totalCows, pctEat, lanes, cowClass, turning, entrance]);

  function exportPDF() {
    if (!defs || !out) return;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('FeedPad – Calculation Summary', 14, 16);

    doc.setFontSize(10);
    const y = (row: number) => 26 + row * 6;

    doc.text(`Total cows: ${totalCows}`, 14, y(0));
    doc.text(`% that eat at once: ${pctEat}%`, 14, y(1));
    doc.text(`Feed lanes: ${lanes}`, 14, y(2));
    doc.text(`Cow weight range: ${cowClass} (bunk ${out.op4.cowAllow.toFixed(2)} m/cow)`, 14, y(3));
    doc.text(`Turning circle: ${turning} m`, 14, y(4));
    doc.text(`Entrance: ${entrance} m`, 14, y(5));

    doc.text(`Cows per lane: ${Math.round(out.op4.cowsPerLane)}`, 110, y(0));
    doc.text(`Feed wall post spacing: ${defs.feedWallPostSpacing} m`, 110, y(1));
    doc.text(`End offset: ${defs.endPostOffset} m`, 110, y(2));
    doc.text(`Stay offset: ${defs.stayPostOffset} m`, 110, y(3));
    doc.text(`Crossover: ${(defs as any).crossOverWidth ?? 0} m`, 110, y(4));
    doc.text(`Slope: ${defs.feedPadSlopePct}%`, 110, y(5));

    doc.line(14, y(6)-3, 196, y(6)-3);

    doc.text(`Cows eating now: ${Math.round(out.op4.cowsEating)}`, 14, y(6));
    doc.text(`Raw feed-face length: ${out.op4.rawLen.toFixed(2)} m`, 14, y(7));
    doc.text(`Feed lane length (per lane): ${out.op4.finalLen.toFixed(2)} m`, 14, y(8));
    doc.text(`Overall feedpad length: ${out.op6.toFixed(2)} m`, 14, y(9));
    doc.text(`Elevation rise @ ${defs.feedPadSlopePct}%: ${out.rise.toFixed(2)} m`, 14, y(10));

    doc.save('feedpad-calculation.pdf');
  }

  if (!defs || !out) {
    return <div className="card out"><h2 className="v">Calculator</h2><p>Loading…</p></div>;
  }

  return (
    <div className="card out" id="calculator-root">
      <h2 className="v">Calculator</h2>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        <label> Total Cows
          <input type="number" value={totalCows}
                 onChange={e => setTotalCows(Number(e.target.value))}/>
        </label>

        <label> % that eat at once
          <input type="number" min={0} max={100} value={pctEat}
                 onChange={e => setPctEat(Math.max(0, Math.min(100, Number(e.target.value))))}/>
        </label>

        <label> Feed Lanes
          <select value={lanes} onChange={e => setLanes(Number(e.target.value) as 2 | 4)}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>

        <label> Cow Weight Range
          {/* widen the select so full label is visible */}
          <select style={{ minWidth: 220 }} value={cowClass} onChange={e => setCowClass(e.target.value)}>
            {CLASS_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <label> Turning Circle Allowance (m)
          {/* step=1; allow 20; enforce ≥19 on blur (no 0.1 jumps) */}
          <input
            type="number"
            min={19}
            step={1}
            value={turning}
            onChange={e => setTurning(Number(e.target.value))}
            onBlur={e => { const v = Number(e.currentTarget.value); if (!Number.isNaN(v) && v < 19) setTurning(19); }}
          />
        </label>

        <label> Entrance Allowance (m)
          <input type="number" step={1} value={entrance}
                 onChange={e => setEntrance(Number(e.target.value))}/>
        </label>
      </div>

      {/* Outputs */}
      <div style={{ marginTop: 16 }}>
        <div><strong>Bunk allowance (m/cow):</strong> {out.op4.cowAllow.toFixed(2)}</div>
        <div><strong>Cows eating now:</strong> {Math.round(out.op4.cowsEating)}</div>
        <div><strong>Cows per lane:</strong> {Math.round(out.op4.cowsPerLane)}</div>
        <div><strong>Feed lane length (per lane):</strong> {out.op4.finalLen.toFixed(2)} m</div>
        <div><strong>Overall feedpad length:</strong> {out.op6.toFixed(2)} m</div>
        <div><strong>Elevation rise @ {out.inputs.slopePct}%:</strong> {out.rise.toFixed(2)} m</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button className="btn" onClick={exportPDF}>Save Calculations (PDF)</button>
        <button className="btn ghost" onClick={() => nav('/')}>Save & Return to Home</button>
      </div>
    </div>
  );
}
