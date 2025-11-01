import { Link } from 'react-router-dom';

export default function Start() {
  return (
    <div className="card out">
      <h1 className="v">FeedPad</h1>
      <p>Set defaults once. Calculate anywhere. Works offline when installed.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <Link to="/defaults" className="btn">Update Defaults</Link>
        <Link to="/calculator" className="btn">Start Calculations</Link>
      </div>
    </div>
  );
}
