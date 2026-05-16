export function parseClock(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  return h * 60 + m;
}

export function elapsedMins(from: string, to: string): number {
  return Math.max(0, parseClock(to) - parseClock(from));
}

export function fmtElapsed(from: string, to: string): string {
  const mins = elapsedMins(from, to);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
