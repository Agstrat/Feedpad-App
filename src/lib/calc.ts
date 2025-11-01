// src/lib/calc.ts
import type { Defaults } from '../db';

export type Derived = {
  cowsCanEatAtOnce: number;  // rounded whole cows
  cowsPerLane: number;
  bunkLenPerLane: number;    // m
  totalBunkLenAllLanes: number; // m
};

export function deriveFromDefaults(d: Defaults): Derived {
  const cowsCanEatAtOnce = Math.max(
    0,
    Math.round((d.totalCows * d.stockingRatePct) / 100)
  );

  const lanes = d.feedLanes || 1;
  const cowsPerLane = cowsCanEatAtOnce / lanes;
  const bunkLenPerLane = cowsPerLane * d.bunkPerCow;
  const totalBunkLenAllLanes = bunkLenPerLane * lanes;

  return {
    cowsCanEatAtOnce,
    cowsPerLane,
    bunkLenPerLane,
    totalBunkLenAllLanes,
  };
}
