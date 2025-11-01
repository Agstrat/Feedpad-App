import Dexie, { Table } from 'dexie';

export interface Settings {
  id: number;               // always 1 (single row)
  totalCows: number;
  stockingPct: number;
  feedLanes: number;
  feedLaneWidth: number;
  tractorLaneWidth: number;
  cowLaneWidth: number;
  entranceLen: number;
  turnLen: number;
  feedLanesLen: number;
  slopePct: number;
}

export interface Summary {
  id?: number;
  timestamp: string;
  projectName?: string;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string>;
  notes?: string;
}

class FPDB extends Dexie {
  settings!: Table<Settings, number>;
  summaries!: Table<Summary, number>;
  constructor() {
    super('feedpad-db');
    this.version(1).stores({
      settings: 'id',
      summaries: '++id, timestamp'
    });
  }
}
export const db = new FPDB();

// helpers
export async function loadSettings(): Promise<Settings> {
  const cur = await db.settings.get(1);
  if (cur) return cur;
  const seed: Settings = {
    id: 1,
    totalCows: 100,
    stockingPct: 100,
    feedLanes: 2,
    feedLaneWidth: 4.7,
    tractorLaneWidth: 5.6,
    cowLaneWidth: 4.7,
    entranceLen: 10,
    turnLen: 23,
    feedLanesLen: 38.3,
    slopePct: 1
  };
  await db.settings.put(seed);
  return seed;
}

export async function saveSettings(s: Partial<Settings>) {
  const cur = await loadSettings();
  await db.settings.put({ ...cur, ...s, id: 1 });
}
