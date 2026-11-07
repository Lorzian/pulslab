import { LineBuffer } from './protocol.js';
export class SerialConnection {
  constructor(onLine, onClose) { this.onLine = onLine; this.onClose = onClose; }
  async connect() {
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: 115200 });
    this.task = this.read();
  }
  async read() {
    const decoder = new TextDecoder(); const lines = new LineBuffer(this.onLine);
    try {
      this.reader = this.port.readable.getReader();
      while (true) { const { value, done } = await this.reader.read(); if (done) break; lines.push(decoder.decode(value, { stream: true })); }
    } catch (error) { this.onLine(`#ERR ${error.message}`); }
    finally { this.reader?.releaseLock(); this.reader = null; try { await this.port.close(); } catch {} this.onClose(); }
  }
  async send(command) {
    if (!this.port?.writable) throw new Error('Portul nu este conectat.');
    const writer = this.port.writable.getWriter();
    try { await writer.write(new TextEncoder().encode(command + '\n')); } finally { writer.releaseLock(); }
  }
  async close() { if (this.reader) await this.reader.cancel(); await this.task; }
}
