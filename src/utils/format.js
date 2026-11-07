// Păstrează lipsa unei măsurători vizibilă, fără a o confunda cu valoarea zero.
export const display = (value, digits = 0) =>
  value == null || !Number.isFinite(value) ? '—' : value.toFixed(digits);
