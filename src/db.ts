// src/db.ts
// Simple localStorage-backed defaults store used across the app.

export type Defaults = {
  // Calculation/usage-oriented fields
  totalCows?: number;
  stockingRatePct?: number;   // %
  feedLanes?: 2 | 4;
  cowType?: string;

  // Geom & spec (existing)
  feedPadSlopePct: number;    // D17
  feedWallThickness: number;  // D3
  nibWallThickness: number;   // D4
  feedWallPostSpacing: number;// D7
  feedWallPostSize?: string;  // D8 (e.g., '80NB','65NB','50NB','40NB')
  cowLanePostSpacing: number; // D9
  cowLanePostSize?: string;   // D10
  turningCircle: number;      // D13
  entranceAllowance: number;  // D14
  crossOverWidth: number;     // D12
  endPostOffset: number;      // D15
  stayPostOffset: number;     // D16

  // NEW defaults (no inputs on Calculator page; read-only there)
  feedLaneWidth: number;      // D1
  tractorLaneWidth: number;   // D2
  feedAboveCow: number;       // extra (height diff m)

  // Optional future fields can be appended without breaking
};

// Sensible baseline defaults (match your screenshots + requests)
const DEFAULTS_BASE: Defaults = {
  // frequently edited on Calculator page but persisted here:
  totalCows: 0,
  stockingRatePct: 100,
  feedLanes: 2,
  cowType: 'HF 590 - 690kg',

  // defaults page values from your snapshot
  feedPadSlopePct: 1,
  feedWallThickness: 0.2,
  nibWallThickness: 0.15,
  feedWallPostSpacing: 3,
  feedWallPostSize: '65NB',
  cowLanePostSpacing: 2.5,
  cowLanePostSize: '50NB',
  turningCircle: 20,
  entranceAllowance: 10,
  crossOverWidth: 0,
  endPostOffset: 0.15,
  stayPostOffset: 1,

  // NEW
  feedLaneWidth: 4.7,
  tractorLaneWidth: 6.0,
  feedAboveCow: 0.150,
};

const KEY = 'feedpad-defaults:v1';

export async function loadDefaults(): Promise<Defaults> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS_BASE };
    const parsed = JSON.parse(raw) as Partial<Defaults>;
    // merge & coerce some types
    const merged: Defaults = {
      ...DEFAULTS_BASE,
      ...parsed,
    };
    return merged;
  } catch {
    return { ...DEFAULTS_BASE };
  }
}

export async function saveDefaults(next: Defaults): Promise<void> {
  const toSave: Defaults = {
    ...DEFAULTS_BASE,
    ...next,
  };
  localStorage.setItem(KEY, JSON.stringify(toSave));
}

// handy wipe for debugging
export async function resetDefaults(): Promise<void> {
  localStorage.removeItem(KEY);
}
