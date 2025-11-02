import React, { useMemo, useState } from 'react'

type Inputs = {
  cows: number
  weightKg: number
  lanes: number
  laneWidthM: number
  turningCircleM: number
}

/**
 * Calculator page
 * - Desktop: [Form | Summary] with Actions under Summary
 * - Mobile:  Summary → Actions → Form  (buttons BELOW the outputs as requested)
 */
export default function Calculator(): JSX.Element {
  const [inp, setInp] = useState<Inputs>({
    cows: 300,
    weightKg: 600,
    lanes: 2,
    laneWidthM: 5.0,
    turningCircleM: 20,
  })

  // === Example derived values (replace with your real calc functions) ===
  const derived = useMemo(() => {
    const cowsPerLane = inp.lanes > 0 ? Math.ceil(inp.cows / inp.lanes) : 0
    const estFeedBunkPerCowM = 0.67 // placeholder; wire to your cow class table
    const feedBunkTotalM = estFeedBunkPerCowM * inp.cows
    const surfaceAreaM2 = inp.lanes * inp.laneWidthM * 30 /* dummy length */
    return { cowsPerLane, estFeedBunkPerCowM, feedBunkTotalM, surfaceAreaM2 }
  }, [inp])

  // === Handlers ===
  const upd = (patch: Partial<Inputs>) => setInp(p => ({ ...p, ...patch }))

  const onCalculate = () => {
    // Hook up your real calculation routine here.
    // Layout will not change; only numbers will.
    console.log('Calculate with', inp)
  }

  const onReset = () => {
    setInp({
      cows: 300,
      weightKg: 600,
      lanes: 2,
      laneWidthM: 5.0,
      turningCircleM: 20,
    })
  }

  const onSave = () => {
    // Wire to your persistence/export as needed
    console.log('Save set', inp)
  }

  return (
    <div className="container">
      <div className="calc-layout">
        {/* ===== Right column on desktop / Top on mobile ===== */}
        <aside className="calc-summary">
          <div className="card stack">
            <h2>Outputs Summary</h2>

            <div className="summary-grid">
              <div className="k">Cows</div>
              <div className="v">{inp.cows.toLocaleString()}</div>

              <div className="k">Weight range (kg)</div>
              <div className="v">{inp.weightKg}</div>

              <div className="k">Lanes</div>
              <div className="v">{inp.lanes}</div>

              <div className="k">Cows per lane</div>
              <div className="v">{derived.cowsPerLane.toLocaleString()}</div>

              <div className="k">Feed bunk / cow (m)</div>
              <div className="v">{derived.estFeedBunkPerCowM.toFixed(2)}</div>

              <div className="k">Total feed bunk (m)</div>
              <div className="v">{derived.feedBunkTotalM.toFixed(1)}</div>

              <div className="k">Surface area (m²)</div>
              <div className="v">{derived.surfaceAreaM2.toLocaleString()}</div>
            </div>
          </div>
        </aside>

        {/* ===== Actions under summary on mobile (same column order) ===== */}
        <div className="calc-actions">
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <button className="btn" onClick={onCalculate}>Calculate</button>
            <button className="btn secondary" onClick={onSave}>Save</button>
            <button className="btn secondary" onClick={onReset}>Reset</button>
          </div>
        </div>

        {/* ===== Left column on desktop / Bottom on mobile ===== */}
        <main className="calc-form">
          <div className="card stack">
            <h2>Inputs</h2>

            <div className="row">
              <label>
                Total cows
                <input
                  type="number"
                  value={inp.cows}
                  min={0}
                  step={1}
                  onChange={e => upd({ cows: parseInt(e.target.value || '0', 10) })}
                />
              </label>

              <label>
                Avg cow weight (kg)
                <input
                  type="number"
                  value={inp.weightKg}
                  min={200}
                  step={10}
                  onChange={e => upd({ weightKg: parseInt(e.target.value || '0', 10) })}
                />
              </label>

              <label>
                Lanes
                <input
                  type="number"
                  value={inp.lanes}
                  min={1}
                  step={1}
                  onChange={e => upd({ lanes: parseInt(e.target.value || '1', 10) })}
                />
              </label>

              <label>
                Lane width (m)
                <input
                  type="number"
                  value={inp.laneWidthM}
                  min={1}
                  step={0.1}
                  onChange={e => upd({ laneWidthM: parseFloat(e.target.value || '0') })}
                />
              </label>

              <label>
                Turning circle allowance (m)
                <input
                  type="number"
                  value={inp.turningCircleM}
                  min={0}
                  step={1}
                  onChange={e => upd({ turningCircleM: parseInt(e.target.value || '0', 10) })}
                />
              </label>

              {/* Add any additional inputs here; layout will hold */}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
