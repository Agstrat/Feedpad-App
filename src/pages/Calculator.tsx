import React, { useMemo, useState } from 'react'

/** Cow class → bunk space mapping (controls feed bunk allowance) */
type CowClass = {
  id: string
  label: string
  bunkM: number
}
const COW_CLASSES: CowClass[] = [
  { id: 'HF500', label: 'HF 500 – 590 kg', bunkM: 0.61 },
  { id: 'HF590', label: 'HF 590 – 690 kg', bunkM: 0.67 },
  { id: 'HF690', label: 'HF 690 – 800 kg', bunkM: 0.72 },
  { id: 'JERSEY', label: 'Jersey 420 – 520 kg', bunkM: 0.56 },
]

type Inputs = {
  totalCows: number
  percentEating: number   // % that eat at once
  lanes: number
  cowClassId: string
  turningCircleM: number
  entranceM: number
  laneWidthM: number
  tractorLaneWidthM: number
  crossoverM: number      // center crossover allowance
}

/** Simple helpers */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const nInt = (v: string, d = 0) => (v.trim() === '' ? d : parseInt(v, 10))
const nFloat = (v: string, d = 0) => (v.trim() === '' ? d : parseFloat(v))

export default function Calculator(): JSX.Element {
  const [inp, setInp] = useState<Inputs>({
    totalCows: 600,
    percentEating: 100,
    lanes: 2,
    cowClassId: 'HF590',
    turningCircleM: 25,
    entranceM: 20,
    laneWidthM: 4.7,
    tractorLaneWidthM: 5.6,
    crossoverM: 0,
  })

  const cowClass = COW_CLASSES.find(c => c.id === inp.cowClassId)!;

  /** Derived values exactly like your report */
  const d = useMemo(() => {
    const cowsEatingNow = Math.round(inp.totalCows * clamp(inp.percentEating, 0, 100) / 100)
    const cowsPerLane  = inp.lanes > 0 ? Math.ceil(cowsEatingNow / inp.lanes) : 0

    // Feed lane length per lane = bunk per cow * cows per lane
    const feedLaneLenPerLane = +(cowClass.bunkM * cowsPerLane).toFixed(2)

    // Feed lane length (includes crossover) = per lane + crossover
    const feedLaneLenIncludesXover = +(feedLaneLenPerLane + inp.crossoverM).toFixed(2)

    // Overall pad length = feed lane length + entrance + turning circle + crossover
    const overallLen = +(feedLaneLenPerLane + inp.entranceM + inp.turningCircleM + inp.crossoverM).toFixed(2)

    // Overall pad width = feed lane width + tractor lane width
    const overallWidth = +(inp.laneWidthM + inp.tractorLaneWidthM).toFixed(2)

    // Total feed bunk (all eating cows)
    const totalBunk = +(cowClass.bunkM * cowsEatingNow).toFixed(2)

    // Catchment area basic (illustrative)
    const catchmentArea = Math.round(overallLen * overallWidth)

    return {
      cowsEatingNow,
      cowsPerLane,
      feedLaneLenPerLane,
      feedLaneLenIncludesXover,
      overallLen,
      overallWidth,
      totalBunk,
      catchmentArea,
    }
  }, [inp, cowClass])

  const upd = (patch: Partial<Inputs>) => setInp(p => ({ ...p, ...patch }))

  return (
    <div className="calc-wrap">

      <div className="calc-grid">
        {/* ===== Right column on desktop / top on mobile ===== */}
        <aside className="calc-summary">
          <div className="card" style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Outputs Summary</h2>
            <div className="summary-grid">
              <div className="k">Bunk allowance (m/cow)</div>
              <div className="v">{cowClass.bunkM.toFixed(2)}</div>

              <div className="k">Cows eating now</div>
              <div className="v">{d.cowsEatingNow.toLocaleString()}</div>

              <div className="k">Cows per lane</div>
              <div className="v">{d.cowsPerLane.toLocaleString()}</div>

              <div className="k">Feed lane length (per lane)</div>
              <div className="v">{d.feedLaneLenPerLane.toFixed(2)} m</div>

              <div className="k">Feed lane length (includes crossover)</div>
              <div className="v">{d.feedLaneLenIncludesXover.toFixed(2)} m</div>

              <div className="k">Overall feedpad width</div>
              <div className="v">{d.overallWidth.toFixed(2)} m</div>

              <div className="k">Overall feedpad length</div>
              <div className="v">{d.overallLen.toFixed(2)} m</div>

              <div className="k">Crossover allowance</div>
              <div className="v">{inp.crossoverM.toFixed(2)} m</div>

              <div className="k">Catchment area</div>
              <div className="v">{d.catchmentArea.toLocaleString()} m²</div>
            </div>
          </div>

          {/* ===== Actions (Sits under Outputs on mobile) ===== */}
          <div className="calc-actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Save Calculations (PDF)
            </button>
            <button className="btn secondary" onClick={() => (location.href = import.meta.env.BASE_URL)}>
              Save &amp; Return to Home
            </button>
          </div>
        </aside>

        {/* ===== Left column on desktop / bottom on mobile ===== */}
        <main className="calc-form">
          <div className="card" style={{ display: 'grid', gap: 16 }}>
            <h2 style={{ margin: 0 }}>Feedpad Calculator</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label>
                Total Cows
                <input type="number" min={0} step={1}
                  value={inp.totalCows}
                  onChange={e => upd({ totalCows: nInt(e.target.value, 0) })} />
              </label>

              <label>
                % that eat at once
                <input type="number" min={0} max={100} step={1}
                  value={inp.percentEating}
                  onChange={e => upd({ percentEating: clamp(nInt(e.target.value, 0), 0, 100) })} />
              </label>

              <label>
                Feed Lanes
                <input type="number" min={1} step={1}
                  value={inp.lanes}
                  onChange={e => upd({ lanes: Math.max(1, nInt(e.target.value, 1)) })} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label>
                Cow Weight Range
                <select
                  value={inp.cowClassId}
                  onChange={e => upd({ cowClassId: e.target.value })}
                >
                  {COW_CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Turning Circle Allowance (m)
                <input type="number" min={0} step={1}
                  value={inp.turningCircleM}
                  onChange={e => upd({ turningCircleM: nInt(e.target.value, 0) })} />
              </label>

              <label>
                Entrance Allowance (m)
                <input type="number" min={0} step={1}
                  value={inp.entranceM}
                  onChange={e => upd({ entranceM: nInt(e.target.value, 0) })} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label>
                Feed Lane Width (m)
                <input type="number" min={1} step={0.1}
                  value={inp.laneWidthM}
                  onChange={e => upd({ laneWidthM: nFloat(e.target.value, 1) })} />
              </label>

              <label>
                Tractor Lane Width (m)
                <input type="number" min={1} step={0.1}
                  value={inp.tractorLaneWidthM}
                  onChange={e => upd({ tractorLaneWidthM: nFloat(e.target.value, 1) })} />
              </label>

              <label>
                Center Crossover Allowance (m)
                <input type="number" min={0} step={1}
                  value={inp.crossoverM}
                  onChange={e => upd({ crossoverM: nFloat(e.target.value, 0) })} />
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
