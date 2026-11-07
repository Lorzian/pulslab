import { mean, standardDeviation } from './statistics.js';

// Processează eșantioane brute. Nu depinde de React, DOM sau Web Serial.
export class Processor {
  constructor() {
    this.settings = { cutoff: 4, threshold: 0.45, refractory: 350, finger: 5000 };
    this.points = [];
    this.window = [];
    this.intervals = [];
    this.beats = [];
    this.lost = 0;
    this.invalid = 0;
    this.count = 0;
    this.lastSequence = null;
    this.previous = 0;
    this.before = 0;
    this.envelope = 1;
    this.lastBeat = null;
    this.status = 'Așteptare date';
    this.bpm = null;
    this.spo2 = null;
    this.ibi = null;
  }
  clearVitals() {
    this.bpm = this.spo2 = this.ibi = null;
    this.intervals = [];
    this.lastBeat = null;
  }
  add(sample, arrivalTimeMs = performance.now()) {
    if (this.lastSequence !== null && sample.sequence <= this.lastSequence) {
      this.clearVitals();
      this.window = [];
      this.dcIR = this.dcRED = undefined;
      this.filtered = 0;
      this.previous = this.before = 0;
    } else if (this.lastSequence !== null)
      this.lost += Math.max(0, sample.sequence - this.lastSequence - 1);
    // Timpul de achiziție derivă din numărul de ordine la rata configurată de firmware (100 Hz).
    const sampleTimeMs = sample.sequence * 10;
    const deltaSeconds =
      this.lastSequence === null
        ? 0.01
        : Math.min(0.2, Math.max(0.01, (sample.sequence - this.lastSequence) / 100));
    this.lastSequence = sample.sequence;
    this.count++;
    this.arrivals ??= [];
    this.arrivals.push({ arrivalTimeMs, count: this.count });
    while (this.arrivals.length > 1 && arrivalTimeMs - this.arrivals[0].arrivalTimeMs > 5000)
      this.arrivals.shift();
    const present = sample.ir > this.settings.finger && sample.red > this.settings.finger;
    const saturated = sample.ir >= 65000 || sample.red >= 65000;
    // Urmărește lent componenta continuă și o scade din semnalul IR.
    this.dcIR ??= sample.ir;
    this.dcRED ??= sample.red;
    const dcAlpha = 1 - Math.exp(-deltaSeconds / 1.5);
    this.dcIR += dcAlpha * (sample.ir - this.dcIR);
    this.dcRED += dcAlpha * (sample.red - this.dcRED);
    // Inversează variația IR și aplică filtrul trece-jos de ordinul 1.
    const alpha = 1 - Math.exp(-2 * Math.PI * this.settings.cutoff * deltaSeconds);
    this.filtered = (this.filtered || 0) + alpha * (this.dcIR - sample.ir - (this.filtered || 0));
    const value = this.filtered;
    this.envelope += 0.02 * (Math.abs(value) - this.envelope);
    this.window.push({ ir: sample.ir, red: sample.red });
    if (this.window.length > 400) this.window.shift();
    const acIR = standardDeviation(this.window.map((samplePoint) => samplePoint.ir)),
      acRED = standardDeviation(this.window.map((samplePoint) => samplePoint.red));
    const unstable = acIR / Math.max(1, this.dcIR) > 0.04 || acIR < 20;
    const ready = present && !saturated && !unstable && this.window.length >= 200;
    this.status = !present
      ? 'Fără deget'
      : saturated
        ? 'Senzor saturat'
        : this.window.length < 200
          ? 'Stabilizare semnal'
          : unstable
            ? 'Semnal instabil'
            : 'Semnal stabil';
    // Un maxim local trebuie să depășească pragul și perioada refractară.
    let beat = false;
    if (
      ready &&
      this.previous > this.before &&
      this.previous >= value &&
      this.previous > this.envelope * this.settings.threshold &&
      (this.lastBeat === null || sampleTimeMs - 10 - this.lastBeat > this.settings.refractory)
    ) {
      const peakTime = sampleTimeMs - 10;
      if (this.lastBeat !== null) {
        const interval = peakTime - this.lastBeat;
        if (interval >= 300 && interval <= 2000) {
          this.intervals.push(interval);
          if (this.intervals.length > 20) this.intervals.shift();
          this.ibi = interval;
          const sorted = this.intervals
            .slice(-7)
            .sort((firstInterval, secondInterval) => firstInterval - secondInterval);
          this.bpm = 60000 / sorted[Math.floor(sorted.length / 2)];
        }
      }
      this.lastBeat = peakTime;
      beat = true;
      this.beats.push(peakTime);
    }
    if (!ready || (this.lastBeat !== null && sampleTimeMs - this.lastBeat > 2500))
      this.clearVitals();
    if (ready && this.bpm !== null) {
      // Aproximație didactică necalibrată; nu extrapolăm în afara 70–100%.
      const ratio = acRED / this.dcRED / (acIR / this.dcIR);
      const estimate = 110 - 25 * ratio;
      this.spo2 = estimate >= 70 && estimate <= 100 ? estimate : null;
    }
    this.before = this.previous;
    this.previous = value;
    this.points.push({ t: sampleTimeMs, value, beat, ...sample });
    if (this.points.length > 3000) this.points.shift();
    if (this.beats.length > 300) this.beats.shift();
    return this.points.at(-1);
  }
  snapshot() {
    const observations = this.arrivals || [],
      elapsed =
        observations.length > 1
          ? (observations.at(-1).arrivalTimeMs - observations[0].arrivalTimeMs) / 1000
          : 0;
    return {
      bpm: this.bpm,
      spo2: this.spo2,
      ibi: this.ibi,
      status: this.status,
      lost: this.lost,
      invalid: this.invalid,
      count: this.count,
      rate: elapsed > 0 ? (observations.at(-1).count - observations[0].count) / elapsed : 0,
      consistency:
        this.intervals.length > 2
          ? Math.max(0, 100 * (1 - standardDeviation(this.intervals) / mean(this.intervals)))
          : null,
      sdnn: this.intervals.length > 2 ? standardDeviation(this.intervals) : null,
      rmssd:
        this.intervals.length > 2
          ? Math.sqrt(
              mean(
                this.intervals
                  .slice(1)
                  .map((intervalMs, index) => (intervalMs - this.intervals[index]) ** 2),
              ),
            )
          : null,
    };
  }
}
