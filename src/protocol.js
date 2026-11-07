// Parser comun pentru USB și simulator. Nu acceptă numere parțiale sau valori ADC imposibile.
export function parseLine(line) {
  const text = line.trim();
  if (text.startsWith('#')) return { type: 'message', text };
  if (!/^D,\d+,\d+,\d+$/.test(text)) return { type: 'invalid' };
  const [, sequence, ir, red] = text.split(',').map(Number);
  if (![sequence, ir, red].every(Number.isSafeInteger) || ir > 65535 || red > 65535)
    return { type: 'invalid' };
  return { type: 'sample', sequence, ir, red };
}
export class LineBuffer {
  constructor(onLine) {
    this.pending = '';
    this.onLine = onLine;
  }
  push(chunk) {
    this.pending += chunk;
    let index;
    while ((index = this.pending.indexOf('\n')) !== -1) {
      this.onLine(this.pending.slice(0, index));
      this.pending = this.pending.slice(index + 1);
    }
    if (this.pending.length > 4096) {
      this.onLine('INVALID_OVERLONG_LINE');
      this.pending = '';
    }
  }
}
