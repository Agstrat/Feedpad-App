// src/pages/Calculator.tsx — FULL DROP-IN (fixes slope key -> feedPadSlopePct)
import React, { useMemo, useState } from 'react'

/** Weight options -> bunk allowance (m/cow) */
const COW_CLASSES = [
  { id: 'HF60_100',  label: 'HF 60 – 100kg',  bunkM: 0.36 },
  { id: 'HF100_150', label: 'HF 100 – 150kg', bunkM: 0.41 },
  { id: 'HF150_200', label: 'HF 150 – 200kg', bunkM: 0.51 },
  { id: 'HF200_300', label: 'HF 200 – 300kg', bunkM: 0.56 },
  { id: 'HF300_400', label: 'HF 300 – 400kg', bunkM: 0.61 },
  { id: 'JX410_500', label: 'JX 410 – 500kg',  bunkM: 0.56 },
  { id: 'HF500_590', label: 'HF 500 – 590kg', bunkM: 0.61 },
  { id: 'HF590_690', label: 'HF 590 – 690kg', bunkM: 0.67 },
  { id: 'HF690_780', label: 'HF 690 – 780kg', bunkM: 0.72 },
] as const
type CowClassId = typeof COW_CLASSES[number]['id']

type Inputs = {
  totalCows: number
  percentEating: number
  lanes: number
  cowClassId: CowClassId
  turningCircleM: number
  entranceM: number
}

/** Pull Defaults saved by Defaults page; read the exact keys it writes. */
function getDefaults() {
  try {
    // try both keys you've used before
    const raw =
      localStorage.getItem('feedpad-defaults') ||
      localStorage.getItem('defaults') ||
      '{}'
    const j = JSON.parse(raw)

    const feedLaneWidth =
      Number(j.feedLaneWidth ?? j.D1 ?? 4.7) || 4.7
    const tractorLaneWidth =
      Number(j.tractorLaneWidth ?? j.D2 ?? 5.6) || 5.6
    const crossoverM =
      Number(j.crossOverWidth ?? j.D12 ?? 0) || 0
    // 🔧 FIX: read the correct key from Defaults.tsx -> feedPadSlopePct
    const slopePct =
      Number(j.feedPadSlopePct ?? j.D17 ?? 1.0) || 1.0

    return { feedLaneWidth, tractorLaneWidth, crossoverM, slopePct }
  } catch {
    return { feedLaneWidth: 4.7, tractorLaneWidth: 5.6, crossoverM: 0, slopePct: 1.0 }
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const nInt = (s: string, d = 0) => (s.trim() === '' ? d : parseInt(s, 10))

export default function Calculator(): JSX.Element {
  const [inp, setInp] = useState<Inputs>({
    totalCows: 600,
    percentEating: 100,
    lanes: 2,
    cowClassId: 'HF590_690',
    turningCircleM: 25,
    entranceM: 20,
  })

  const defaults = getDefaults()
  const cowClass = COW_CLASSES.find(c => c.id === inp.cowClassId)!  // guaranteed

  /** Derived fields for summary */
  const d = useMemo(() => {
    const cowsThatCanEat = Math.round(inp.totalCows * clamp(inp.percentEating, 0, 100) / 100)
    const cowsPerLane = inp.lanes > 0 ? Math.ceil(cowsThatCanEat / inp.lanes) : 0

    // Feed lane length per lane from bunk allowance
    const perLaneLen = +(cowClass.bunkM * cowsPerLane).toFixed(2)

    // Include center crossover from Defaults
    const feedLaneLenIncXover = +(perLaneLen + defaults.crossoverM).toFixed(2)

    // Overall length = per-lane length + entrance + turning + crossover
    const overallLen = +(perLaneLen + inp.entranceM + inp.turningCircleM + defaults.crossoverM).toFixed(2)

    // Width = feed lane width + tractor lane width (from Defaults)
    const width = +(defaults.feedLaneWidth + defaults.tractorLaneWidth).toFixed(2)

    // Slope (%) and elevation rise (use feedPadSlopePct)
    const slopePct = defaults.slopePct
    const elevationM = +(overallLen * (slopePct / 100)).toFixed(2)

    const catchmentArea = Math.round(overallLen * width)

    return {
      cowsThatCanEat,
      bunkPerCow: cowClass.bunkM,
      cowsPerLane,
      feedLaneLenIncXover,
      overallLen,
      width,
      slopePct,
      elevationM,
      catchmentArea,
    }
  }, [inp, cowClass, defaults])

  const upd = (patch: Partial<Inputs>) => setInp(p => ({ ...p, ...patch }))

  return (
    <div className="calc-wrap">

      {/* ===== Inputs (TOP) ===== */}
      <section className="card">
        <h2 style={{ margin: 0, marginBottom: 8 }}>Feedpad Calculator</h2>
        <div className="inputs-grid">
          <label>
            Total Cows
            <input
              type="number" min={0} step={1}
              value={inp.totalCows}
              onChange={e => upd({ totalCows: nInt(e.target.value, 0) })}
            />
          </label>

          <label>
            % that can eat at once
            <input
              type="number" min={0} max={100} step={1}
              value={inp.percentEating}
              onChange={e => upd({ percentEating: clamp(nInt(e.target.value, 0), 0, 100) })}
            />
          </label>

          <label>
            Feed Lanes
            <input
              type="number" min={1} step={1}
              value={inp.lanes}
              onChange={e => upd({ lanes: Math.max(1, nInt(e.target.value, 1)) })}
            />
          </label>

          <label>
            Cow Weight Range
            <select
              value={inp.cowClassId}
              onChange={e => upd({ cowClassId: e.target.value as CowClassId })}
            >
              {COW_CLASSES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>

          <label>
            Turning circle allowance (m)
            <input
              type="number" min={0} step={1}
              value={inp.turningCircleM}
              onChange={e => upd({ turningCircleM: nInt(e.target.value, 0) })}
            />
          </label>

          <label>
            Entrance allowance (m)
            <input
              type="number" min={0} step={1}
              value={inp.entranceM}
              onChange={e => upd({ entranceM: nInt(e.target.value, 0) })}
            />
          </label>
        </div>
      </section>

      {/* ===== Summary (MIDDLE) ===== */}
      <section className="card">
        <h2 style={{ margin: 0, marginBottom: 8 }}>Outputs Summary</h2>
        <div className="summary-grid">
          <div className="k">Cows that can eat at once</div>
          <div className="v">{d.cowsThatCanEat.toLocaleString()}</div>

          <div className="k">Bunk allowance (m/cow)</div>
          <div className="v">{d.bunkPerCow.toFixed(2)}</div>

          <div className="k">Cows per lane</div>
          <div className="v">{d.cowsPerLane.toLocaleString()}</div>

          <div className="k">Feed lane length (incl. crossover)</div>
          <div className="v">{d.feedLaneLenIncXover.toFixed(2)} m</div>

          <div className="k">Overall feedpad length</div>
          <div className="v">{d.overallLen.toFixed(2)} m</div>

          <div className="k">Feedpad width</div>
          <div className="v">{d.width.toFixed(2)} m</div>

          <div className="k">Feedpad slope (%)</div>
          <div className="v">{d.slopePct.toFixed(2)}</div>

          <div className="k">Feedpad elevation (m)</div>
          <div className="v">{d.elevationM.toFixed(2)} m</div>

          <div className="k">Catchment area</div>
          <div className="v">{d.catchmentArea.toLocaleString()} m²</div>
        </div>
      </section>

      {/* ===== Actions (BOTTOM) ===== */}
      <section className="actions">
        <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Save Calculations (PDF)
        </button>
        <button className="btn secondary" onClick={() => (location.href = import.meta.env.BASE_URL)}>
          Save &amp; Return to Home
        </button>
      </section>
    </div>
  )
}
