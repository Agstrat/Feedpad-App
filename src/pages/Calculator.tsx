// src/pages/Calculator.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

/* Cow class → bunk allowance (m/cow) — unchanged list */
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
  pctEat: number;              // %
  lanes: 2 | 4;
  cowClass: string;
  turning: number;             // m
  entrance: number;            // m
  postSpace: number;           // D7
  endOff: number;              // D15
  stayOff: number;             // D16
  crossOver: number;           // D12
  slopePct: number;            // %
};

function excel_OP4_lenFeedLanes(i: CalcInputs) {
  const cowsEating = i.totalCows * (i.pctEat / 100);
  const perRowFactor = i.lanes === 4 ? 0.25 : 0.5;     // 4 lanes => 4 faces, 2 lanes => 2 faces
  const cowAllow = bunkFor(i.cowClass);

  const rawLen = cowsEating * perRowFactor * cowAllow;

  const bayCount = i.postSpace > 0 ? Math.ceil(rawLen / i.postSpace) : 0;
  const feedLen = bayCount * i.postSpace;

  const baseLen = feedLen + 2 * (i.endOff + i.stayOff);
  const finalLen = baseLen + (i.crossOver || 0);

  const cowsPerLane = cowsEating / i.lanes;

  return { rawLen, feedLen, finalLen, cowAllow, cowsEating, cowsPerLane };
}

function excel_OP6_overallLen(op4: number, turning: number, entrance: number) {
  return op4 + (turning || 0) + (entrance || 0);
}

export default function Calculator() {
  const nav = useNavigate();
  const { search } = useLocation();
  const [defs, setDefs] = useState<Defaults | null>(null);

  // inputs
  const [totalCows, setTotalCows] = useState(0);
  const [pctEat, setPctEat] = useState(100);
  const [lanes, setLanes] = useState<2 | 4>(2);
  const [cowClass, setCowClass] = useState<string>('HF 590 - 690kg');
  const [turning, setTurning] = useState(23);
  const [entrance, setEntrance] = useState(10);

  // load defaults
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

  // calculate
  const out = useMemo(() => {
    if (!defs) return null;

    const inputs: CalcInputs = {
      totalCows,
      pctEat,
      lanes,
      cowClass,
      turning,
      entrance,
      postSpace: defs.feedWallPostSpacing ?? 3,
      endOff: defs.endPostOffset ?? 0.15,
      stayOff: defs.stayPostOffset ?? 1,
      crossOver: defs.crossOverWidth ?? 0,
      slopePct: defs.feedPadSlopePct ?? 1,
    };

    const op4 = excel_OP4_lenFeedLanes(inputs);
    const op6 = excel_OP6_overallLen(op4.finalLen, turning, entrance);
    const rise = op6 * (inputs.slopePct / 100);

    return { inputs, op4, op6, rise };
  }, [defs, totalCows, pctEat, lanes, cowClass, turning, entrance]);

  // remember last used
  useEffect(() => {
    if (!defs) return;
    void saveDefaults({
      ...defs,
      totalCows,
      stockingRatePct: pctEat,
      feedLanes: lanes,
      cowType: cowClass,
      turningCircle: turning,
      entranceAllowance: entrance,
    });
  }, [defs, totalCows, pctEat, lanes, cowClass, turning, entrance]);

  // jsPDF export (unchanged)
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
    doc.text(`Crossover: ${defs.crossOverWidth ?? 0} m`, 110, y(4));
    doc.text(`Slope: ${defs.feedPadSlopePct}%`, 110, y(5));

    doc.line(14, y(6)-3, 196, y(6)-3);

    doc.text(`Cows eating now: ${Math.round(out.op4.cowsEating)}`, 14, y(6));
    doc.text(`Feed lane length (per lane): ${out.op4.finalLen.toFixed(2)} m`, 14, y(7));
    doc.text(`Overall feedpad length: ${out.op6.toFixed(2)} m`, 14, y(8));
    doc.text(`Elevation rise @ ${out.inputs.slopePct}%: ${out.rise.toFixed(2)} m`, 14, y(9));

    doc.save('feedpad-calculation.pdf');
  }

  // Support /calculator?pdf=1 → auto-export after render
  useEffect(() => {
    if (!out) return;
    const params = new URLSearchParams(search);
    if (params.get('pdf') === '1') {
      setTimeout(() => exportPDF(), 50);
    }
  }, [search, out]);

  if (!defs || !out) {
    return <div className="card out"><h2 className="v">Calculator</h2><p>Loading…</p></div>;
  }

  return (
    <div className="card out" id="calculator-root">
      <h2 className="v">Calculator</h2>

      {/* STRICT 4-COL GRID — matches your mock. Row 2: cow class spans 2 columns. */}
      <div className="form-grid">
        {/* Row 1 */}
        <label style={{ gridColumn: '1 / span 1' }}>
          Total Cows
          <input
            type="number"
            value={totalCows}
            onChange={e => setTotalCows(Number(e.target.value))}
          />
        </label>

        <label style={{ gridColumn: '2 / span 1' }}>
          % that eat at once
          <input
            type="number"
            min={0}
            max={100}
            value={pctEat}
            onChange={e => setPctEat(Math.max(0, Math.min(100, Number(e.target.value))))}
          />
        </label>

        <label style={{ gridColumn: '3 / span 1' }}>
          Feed Lanes
          <select value={lanes} onChange={e => setLanes(Number(e.target.value) as 2 | 4)}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>

        <div style={{ gridColumn: '4 / span 1' }} aria-hidden />

        {/* Row 2 — Cow Weight Range spans two columns */}
        <label style={{ gridColumn: '1 / span 2', maxWidth: 420 }}>
          Cow Weight Range
          <select
            value={cowClass}
            onChange={e => setCowClass(e.target.value)}
            style={{ width: '100%' }}
          >
            {CLASS_LABELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label style={{ gridColumn: '3 / span 1' }}>
          Turning Circle Allowance (m)
          <input
            type="number"
            min={19}
            step={1}
            value={turning}
            onChange={e => setTurning(Number(e.target.value))}
            onBlur={e => {
              const v = Number(e.currentTarget.value);
              if (!Number.isNaN(v) && v < 19) setTurning(19);
            }}
          />
        </label>

        <label style={{ gridColumn: '4 / span 1' }}>
          Entrance Allowance (m)
          <input
            type="number"
            step={1}
            value={entrance}
            onChange={e => setEntrance(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Outputs */}
      <div style={{ marginTop: 16 }}>
        <div><strong>Bunk allowance (m/cow):</strong> {out.op4.cowAllow.toFixed(2)}</div>
        <div><strong>Cows eating now:</strong> {Math.round(out.op4.cowsEating)}</div>
        <div><strong>Cows per lane:</strong> {Math.round(out.op4.cowsPerLane)}</div>
        <div><strong>Feed lane length (per lane):</strong> {out.op4.finalLen.toFixed(2)} m</div>
        <div><strong>Overall feedpad length:</strong> {out.op6.toFixed(2)} m</div>
        <div><strong>Crossover allowance:</strong> {out.inputs.crossOver ?? 0} m</div>
        <div><strong>Elevation rise @ {out.inputs.slopePct}%:</strong> {out.rise.toFixed(2)} m</div>
      </div>

      {/* Actions — use smaller buttons; independent of input layout */}
      <div className="actions">
        <button className="btn btn-sm" onClick={exportPDF}>Save Calculations (PDF)</button>
        <button className="btn btn-sm ghost" onClick={() => nav('/')}>Save & Return to Home</button>
      </div>
    </div>
  );
}
