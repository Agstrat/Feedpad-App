// src/pages/Calculator.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportToPdf } from '../lib/export';

// ---- types & localStorage helpers ------------------------------------------
type Defaults = {
  slopePct: number;            // D17
  wallThk: number;             // D3
  nibThk: number;              // D4
  feedWallPostSpacing: number; // D7
  cowLanePostSpacing: number;  // D9
  turningCircle: number;       // D13
  entranceAllowance: number;   // D14
  crossOverWidth: number;      // D12
  endPostOffset: number;       // D15
  stayPostOffset: number;      // D16
  feedLaneWidth: number;       // NEW
  tractorLaneWidth: number;    // NEW
  feedAboveCowLane: number;    // NEW (not used in calc, kept for parity)
};

const LS_KEYS = [
  'feedpad.defaults.v1',  // previous
  'fp.defaults.v1',       // fallback
];

// read defaults from localStorage safely
function readDefaults(): Defaults {
  for (const k of LS_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const d = JSON.parse(raw);
      return {
        slopePct: +d.slopePct || 1,
        wallThk: +d.wallThk || 0.2,
        nibThk: +d.nibThk || 0.15,
        feedWallPostSpacing: +d.feedWallPostSpacing || 3,
        cowLanePostSpacing: +d.cowLanePostSpacing || 2.5,
        turningCircle: +d.turningCircle || 20,
        entranceAllowance: +d.entranceAllowance || 10,
        crossOverWidth: +d.crossOverWidth || 0,
        endPostOffset: +d.endPostOffset || 0.15,
        stayPostOffset: +d.stayPostOffset || 1,
        feedLaneWidth: +d.feedLaneWidth || 4.7,
        tractorLaneWidth: +d.tractorLaneWidth || 5.6,
        feedAboveCowLane: +d.feedAboveCowLane || 0.15,
      };
    } catch {
      /* continue */
    }
  }
  // sensible defaults if nothing found
  return {
    slopePct: 1,
    wallThk: 0.2,
    nibThk: 0.15,
    feedWallPostSpacing: 3,
    cowLanePostSpacing: 2.5,
    turningCircle: 20,
    entranceAllowance: 10,
    crossOverWidth: 0,
    endPostOffset: 0.15,
    stayPostOffset: 1,
    feedLaneWidth: 4.7,
    tractorLaneWidth: 5.6,
    feedAboveCowLane: 0.15,
  };
}

// cow class -> bunk allowance (m/cow) and throat (for completeness)
const COW_CLASSES: { label: string; bunk: number; throat: number }[] = [
  { label: 'HF < 60kg',        bunk: 0.30, throat: 0.33 },
  { label: 'HF 60 - 100kg',    bunk: 0.36, throat: 0.36 },
  { label: 'HF 100 - 150kg',   bunk: 0.41, throat: 0.37 },
  { label: 'HF 150 - 200kg',   bunk: 0.51, throat: 0.38 },
  { label: 'HF 200 - 300kg',   bunk: 0.56, throat: 0.42 },
  { label: 'HF 300 - 400kg',   bunk: 0.61, throat: 0.45 },
  { label: 'JX 410 - 500kg',   bunk: 0.56, throat: 0.45 },
  { label: 'HF 500 - 590kg',   bunk: 0.61, throat: 0.45 },
  { label: 'HF 590 - 690kg',   bunk: 0.67, throat: 0.50 },
  { label: 'HF 690 - 780kg',   bunk: 0.72, throat: 0.50 },
];

// -----------------------------------------------------------------------------

export default function Calculator() {
  const defaults = useMemo(readDefaults, []);

  // inputs
  const [totalCows, setTotalCows] = useState<number>(500);
  const [pctEat, setPctEat] = useState<number>(100);
  const [lanes, setLanes] = useState<2 | 4>(2);
  const [cowClass, setCowClass] = useState(COW_CLASSES[7].label); // HF 500-590 default
  const [turning, setTurning] = useState<number>(defaults.turningCircle);
  const [entrance, setEntrance] = useState<number>(defaults.entranceAllowance);

  // derived class data
  const bunk = useMemo(
    () => (COW_CLASSES.find(c => c.label === cowClass)?.bunk ?? 0.61),
    [cowClass]
  );

  // calculations (VBA-aligned)
  const cowsEating = useMemo(() => Math.round(totalCows * (pctEat / 100)), [totalCows, pctEat]);

  const cowsPerLane = useMemo(() => {
    const faces = lanes; // 2 or 4 feed faces total
    return faces ? Math.round(cowsEating / faces) : 0;
  }, [cowsEating, lanes]);

  const feedLaneLenPerLane = useMemo(() => {
    // raw feed-face length (single face) before post rounding
    const perRowFactor = lanes === 4 ? 0.25 : 0.5; // VBA logic (faces per cow)
    const rawLen = totalCows * (pctEat / 100) * perRowFactor * bunk;

    // round up to bays by feedWallPostSpacing
    const bays = Math.ceil(rawLen / defaults.feedWallPostSpacing);
    const feedLen = bays * defaults.feedWallPostSpacing;

    // add both ends (endPostOffset + stayPostOffset) each end
    const baseLen = feedLen + 2 * (defaults.endPostOffset + defaults.stayPostOffset);

    // include crossover width
    const withCross = baseLen + defaults.crossOverWidth;

    return withCross;
  }, [totalCows, pctEat, lanes, bunk, defaults]);

  const feedPadWidth = useMemo(() => {
    if (lanes === 4) {
      // (4*d1)+(2*d2)+(4*d3)+(3*d4)
      return (4 * defaults.feedLaneWidth) +
             (2 * defaults.tractorLaneWidth) +
             (4 * defaults.wallThk) +
             (3 * defaults.nibThk);
    }
    // (2*d1)+(2*d3)+(2*d4)+d2
    return (2 * defaults.feedLaneWidth) +
           (2 * defaults.wallThk) +
           (2 * defaults.nibThk) +
           defaults.tractorLaneWidth;
  }, [lanes, defaults]);

  const overallLen = useMemo(
    () => feedLaneLenPerLane + turning + entrance,
    [feedLaneLenPerLane, turning, entrance]
  );

  const riseAtSlope = useMemo(
    () => overallLen * (defaults.slopePct / 100),
    [overallLen, defaults]
  );

  const catchmentArea = useMemo(
    () => Math.round(feedPadWidth * overallLen),
    [feedPadWidth, overallLen]
  );

  // iOS refresh loop guard (rare, but cheap no-op)
  useEffect(() => {
    // noop; placeholder in case we later need to add a manifest/version sanity check
  }, []);

  return (
    <div className="wrap">
      <div className="card" style={{ maxWidth: 920 }}>
        <h1>Feedpad Calculator</h1>

        {/* INPUTS */}
        <div className="form-grid" style={{ marginTop: 8 }}>
          <label>
            <span>Total Cows</span>
            <input
              inputMode="numeric"
              value={formatInt(totalCows)}
              onChange={(e) => setTotalCows(parseInt(e.target.value.replace(/,/g, '')) || 0)}
            />
          </label>

          <label>
            <span>% that eat at once</span>
            <input
              inputMode="numeric"
              value={pctEat}
              onChange={(e) => setPctEat(+e.target.value || 0)}
            />
          </label>

          <label>
            <span>Feed Lanes</span>
            <select value={lanes} onChange={(e) => setLanes((+e.target.value as 2 | 4) || 2)}>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </label>

          <span />{/* spacer to keep 4-column rhythm */}

          <label style={{ gridColumn: '1 / span 2' }}>
            <span>Cow Weight Range</span>
            <select value={cowClass} onChange={(e) => setCowClass(e.target.value)}>
              {COW_CLASSES.map(c => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Turning Circle Allowance (m)</span>
            <input
              inputMode="decimal"
              value={turning}
              onChange={(e) => setTurning(+e.target.value || 0)}
            />
          </label>

          <label>
            <span>Entrance Allowance (m)</span>
            <input
              inputMode="decimal"
              value={entrance}
              onChange={(e) => setEntrance(+e.target.value || 0)}
            />
          </label>
        </div>

        {/* OUTPUTS (PDF target) */}
        <div id="calc-summary" style={{ marginTop: 18 }}>
          <Line k="Bunk allowance (m/cow)" v={fmt(bunk)} />
          <Line k="Cows eating now" v={formatInt(cowsEating)} />
          <Line k="Cows per lane" v={formatInt(cowsPerLane)} />
          <Line k="Feed lane length (per lane)" v={`${fmt(feedLaneLenPerLane)} m`} />
          <Line k="Overall feedpad width" v={`${fmt(feedPadWidth)} m`} />
          <Line k="Overall feedpad length" v={`${fmt(overallLen)} m`} />
          <Line k="Crossover allowance" v={`${fmt(defaults.crossOverWidth)} m`} />
          <Line k={`Elevation rise @ ${defaults.slopePct}%`} v={`${fmt(riseAtSlope)} m`} />
          <Line k="Catchment area" v={`${formatInt(catchmentArea)} m²`} />
        </div>

        {/* ACTIONS – moved BELOW outputs for mobile */}
        <div className="actions" style={{ marginTop: 14 }}>
          <button
            className="btn btn-sm"
            onClick={() => exportToPdf('#calc-summary', 'feedpad.pdf')}
          >
            Save Calculations (PDF)
          </button>

          <Link to="/" className="btn btn-sm ghost">Save &amp; Return to Home</Link>
        </div>
      </div>
    </div>
  );
}

// ---- small presentational helpers ------------------------------------------
function Line({ k, v }: { k: string; v: string }) {
  return (
    <p style={{ margin: '6px 0' }}>
      <strong>{k}:</strong> {v}
    </p>
  );
}

function fmt(n: number, dp = 2) {
  if (!isFinite(n)) return '0';
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
}

function formatInt(n: number) {
  if (!isFinite(n)) return '0';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n));
}
