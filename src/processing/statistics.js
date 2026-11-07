// Statisticile folosesc aceleași operații pentru păstrarea rezultatelor numerice.
export function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
}

export function standardDeviation(values) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}
