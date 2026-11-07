import React from 'react';
import { display } from '../utils/format.js';
export function VitalMetrics({ measurements, active, isPaused }) {
  return (
    <div className="metrics">
      <article className="metric">
        <div className="metric-label">
          PULS <span className="heart">♡</span>
        </div>
        <div className="metric-value">
          {display(measurements.bpm)}
          <small>BPM</small>
        </div>
        <p>
          Interval între bătăi <b>{display(measurements.ibi)} ms</b>
        </p>
      </article>
      <article className="metric">
        <div className="metric-label">
          SATURAȚIE ESTIMATĂ <span>◉</span>
        </div>
        <div className="metric-value oxygen">
          {display(measurements.spo2, 1)}
          <small>% SpO₂</small>
        </div>
        <p>Raport AC/DC · estimare necalibrată</p>
      </article>
      <article className="metric signal">
        <div className="metric-label">
          CALITATEA SEMNALULUI <span>▥</span>
        </div>
        <div className="signal-status">
          <i
            className={measurements.status === 'Semnal stabil' && active && !isPaused ? 'good' : ''}
          />
          {!active ? 'Așteptare conexiune' : isPaused ? 'Achiziție în pauză' : measurements.status}
        </div>
        <div className="signal-bars">
          {Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              style={{
                height: 12 + (i % 5) * 5,
                opacity: measurements.status === 'Semnal stabil' && active ? 1 : 0.2,
              }}
            />
          ))}
        </div>
        <p>Ține degetul nemișcat pe senzor.</p>
      </article>
    </div>
  );
}
