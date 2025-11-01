// src/db.ts
import Dexie, { Table } from 'dexie';

export type Defaults = {
  id: 'current';
  totalCows: number;          // e.g. 100
  stockingRatePct: number;    // 0–100
  feedLanes: 1 | 2;           // lanes
  bunkPerCow: number;         // m/cow (e.g. 0.67)
  cowType: string;            // label only

  // Geometry / allowances
  feedPadSlopePct: number;    // %
  feedWallThickness: number;  // m
  nibWallThickness: number;   // m
  feedWallPostSpacing: number;// m
  feedWallPostSize: string;   // e.g. "65NB"
  cowLanePostSpacing: number; // m
  cowLanePostSize: string;    // e.g. "50NB"
  turningCircle: number;      // m
  entranceAllowance: number;  // m
  endPostOffset: number;      // m
  stayPostOffset: number;     // m

  // “Grey” baseline values (seeded defaults; may be recomputed downstream)
  feedLaneWidth: number;      // m (grey)
  tractorLaneWidth: number;   // m (grey)
};

class FPDB extends Dexie {
  defaults!: Table<Defaults, string>;
  constructor() {
    super('FeedPadDB');
    this.version(1).stores({
      defaults: 'id',
    });
  }
}
export const db = new FPDB();

export const DEFAULT_DEFAULTS: Defaults = {
  id: 'current',
  totalCows: 100,
  stockingRatePct: 100,
  feedLanes: 2,
  bunkPerCow: 0.67,
  cowType: 'HF 590 - 690kg',

  feedPadSlopePct: 1,
  feedWallThickness: 0.20,
  nibWallThickness: 0.15,
  feedWallPostSpacing: 3,
  feedWallPostSize: '65NB',
  cowLanePostSpacing: 2.5,
  cowLanePostSize: '50NB',
  turningCircle: 23,
  entranceAllowance: 10,
  endPostOffset: 0.15,
  stayPostOffset: 1,

  // seed example values as per your screenshot
  feedLaneWidth: 4.7,
  tractorLaneWidth: 5.6,
};

export async function loadDefaults(): Promise<Defaults> {
  const row = await db.defaults.get('current');
  if (row) return row;
  await db.defaults.put(DEFAULT_DEFAULTS);
  return DEFAULT_DEFAULTS;
}

export async function saveDefaults(next: Partial<Defaults>) {
  const cur = await loadDefaults();
  const merged = { ...cur, ...next, id: 'current' as const };
  await db.defaults.put(merged);
  return merged;
}
