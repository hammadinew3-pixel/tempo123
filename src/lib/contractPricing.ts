// Utility functions for contract pricing and vehicle change computations
// Keep logic robust and reusable across the app

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeDateStr(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function daysBetweenInclusive(start: string, end: string): number {
  const s = normalizeDateStr(start);
  const e = normalizeDateStr(end);
  return Math.ceil((e.getTime() - s.getTime()) / DAY_MS);
}

export function computeChangeAmounts(params: {
  start: string;
  end: string;
  change: string;
  oldRate: number;
  newRate: number;
}) {
  const startDate = normalizeDateStr(params.start);
  const endDate = normalizeDateStr(params.end);
  const changeDate = normalizeDateStr(params.change);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS);
  const daysOld = Math.floor((changeDate.getTime() - startDate.getTime()) / DAY_MS) + 1; // include change day for old vehicle
  const daysNew = totalDays - daysOld;

  const amountOld = Math.max(0, daysOld) * (params.oldRate || 0);
  const amountNew = Math.max(0, daysNew) * (params.newRate || params.oldRate || 0);
  const total = amountOld + amountNew;

  return { totalDays, daysOld, daysNew, amountOld, amountNew, total };
}

export function safeRemaining(total: number, advance: number | null | undefined) {
  const adv = Number(advance || 0);
  return Math.max(0, total - adv);
}

export function resolveRates(contract: any, selectedVehicle: any) {
  // Récupérer le tarif de l'ancien véhicule de manière explicite
  let oldRate = 0;
  if (contract?.daily_rate && Number(contract.daily_rate) > 0) {
    oldRate = Number(contract.daily_rate);
  } else if (contract?.vehicles?.tarif_journalier && Number(contract.vehicles.tarif_journalier) > 0) {
    oldRate = Number(contract.vehicles.tarif_journalier);
  }

  // Récupérer le tarif du nouveau véhicule
  const newRateCandidate = Number(selectedVehicle?.tarif_journalier) || 0;
  const newRate = newRateCandidate > 0 ? newRateCandidate : oldRate;
  
  return { oldRate, newRate };
}
