import React, { useMemo, useState } from 'react'

/** Cow weight range → bunk allowance (m/cow). Adjust labels/values as needed. */
const COW_CLASSES = [
  { id: 'HF500', label: 'HF 500 – 590 kg', bunkM: 0.61 },
  { id: 'HF590', label: 'HF 590 – 690 kg', bunkM: 0.67 },
  { id: 'HF690', label: 'HF 690 – 780 kg', bunkM: 0.72 },
  { id: 'JX410', label: 'Jersey 410 – 500 kg', bunkM: 0.56 },
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

/** Pull Defaults from localStorage with safe fallbacks */
function getDefaults() {
  try {
    // Try a few common keys; fallback to constants if not found
    const raw =
      localStorage.getItem('feedpad-defaults') ||
      localStorage.getItem('defaults') ||
      '{}'
    const j = JSON.parse(raw)

    const feedLaneWidth =
      Number(j.feedLaneWidth ?? j.feed_lane_width ?? j.D1 ?? 4.7) || 4.7
    const tractorLaneWidth =
      Number(j.tractorLaneWidth ?? j.tractor_lane_width ?? j.D2 ?? 5.6) || 5.6
    const crossoverM =
      Number(j.crossOverWidth ?? j.crossover ?? j.D12 ?? 0) || 0

    return { feedLaneWidth, tractorLaneWidth, crossoverM }
  } catch {
    return { feedLaneWidth: 4.7, tractorLaneWidth: 5.6, crossoverM: 0 }
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const nInt = (s: string, d = 0) => (s.trim() === '' ? d : parseInt(s, 10))

export default function Calculator(): JSX.Element {
  const [inp, setInp] = useState<Inputs>({
    totalCows: 600,
    percentEating: 100,
    lanes: 2,
    cowClassId: 'HF500',
    turningCircleM: 25,
    entranceM: 20,
  })

  const defaults = getDefaults()
  const cowClass = COW_CLASSES.find(c => c.id === inp.cowClassId)!  // always exists

  /** Derived — EXACT fields you requested in the same wording */
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

    const catchmentArea = Math.round(overallLen * width)

    return {
      cowsThatCanEat,
      bunkPerCow: cowClass.bunkM,
      cowsPerLane,
      feedLaneLenIncXover,
      overallLen,
      width,
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
