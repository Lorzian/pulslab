export function demoLine(sequence, bpm = 72, scenario = 'normal') {
  const t = sequence / 100;
  const pulse = Math.sin(2 * Math.PI * bpm / 60 * t) + 0.22 * Math.sin(4 * Math.PI * bpm / 60 * t - 0.6);
  const noise = scenario === 'motion' ? 1100 * Math.sin(t * 17) + 900 * Math.sin(t * 31) : 12 * Math.sin(t * 43);
  const ir = scenario === 'absent' ? 400 : scenario === 'saturated' ? 65535 : Math.round(32000 - 700 * pulse + noise);
  const red = scenario === 'absent' ? 300 : scenario === 'saturated' ? 65535 : Math.round(28000 - 320 * pulse + noise * 0.8);
  return `D,${sequence},${ir},${red}\n`;
}
