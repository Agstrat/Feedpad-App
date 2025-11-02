import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function openPdfViewBlob(title: string, html: string) {
  const blob = new Blob(
    [`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
      body{font-family:-apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial;margin:28px;color:#111}
      h1{font-size:22px;margin:0 0 16px} h2{font-size:16px;margin:18px 0 8px}
      .box{border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin:10px 0}
      .kv{display:grid;grid-template-columns:1fr auto;gap:8px 14px}
      .k{color:#6b7280}.v{font-weight:700} .mono{font-family: ui-monospace, Menlo, Consolas, monospace}
      button{margin-top:14px;padding:10px 14px;border-radius:10px;border:1px solid #e5e7eb;background:#fff}
      @media print{button{display:none}}
      </style></head><body>${html}<button onclick="print()">Print</button></body></html>`],
    { type: 'text/html' }
  )
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
}

export default function ExportPage() {
  const nav = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('feedpad-last-calc')
    if (!raw) {
      alert('No saved calculation found. Run a calculation first.')
      nav('/calculator', { replace: true })
      return
    }
    const { inputs, defaults, cowClass, outputs } = JSON.parse(raw)

    const herd = `
      <h1>Feed Pad Summary</h1>
      <h2>Herd &amp; Feed Pad Details</h2>
      <div class="box kv">
        <div class="k">Total cows in the herd</div><div class="v">${inputs.totalCows.toLocaleString()} cows</div>
        <div class="k">Cow breed &amp; weight range</div><div class="v">${cowClass.label}</div>
        <div class="k">Feed bunk face allowance</div><div class="v">${cowClass.bunkM.toFixed(2)} m/cow</div>
        <div class="k">% of cows that can eat at once</div><div class="v">${inputs.percentEating}%</div>
        <div class="k">Total cows that can eat at any one time</div><div class="v">${outputs.cowsThatCanEat.toLocaleString()} cows</div>
        <div class="k">Cow lanes</div><div class="v">${inputs.lanes}</div>
        <div class="k">Cows per lane</div><div class="v">${outputs.cowsPerLane.toLocaleString()} cows</div>
        <div class="k">Feed lane length (includes crossover)</div><div class="v">${outputs.feedLaneLenIncXover.toFixed(2)} m</div>
        <div class="k">Center crossover allowance</div><div class="v">${defaults.xover.toFixed(2)} m</div>
        <div class="k">Overall length of feed pad (incl. entrance, turning &amp; crossover)</div><div class="v">${outputs.overallLen.toFixed(2)} m</div>
        <div class="k">Overall feed pad width</div><div class="v">${outputs.width.toFixed(2)} m</div>
      </div>`
    const tech = `
      <h2>Feed Pad Technical Specifications</h2>
      <div class="box kv mono">
        <div class="k">Cow lane width (D1)</div><div class="v">${defaults.d1.toFixed(2)} m</div>
        <div class="k">Tractor lane width (D2)</div><div class="v">${defaults.d2.toFixed(2)} m</div>
        <div class="k">Feed wall thickness (D3)</div><div class="v">${defaults.d3.toFixed(2)} m</div>
        <div class="k">Nib wall thickness (D4)</div><div class="v">${defaults.d4.toFixed(2)} m</div>
        <div class="k">Feed above cow lane</div><div class="v">${defaults.feedAbove.toFixed(3)} m</div>
        <div class="k">Feed wall post spacing</div><div class="v">${defaults.postSp} m</div>
        <div class="k">Entrance allowance (D14)</div><div class="v">${inputs.entranceM} m</div>
        <div class="k">Turning circle allowance (D13)</div><div class="v">${inputs.turningCircleM} m</div>
        <div class="k">Feed pad slope</div><div class="v">${outputs.slopePct.toFixed(2)} %</div>
        <div class="k">Elevation rise @ slope</div><div class="v">${outputs.elevationM.toFixed(2)} m</div>
      </div>`
    const area = `
      <h2>Catchment / Surface Area</h2>
      <div class="box kv">
        <div class="k">Feed pad surface area</div><div class="v">${outputs.catchmentArea.toLocaleString()} m²</div>
      </div>`

    openPdfViewBlob('Feed Pad Summary', herd + tech + area)
    // optional: return to home after opening
    nav('/', { replace: true })
  }, [nav])

  return <div className="calc-wrap"><div className="card"><h2 className="v">Preparing PDF…</h2></div></div>
}
