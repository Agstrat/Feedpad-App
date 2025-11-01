import { Link } from 'react-router-dom';

export default function Start() {
  return (
    <div className="wrap">
      <div className="bg"></div>
      <div className="card">
        <h1>FeedPad</h1>
        <p className="muted">Set defaults once. Calculate anywhere. Works offline when installed.</p>
        <div className="row">
          <Link className="btn" to="/defaults">Default Settings</Link>
          <Link className="btn" to="/calculator">Start Calculations</Link>
        </div>
      </div>
    </div>
  );
}
