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
  turning: number;             // m (D13)
  entrance: number;            // m (D14)
  postSpace: number;           // (D7)
  endOff: number;              // (D15)
  stayOff: number;             // (D16)
  crossOver: number;           // (D12)  included in OP4
  slopePct: number;            // (% D17)

  // From Defaults (D1..D4 + extras) — not editable here
  feedLaneWidth: number;       // D1
  tractorLaneWidth: number;    // D2
  feedWallThickness: number;   // D3
  nibWallThickness: number;    // D4
  feedAboveCow: number;        // extra default (height diff)
};

function calcOP4_lenFeedLanes(i: CalcInputs) {
  const cowsEating = i.totalCows * (i.pctEat / 100);
  const perRowFactor = i.lanes === 4 ? 0.25 : 0.5; // 4 lanes => 4 faces; 2 lanes => 2 faces
  const cowAllow = bunkFor(i.cowClass);

  const rawLen = cowsEating * perRowFactor * cowAllow;

  // round to bays
  const bayCount = i.postSpace > 0 ? Math.ceil(rawLen / i.postSpace) : 0;
  const feedLen = bayCount * i.postSpace;

  // add ends + crossover (per your VBA)
  const baseLen = feedLen + 2 * (i.endOff + i.stayOff);
  const finalLen = baseLen + (i.crossOver || 0);

  const cowsPerLane = cowsEating / i.lanes;

  return { rawLen, feedLen, finalLen, cowAllow, cowsEating, cowsPerLane };
}

function calcOP5_width(i: CalcInputs) {
  // VBA exact:
  // lanes=4:  (4*D1)+(2*D2)+(4*D3)+(3*D4)
  // else:     (2*D1)+(2*D3)+(2*D4)+D2
  if (i.lanes === 4) {
    return (4 * i.feedLaneWidth) + (2 * i.tractorLaneWidth) + (4 * i.feedWallThickness) + (3 * i.nibWallThickness);
  }
  return (2 * i.feedLaneWidth) + (2 * i.feedWallThickness) + (2 * i.nibWallThickness) + i.tractorLaneWidth;
}

function calcOP6_overallLen(op4_finalLen: number, turning: number, entrance: number) {
  // OP6 = OP4 + D13 + D14  (crossover already inside OP4)
  return op4_finalLen + (turning || 0) + (entrance || 0);
}

export default function Calculator() {
  const nav = useNavigate();
  const { search } = useLocation();
  const [defs, setDefs] = useState<Defaults | null>(null);

  // Inputs
  const [totalCows, setTotalCows] = useState(0);
  const [pctEat, setPctEat] = useState(100);
  const [lanes, setLanes] = useState<2 | 4>(2);
  const [cowClass, setCowClass] = useState<string>('HF 590 - 690kg');
  const [turning, setTurning] = useState(23);
  const [entrance, setEntrance] = useState(10);

  // Load defaults
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
    const dx = defs as any;

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
      crossOver: dx.crossOverWidth ?? 0,
      slopePct: dx.feedPadSlopePct ?? 1,

      // from defaults; provide safe fallbacks
      feedLaneWidth: Number(dx.feedLaneWidth ?? 4.7),         // D1
      tractorLaneWidth: Number(dx.tractorLaneWidth ?? 6.0),   // D2
      feedWallThickness: Number(dx.feedWallThickness ?? 0.20),// D3 (fallback)
      nibWallThickness: Number(dx.nibWallThickness ?? 0.20),  // D4 (fallback)
      feedAboveCow: Number(dx.feedAboveCow ?? 0.150),
    };

    const op4 = calcOP4_lenFeedLanes(inputs);                    // includes crossover
    const width = calcOP5_width(inputs);                         // OP5
    const op6 = calcOP6_overallLen(op4.finalLen, turning, entrance); // OP6
    const rise = op6 * (inputs.slopePct / 100);                  // OP15
    const area = width * op6;                                    // OP20

    return { inputs, op4, op5: width, op6, op7: turning, op8: entrance, rise, area };
  }, [defs, totalCows, pctEat, lanes, cowClass, turning, entrance]);

  // Save last-used
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

  // PDF export (structured; uses VBA-matching values)
  function exportPDF() {
    if (!defs || !out) return;
    const dx = defs as any;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const L = 40;
    let y = 50;
    const line = (txt: string, indent = 0) => { doc.text(txt, L + indent, y); y += 16; };
    const h = (txt: string) => {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); line(txt); y += 6;
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    };
    const sep = () => { y += 6; doc.line(L, y, 555, y); y += 18; };

    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Feed Pad Summary', L, y); y += 28;

    // Herd & Feed Pad Details
    h('Herd & Feed Pad Details');
    line(`Total cows in the herd: ${out.inputs.totalCows} cows`);
    line(`Cow breed & weight range: ${out.inputs.cowClass}`);
    line(`Feed bunk face allowance: ${out.op4.cowAllow.toFixed(2)} m/cow`);
    line(`% of cows that can eat at once: ${out.inputs.pctEat}%`);
    line(`Total cows that can eat at any one time: ${Math.round(out.op4.cowsEating)} cows`);
    line(`Cow lanes: ${out.inputs.lanes}`);
    line(`Cows per lane: ${Math.round(out.op4.cowsPerLane)} cows`);
    line(`Feed lane length (includes crossover): ${out.op4.finalLen.toFixed(2)} m`);
    line(`Center crossover allowance: ${Number(dx.crossOverWidth ?? 0)} m`);
    line(`Overall length of feed pad (incl. entrance, turning & crossover): ${out.op6.toFixed(2)} m`);
    line(`Overall feed pad width: ${out.op5.toFixed(2)} m`);
    sep();

    // Technical Specifications
    h('Feed Pad Technical Specifications');
    line(`Cow lane width (D1): ${out.inputs.feedLaneWidth.toFixed(2)} m`);
    line(`Tractor lane width (D2): ${out.inputs.tractorLaneWidth.toFixed(2)} m`);
    line(`Feed wall thickness (D3): ${out.inputs.feedWallThickness.toFixed(2)} m`);
    line(`Nib wall thickness (D4): ${out.inputs.nibWallThickness.toFixed(2)} m`);
    line(`Feed above cow lane: ${out.inputs.feedAboveCow.toFixed(3)} m`);
    line(`Feed wall post spacing: ${defs.feedWallPostSpacing} m`);
    line(`End offset: ${defs.endPostOffset} m`);
    line(`Stay offset: ${defs.stayPostOffset} m`);
    line(`Entrance allowance (D14): ${out.op8} m`);
    line(`Turning circle allowance (D13): ${out.op7} m`);
    line(`Feed pad slope: ${Number(dx.feedPadSlopePct ?? 1)} %`);
    line(`Elevation rise @ slope: ${out.rise.toFixed(2)} m`);
    sep();

    // Area
    h('Catchment / Surface Area');
    line(`Feed pad surface area (OP5 × OP6): ${Math.round(out.area)} m²`);

    doc.save('feedpad-calculation.pdf');
  }

  // Support /calculator?pdf=1
  useEffect(() => {
    if (!out) return;
    const params = new URLSearchParams(search);
    if (params.get('pdf') === '1') setTimeout(() => exportPDF(), 50);
  }, [search, out]);

  if (!defs || !out) {
    return (
      <div className="card">
        <h2 className="v">Feedpad Calculator</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="card" id="calculator-root">
      <h2 className="v">Feedpad Calculator</h2>

      {/* Two-column layout: LEFT = actions, RIGHT = inputs + outputs */}
      <div className="out">
        {/* LEFT: actions */}
        <div className="actions" style={{ flexDirection: 'column' }}>
          <button className="btn btn-sm" onClick={exportPDF}>Save Calculations (PDF)</button>
          <button className="btn btn-sm ghost" onClick={() => nav('/')}>Save & Return to Home</button>
        </div>

        {/* RIGHT: inputs + outputs */}
        <div>
          {/* Inputs */}
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

            {/* Row 2 */}
            <label style={{ gridColumn: '1 / span 2', maxWidth: 420 }}>
              Cow Weight Range
              <select
                value={cowClass}
                onChange={e => setCowClass(e.target.value)}
                style={{ width: '100%' }}
              >
                {CLASS_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
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
            <div><strong>Overall feedpad width:</strong> {out.op5.toFixed(2)} m</div>
            <div><strong>Overall feedpad length:</strong> {out.op6.toFixed(2)} m</div>
            <div><strong>Crossover allowance:</strong> {(defs as any).crossOverWidth ?? 0} m</div>
            <div><strong>Elevation rise @ {out.inputs.slopePct}%:</strong> {out.rise.toFixed(2)} m</div>
            <div><strong>Catchment area:</strong> {Math.round(out.area)} m²</div>
          </div>
        </div>
      </div>
    </div>
  );
}
