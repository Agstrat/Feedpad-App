// src/App.tsx — minimal sanity UI
export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>FeedPad — Online</h1>
      <p>BASE_URL: {import.meta.env.BASE_URL}</p>
      <p>If you can see this on iPhone/iPad/PC, the build and routing are good.</p>
    </div>
  )
}
