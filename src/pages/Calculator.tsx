// src/pages/Calculator.tsx — FULL DROP-IN (lanes 2/4 + correct width + working PDF)
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
  lanes: 2 | 4
  cowClassId: CowClassId
  turningCircleM: number
  entranceM: number
}

/** Pull Defaults saved by Defaults page; read the exact keys it writes. */
function getDefaults() {
  try {
    const raw =
      localStorage.getItem('feedpad-defaults') ||
      localStorage.getItem('defaults') ||
      '{}'
    const j = JSON.parse(raw)

    const feedLaneWidth      = Number(j.feedLaneWidth)      || Number(j.D1)  || 4.7
    const tractorLaneWidth   = Number(j.tractorLaneWidth)   || Number(j.D2)  || 5.6
    const feedWallThickness  = Number(j.feedWallThickness)  || Number(j.D3)  || 0.2
    const nibWallThickness   = Number(j.nibWallThickness)   || Number(j.D4)  || 0.15
    const crossoverM         = Number(j.crossOverWidth)     || Number(j.D12) || 0
    const slopePct           = Number(j.feedPadSlopePct)    || Number(j.D17) || 1.0

    return { feedLaneWidth, tractorLaneWidth, feedWallThickness, nibWallThickness, crossoverM, slopePct }
  } catch {
    return { feedLaneWidth: 4.7, tractorLaneWidth: 5.6, feedWallThickness: 0.2, nibWallThickness: 0.15, crossoverM: 0, slopePct: 1.0 }
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const nInt = (s: string, d = 0) => (s.trim() === '' ? d : parseInt(s, 10))

/** Simple print helper that renders a minimal summary page and triggers print() */
function printSummary(title: string, html: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900')
  if (!w) return
  const styles = `
    <style>
      body{font-family:-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial;margin:24px;color:#111}
      h1{font-size:22px;margin:0 0 12px}
      table{border-collapse:collapse;width:100%}
      td{padding:6px 8px;border-bottom:1px solid #eee}
      td.k{opacity:.75}
      td.v{text-align:right;font-weight:700}
      @media print{button{display:none}}
    </style>`
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}</head><body>${html}<button onclick="print()">Print</button></body></html>`)
  w.document.close()
  w.focus()
}

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

    // ===== Width from lane geometry (uses Defaults d1..d4) =====
    const d1 = defaults.feedLaneWidth
    const d2 = defaults.tractorLaneWidth
    const d3 = defaults.feedWallThickness
    const d4 = defaults.nibWallThickness
    const width =
      inp.lanes === 4
        ? +( (4*d1) + (2*d2) + (4*d3) + (3*d4) ).toFixed(2)
        : +( (2*d1) + (2*d3) + (2*d4) + (d2) ).toFixed(2)

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
            <select
              value={inp.lanes}
              onChange={e => upd({ lanes: Number(e.target.value) as 2 | 4 })}
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
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
        <button
          className="btn"
          onClick={() => {
            const rows = [
              ['Cows that can eat at once', d.cowsThatCanEat.toLocaleString()],
              ['Bunk allowance (m/cow)', d.bunkPerCow.toFixed(2)],
              ['Cows per lane', d.cowsPerLane.toLocaleString()],
              ['Feed lane length (incl. crossover)', `${d.feedLaneLenIncXover.toFixed(2)} m`],
              ['Overall feedpad length', `${d.overallLen.toFixed(2)} m`],
              ['Feedpad width', `${d.width.toFixed(2)} m`],
              ['Feedpad slope (%)', d.slopePct.toFixed(2)],
              ['Feedpad elevation (m)', `${d.elevationM.toFixed(2)} m`],
              ['Catchment area', `${d.catchmentArea.toLocaleString()} m²`],
            ]
            const html = `
              <h1>Feedpad Calculations</h1>
              <table>${rows.map(r => `<tr><td class="k">${r[0]}</td><td class="v">${r[1]}</td></tr>`).join('')}</table>
            `
            printSummary('Feedpad Calculations', html)
          }}
        >
          Save Calculations (PDF)
        </button>

        <button className="btn secondary" onClick={() => (location.href = import.meta.env.BASE_URL)}>
          Save &amp; Return to Home
        </button>
      </section>
    </div>
  )
}
