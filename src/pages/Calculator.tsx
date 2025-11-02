import React, { useMemo, useState } from 'react'

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

function getDefaults() {
  try {
    const raw = localStorage.getItem('feedpad-defaults') || localStorage.getItem('defaults') || '{}'
    const j = JSON.parse(raw)
    return {
      d1: Number(j.feedLaneWidth)      || Number(j.D1)  || 4.7,
      d2: Number(j.tractorLaneWidth)   || Number(j.D2)  || 5.6,
      d3: Number(j.feedWallThickness)  || Number(j.D3)  || 0.2,
      d4: Number(j.nibWallThickness)   || Number(j.D4)  || 0.15,
      xover: Number(j.crossOverWidth)  || Number(j.D12) || 0,
      endOff: Number(j.endPostOffset)  || Number(j.D15) || 0.15,
      stayOff:Number(j.stayPostOffset) || Number(j.D16) || 1,
      postSp:Number(j.feedWallPostSpacing) || Number(j.D7) || 3,
      feedAbove:Number(j.feedAboveCow) || Number(j.FeedAboveCow) || 0.15,
      slopePct: Number(j.feedPadSlopePct) || Number(j.D17) || 1.0,
    }
  } catch {
    return { d1:4.7, d2:5.6, d3:0.2, d4:0.15, xover:0, endOff:0.15, stayOff:1, postSp:3, feedAbove:0.15, slopePct:1.0 }
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const nInt = (s: string, d = 0) => (s.trim() === '' ? d : parseInt(s, 10))

/* Robust print window using Blob URL (prevents about:blank “white page”) */
function openPdfViewBlob(title: string, sections: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    body{font-family:-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial;margin:28px;color:#111}
    h1{font-size:22px;margin:0 0 16px}
    h2{font-size:16px;margin:18px 0 8px}
    .box{border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin:10px 0}
    .kv{display:grid;grid-template-columns:1fr auto;gap:8px 14px}
    .k{color:#6b7280}.v{font-weight:700}
    .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace}
    button{margin-top:14px;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:#fff}
    @media print{button{display:none}}
  </style></head><body>${sections}
  <button onclick="print()">Print</button></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
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

  const defs = getDefaults()
  const cowClass = COW_CLASSES.find(c => c.id === inp.cowClassId)!

  const d = useMemo(() => {
    const cowsThatCanEat = Math.round(inp.totalCows * clamp(inp.percentEating, 0, 100) / 100)
    const cowsPerLane = Math.ceil(cowsThatCanEat / inp.lanes)
    const perLaneLen = +(cowClass.bunkM * cowsPerLane).toFixed(2)
    const feedLaneLenIncXover = +(perLaneLen + defs.xover).toFixed(2)
    const overallLen = +(perLaneLen + inp.entranceM + inp.turningCircleM + defs.xover).toFixed(2)
    const width =
      inp.lanes === 4
        ? +( (4*defs.d1) + (2*defs.d2) + (4*defs.d3) + (3*defs.d4) ).toFixed(2)
        : +( (2*defs.d1) + (2*defs.d3) + (2*defs.d4) + (defs.d2) ).toFixed(2)
    const slopePct = defs.slopePct
    const elevationM = +(overallLen * (slopePct / 100)).toFixed(2)
    const catchmentArea = Math.round(overallLen * width)
    return { cowsThatCanEat, cowsPerLane, perLaneLen, feedLaneLenIncXover, overallLen, width, slopePct, elevationM, catchmentArea }
  }, [inp, defs, cowClass])

  const upd = (patch: Partial<Inputs>) => setInp(p => ({ ...p, ...patch }))

  // persist “last calculation” for /export page
  const persistLast = () => {
    const payload = {
      inputs: inp,
      defaults: defs,
      cowClass,
      outputs: d,
      ts: Date.now()
    }
    localStorage.setItem('feedpad-last-calc', JSON.stringify(payload))
  }

  return (
    <div className="calc-wrap">
      <section className="card">
        <h2 style={{ margin: 0, marginBottom: 8 }}>Feedpad Calculator</h2>
        <div className="inputs-grid">
          <label> Total Cows
            <input type="number" min={0} step={1}
              value={inp.totalCows}
              onChange={e => upd({ totalCows: nInt(e.target.value, 0) })}/>
          </label>

          <label>% that can eat at once
            <input type="number" min={0} max={100} step={1}
              value={inp.percentEating}
              onChange={e => upd({ percentEating: clamp(nInt(e.target.value, 0), 0, 100) })}/>
          </label>

          <label>Feed Lanes
            <select value={inp.lanes} onChange={e => upd({ lanes: Number(e.target.value) as 2 | 4 })}>
              <option value={2}>2</option><option value={4}>4</option>
            </select>
          </label>

          <label>Cow Weight Range
            <select value={inp.cowClassId} onChange={e => upd({ cowClassId: e.target.value as CowClassId })}>
              {COW_CLASSES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>

          <label>Turning circle allowance (m)
            <input type="number" min={0} step={1}
              value={inp.turningCircleM}
              onChange={e => upd({ turningCircleM: nInt(e.target.value, 0) })}/>
          </label>

          <label>Entrance allowance (m)
            <input type="number" min={0} step={1}
              value={inp.entranceM}
              onChange={e => upd({ entranceM: nInt(e.target.value, 0) })}/>
          </label>
        </div>
      </section>

      <section className="card">
        <h2 style={{ margin: 0, marginBottom: 8 }}>Outputs Summary</h2>
        <div className="summary-grid">
          <div className="k">Cows that can eat at once</div><div className="v">{d.cowsThatCanEat.toLocaleString()}</div>
          <div className="k">Bunk allowance (m/cow)</div><div className="v">{cowClass.bunkM.toFixed(2)}</div>
          <div className="k">Cows per lane</div><div className="v">{d.cowsPerLane.toLocaleString()}</div>
          <div className="k">Feed lane length (incl. crossover)</div><div className="v">{d.feedLaneLenIncXover.toFixed(2)} m</div>
          <div className="k">Overall feedpad length</div><div className="v">{d.overallLen.toFixed(2)} m</div>
          <div className="k">Feedpad width</div><div className="v">{d.width.toFixed(2)} m</div>
          <div className="k">Feedpad slope (%)</div><div className="v">{d.slopePct.toFixed(2)}</div>
          <div className="k">Feedpad elevation (m)</div><div className="v">{d.elevationM.toFixed(2)} m</div>
          <div className="k">Catchment area</div><div className="v">{d.catchmentArea.toLocaleString()} m²</div>
        </div>
      </section>

      <section className="actions">
        <button className="btn" onClick={() => {
          persistLast()
          const cls = cowClass
          const herd = `
            <h1>Feed Pad Summary</h1>
            <h2>Herd &amp; Feed Pad Details</h2>
            <div class="box kv">
              <div class="k">Total cows in the herd</div><div class="v">${inp.totalCows.toLocaleString()} cows</div>
              <div class="k">Cow breed &amp; weight range</div><div class="v">${cls.label}</div>
              <div class="k">Feed bunk face allowance</div><div class="v">${cls.bunkM.toFixed(2)} m/cow</div>
              <div class="k">% of cows that can eat at once</div><div class="v">${clamp(inp.percentEating,0,100)}%</div>
              <div class="k">Total cows that can eat at any one time</div><div class="v">${d.cowsThatCanEat.toLocaleString()} cows</div>
              <div class="k">Cow lanes</div><div class="v">${inp.lanes}</div>
              <div class="k">Cows per lane</div><div class="v">${d.cowsPerLane.toLocaleString()} cows</div>
              <div class="k">Feed lane length (includes crossover)</div><div class="v">${d.feedLaneLenIncXover.toFixed(2)} m</div>
              <div class="k">Center crossover allowance</div><div class="v">${getDefaults().xover.toFixed(2)} m</div>
              <div class="k">Overall length of feed pad (incl. entrance, turning &amp; crossover)</div><div class="v">${d.overallLen.toFixed(2)} m</div>
              <div class="k">Overall feed pad width</div><div class="v">${d.width.toFixed(2)} m</div>
            </div>`
          const tech = `
            <h2>Feed Pad Technical Specifications</h2>
            <div class="box kv mono">
              <div class="k">Cow lane width (D1)</div><div class="v">${getDefaults().d1.toFixed(2)} m</div>
              <div class="k">Tractor lane width (D2)</div><div class="v">${getDefaults().d2.toFixed(2)} m</div>
              <div class="k">Feed wall thickness (D3)</div><div class="v">${getDefaults().d3.toFixed(2)} m</div>
              <div class="k">Nib wall thickness (D4)</div><div class="v">${getDefaults().d4.toFixed(2)} m</div>
              <div class="k">Feed above cow lane</div><div class="v">${getDefaults().feedAbove.toFixed(3)} m</div>
              <div class="k">Feed wall post spacing</div><div class="v">${getDefaults().postSp} m</div>
              <div class="k">Entrance allowance (D14)</div><div class="v">${inp.entranceM} m</div>
              <div class="k">Turning circle allowance (D13)</div><div class="v">${inp.turningCircleM} m</div>
              <div class="k">Feed pad slope</div><div class="v">${d.slopePct.toFixed(2)} %</div>
              <div class="k">Elevation rise @ slope</div><div class="v">${d.elevationM.toFixed(2)} m</div>
            </div>`
          const area = `
            <h2>Catchment / Surface Area</h2>
            <div class="box kv">
              <div class="k">Feed pad surface area</div><div class="v">${d.catchmentArea.toLocaleString()} m²</div>
            </div>`
          openPdfViewBlob('Feed Pad Summary', herd + tech + area)
        }}>
          Save Calculations (PDF)
        </button>

        <button className="btn secondary" onClick={() => {
          persistLast()
          location.href = import.meta.env.BASE_URL
        }}>
          Save &amp; Return to Home
        </button>
      </section>
    </div>
  )
}
