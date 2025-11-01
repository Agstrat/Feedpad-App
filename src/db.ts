import Dexie, { Table } from 'dexie';

export type Defaults = {
  id?: string;                 // 'app'
  // “Home” / session values
  totalCows?: number;
  stockingRatePct?: number;
  feedLanes?: 2 | 4;
  cowType?: string;

  // Structure & allowances
  feedPadSlopePct?: number;
  feedWallThickness?: number;
  nibWallThickness?: number;
  feedWallPostSpacing?: number;
  feedWallPostSize?: string;
  cowLanePostSpacing?: number;
  cowLanePostSize?: string;
  turningCircle?: number;
  entranceAllowance?: number;

  endPostOffset?: number;
  stayPostOffset?: number;

  // NEW
  crossOverWidth?: number;
};

class AppDB extends Dexie {
  defaults!: Table<Defaults, string>;
  constructor() {
    super('feedpad-db');
    this.version(1).stores({
      defaults: 'id'
    });
  }
}

const db = new AppDB();

const DEFAULTS: Defaults = {
  id: 'app',
  totalCows: 500,
  stockingRatePct: 100,
  feedLanes: 2,
  cowType: 'HF 590 - 690kg',

  feedPadSlopePct: 1,
  feedWallThickness: 0.2,
  nibWallThickness: 0.15,
  feedWallPostSpacing: 3,
  feedWallPostSize: '65NB',
  cowLanePostSpacing: 2.5,
  cowLanePostSize: '50NB',
  turningCircle: 23,
  entranceAllowance: 10,
  endPostOffset: 0.15,
  stayPostOffset: 1,

  crossOverWidth: 0,
};

export async function loadDefaults(): Promise<Defaults> {
  const row = await db.defaults.get('app');
  if (!row) {
    await db.defaults.put(DEFAULTS);
    return { ...DEFAULTS };
  }
  return { ...DEFAULTS, ...row }; // merge to ensure new fields exist
}

export async function saveDefaults(d: Defaults): Promise<void> {
  await db.defaults.put({ ...DEFAULTS, ...d, id: 'app' });
}

export { db };
