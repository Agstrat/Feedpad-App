import React, { useEffect, useMemo, useState } from 'react';
import { loadDefaults, saveDefaults, type Defaults } from '../db';

/* ------- Cow weight → bunk allowance (m/cow) ------- */
const BUNK_BY_CLASS: Record<string, number> = {
  'HF 100 - 150kg': 0.30,
  'HF 150 - 200kg': 0.36,
  'HF 200 - 300kg': 0.41,
  'HF 300 - 400kg': 0.51,
  'JX 410 - 500kg': 0.56,
  'HF 500 - 590kg': 0.61,
  'HF 590 - 690kg': 0.67,
  'HF 690 - 790kg': 0.72,
  'Jersey 430 - 520kg': 0.56, // keep jersey line you used
};

const COW_CLASSES = Object.keys(BUNK_BY_CLASS);

/* ------- Core derivations (can be swapped to your exact Excel logic) ------- */
function derive(
  totalCows: number,
  pctEat: number,             // 0–100
  lanes: number,              // 1 or 2
  cowClass: string,           // maps to bunk allowance
  turnAllowance: number,      // m
  entranceAllowance: number,  // m
  slopePct: number            // from defaults
) {
  const bunkPerCow = BUNK_BY_CLASS[cowClass] ?? 0.67;

  const canEat = Math.max(0, Math.round((totalCows || 0) * (pctEat || 0) / 100));
  const perLane = lanes > 0 ? canEat / lanes : 0;

  // feed lane length (per lane) = cows per lane * bunk per cow
  const feedLaneLen = perLane * bunkPerCow; // metres

  // overall pad length (simple baseline from your earlier OP6 snapshot)
  // OP6 earlier: totalLen = feedLaneLen + crossOver + turning + entrance
  // (no explicit crossOver given here, so we use turning + entrance + feed lane)
  const overallLen = turnAllowance + entranceAllowance + feedLaneLen;

  // elevation rise across pad with given slope
  const elevationRise = (slopePct / 100) * overallLen; // metres

  return { bunkPerCow, canEat, perLane, feedLaneLen, overallLen, elevationRise };
}

export default function Calculator() {
  const [defs, setDefs] = useState<Defaults | null>(null);

  // runtime inputs (Calculator owns these)
  const [totalCows, setTotalCows] = useState<number>(0);
  const [pctEat, setPctEat] = useState<number>(100);
  const [lanes, setLanes] = useState<1 | 2>(2);
  const [cowClass, setCowClass] = useState<string>('HF 590 - 690kg');
  const [turnAllowance, setTurnAllowance] = useState<number>(23);
  const [entranceAllowance, setEntranceAllowance] = useState<number>(10);

  useEffect(() => {
    (async () => {
      const d = await loadDefaults();
      setDefs(d);
      // seed runtime inputs from persisted defaults where sensible
      setTotalCows(d.totalCows ?? 0);
      setLanes(d.feedLanes);
      setCowClass(d.cowType);
      setTurnAllowance(d.turningCircle);
      setEntranceAllowance(d.entranceAllowance);
      setPctEat(d.stockingRatePct ?? 100);
    })();
  }, []);

  const out = useMemo(() => {
    const slope = defs?.feedPadSlopePct ?? 1;
    return derive(totalCows, pctEat, lanes, cowClass, turnAllowance, entranceAllowance, slope);
  }, [defs, totalCows, pctEat, lanes, cowClass, turnAllowance, entranceAllowance]);

  // optionally persist last-used runtime values (safe, fire-and-forget)
  useEffect(() => {
    if (!defs) return;
    void saveDefaults({
      ...defs,
      totalCows,
      stockingRatePct: pctEat,
      feedLanes: lanes,
      cowType: cowClass,
      turningCircle: turnAllowance,
      entranceAllowance,
    });
  }, [defs, totalCows, pctEat, lanes, cowClass, turnAllowance, entranceAllowance]);

  return (
    <div className="card out" id="calculator-root">
      <h2 className="v">Calculator</h2>

      {!defs ? (
        <p>Loading…</p>
      ) : (
        <>
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
              <select value={lanes} onChange={e => setLanes(Number(e.target.value) as 1 | 2)}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>

            <label> Cow Weight Range
              <select value={cowClass} onChange={e => setCowClass(e.target.value)}>
                {COW_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label> Turning Circle Allowance (m)
              <input type="number" step="0.1" value={turnAllowance}
                     onChange={e => setTurnAllowance(Number(e.target.value))}/>
            </label>

            <label> Entrance Allowance (m)
              <input type="number" step="0.1" value={entranceAllowance}
                     onChange={e => setEntranceAllowance(Number(e.target.value))}/>
            </label>
          </div>

          {/* Outputs */}
          <div style={{ marginTop: 16 }}>
            <div><strong>Bunk allowance (m/cow):</strong> {out.bunkPerCow.toFixed(2)}</div>
            <div><strong>How many eat at once:</strong> {out.canEat}</div>
            <div><strong>Cows per lane:</strong> {Number.isFinite(out.perLane) ? Math.round(out.perLane) : 0}</div>
            <div><strong>Feed lane length (per lane):</strong> {out.feedLaneLen.toFixed(2)} m</div>
            <div><strong>Overall feedpad length (baseline):</strong> {out.overallLen.toFixed(2)} m</div>
            <div><strong>Elevation rise @ {defs.feedPadSlopePct}%:</strong> {out.elevationRise.toFixed(3)} m</div>
          </div>
        </>
      )}
    </div>
  );
}
