import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLine, LineBuffer } from '../src/communication/protocol.js';
import { Processor } from '../src/processing/Processor.js';
import { demoLine } from '../src/simulation/simulator.js';
test('protocol: validare strictă și linii fragmentate', () => {
  assert.equal(parseLine('D,2,32000,28000\r').type, 'sample');
  for (const line of ['D,2,1x,3', 'D,-1,2,3', 'D,1,65536,1', '', 'D,1,2,3,4'])
    assert.equal(parseLine(line).type, 'invalid');
  assert.equal(parseLine('#ERR sensor').type, 'message');
  const lines = [];
  const buffer = new LineBuffer((x) => lines.push(x));
  buffer.push('D,1,32');
  buffer.push('000,28000\r\n#OK\n');
  assert.deepEqual(lines, ['D,1,32000,28000\r', '#OK']);
});
test('simulator: BPM estimat pentru 48, 72, 120 și 150 BPM', () => {
  for (const bpm of [48, 72, 120, 150]) {
    const p = new Processor();
    for (let n = 0; n < 3000; n++) p.add(parseLine(demoLine(n, bpm)), n * 10);
    assert.ok(Math.abs(p.bpm - bpm) < 3, `țintă ${bpm}, rezultat ${p.bpm}`);
    assert.ok(p.spo2 > 90 && p.spo2 <= 100);
    assert.ok(Math.abs(p.snapshot().rate - 100) < 1);
  }
});
test('pierderi, restart secvență și invalidarea măsurătorilor fără deget', () => {
  const p = new Processor();
  for (let n = 0; n < 1500; n++) p.add(parseLine(demoLine(n)), n * 10);
  assert.ok(p.bpm);
  p.add(parseLine(demoLine(1504)), 15040);
  assert.equal(p.lost, 4);
  p.add(parseLine(demoLine(1505, 72, 'absent')), 15050);
  assert.equal(p.bpm, null);
  assert.equal(p.spo2, null);
  assert.equal(p.status, 'Fără deget');
  p.add(parseLine(demoLine(0)), 16000);
  assert.equal(p.lost, 4);
  p.add(parseLine(demoLine(1, 72, 'saturated')), 16010);
  assert.equal(p.status, 'Senzor saturat');
});
