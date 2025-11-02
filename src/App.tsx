// src/App.tsx — sanity page so you see something immediately
export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>FeedPad — Online</h1>
      <p>BASE_URL: {import.meta.env.BASE_URL}</p>
      <p>If you can read this on iPhone/iPad/PC, routing and assets are good.</p>
    </div>
  )
}
