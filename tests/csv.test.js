import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeSessionCsv } from '../src/utils/csv.js';

test('export CSV: păstrează secvența, timpul, valorile brute și marcajul bătăii', () => {
  const csv = serializeSessionCsv([
    { sequence: 12, t: 120, ir: 32000, red: 28000, value: -12.34567, beat: true },
    { sequence: 13, t: 130, ir: 32001, red: 28001, value: 2, beat: false },
  ]);
  assert.equal(
    csv,
    [
      'sequence,time_ms,ir,red,ppg_filtered,beat',
      '12,120,32000,28000,-12.346,1',
      '13,130,32001,28001,2.000,0',
    ].join('\r\n'),
  );
  assert.equal(serializeSessionCsv([]), 'sequence,time_ms,ir,red,ppg_filtered,beat');
});
