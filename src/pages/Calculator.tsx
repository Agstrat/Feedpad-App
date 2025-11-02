import React, { useMemo, useState } from 'react'

type Inputs = {
  cows: number
  weightKg: number
  lanes: number
  laneWidthM: number
  turningCircleM: number
}

export default function Calculator(): JSX.Element {
  const [inp, setInp] = useState<Inputs>({
    cows: 300,
    weightKg: 600,
    lanes: 2,
    laneWidthM: 5,
    turningCircleM: 20,
  })

  // Minimal derived values to keep the page useful without touching your logic
  const d = useMemo(() => {
    const cowsPerLane = inp.lanes > 0 ? Math.ceil(inp.cows / inp.lanes) : 0
    const feedBunkPerCowM = 0.67
    const totalFeedBunkM = feedBunkPerCowM * inp.cows
    const surfaceAreaM2 = Math.round(inp.lanes * inp.laneWidthM * 30) // placeholder length for visual only
    return { cowsPerLane, feedBunkPerCowM, totalFeedBunkM, surfaceAreaM2 }
  }, [inp])

  const upd = (patch: Partial<Inputs>) => setInp(p => ({ ...p, ...patch }))

  // Buttons: layout only (no data mutations)
  const onCalculate = () => { /* hook your real calc here later */ }
  const onSave = () => { /* hook your real save/export here later */ }
  const onReset = () => setInp({ cows: 300, weightKg: 600, lanes: 2, laneWidthM: 5, turningCircleM: 20 })

  return (
    <div className="calc__container">
      <div className="calc__layout">

        {/* ===== Outputs Summary (right on desktop / top on phone) ===== */}
        <aside className="calc__summary">
          <div className="calc__card calc__stack">
            <h2>Outputs Summary</h2>
            <div className="calc__summaryGrid">
              <div className="calc__k">Cows</div>                 <div className="calc__v">{inp.cows.toLocaleString()}</div>
              <div className="calc__k">Weight range (kg)</div>    <div className="calc__v">{inp.weightKg}</div>
              <div className="calc__k">Lanes</div>                 <div className="calc__v">{inp.lanes}</div>
              <div className="calc__k">Cows per lane</div>         <div className="calc__v">{d.cowsPerLane.toLocaleString()}</div>
              <div className="calc__k">Feed bunk / cow (m)</div>   <div className="calc__v">{d.feedBunkPerCowM.toFixed(2)}</div>
              <div className="calc__k">Total feed bunk (m)</div>   <div className="calc__v">{d.totalFeedBunkM.toFixed(1)}</div>
              <div className="calc__k">Surface area (m²)</div>     <div className="calc__v">{d.surfaceAreaM2.toLocaleString()}</div>
            </div>
          </div>
        </aside>

        {/* ===== Buttons (under summary on phone) ===== */}
        <div className="calc__actions">
          <div className="calc__card calc__stack">
            <button onClick={onCalculate}>Calculate</button>
            <button onClick={onSave}>Save</button>
            <button onClick={onReset}>Reset</button>
          </div>
        </div>

        {/* ===== Inputs/Form (left on desktop / bottom on phone) ===== */}
        <main className="calc__form">
          <div className="calc__card calc__stack">
            <h2>Inputs</h2>

            <div className="calc__stack" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <label>
                Total cows
                <input
                  type="number" min={0} step={1}
                  value={inp.cows}
                  onChange={e => upd({ cows: parseInt(e.target.value || '0', 10) })}
                />
              </label>

              <label>
                Avg cow weight (kg)
                <input
                  type="number" min={200} step={10}
                  value={inp.weightKg}
                  onChange={e => upd({ weightKg: parseInt(e.target.value || '0', 10) })}
                />
              </label>

              <label>
                Lanes
                <input
                  type="number" min={1} step={1}
                  value={inp.lanes}
                  onChange={e => upd({ lanes: parseInt(e.target.value || '1', 10) })}
                />
              </label>

              <label>
                Lane width (m)
                <input
                  type="number" min={1} step={0.1}
                  value={inp.laneWidthM}
                  onChange={e => upd({ laneWidthM: parseFloat(e.target.value || '0') })}
                />
              </label>

              <label>
                Turning circle allowance (m)
                <input
                  type="number" min={0} step={1}
                  value={inp.turningCircleM}
                  onChange={e => upd({ turningCircleM: parseInt(e.target.value || '0', 10) })}
                />
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
