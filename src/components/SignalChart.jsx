import React from 'react';
import { PpgPlot } from './PpgPlot.jsx';
export function SignalChart({
  processorRef,
  historySeconds,
  setHistorySeconds,
  active,
  measurements,
}) {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FORMA DE UNDĂ</p>
          <h2>Semnal PPG</h2>
        </div>
        <div className="segmented" aria-label="Istoric grafic">
          {[5, 10, 20].map((s) => (
            <button
              key={s}
              className={historySeconds === s ? 'selected' : ''}
              onClick={() => setHistorySeconds(s)}
            >
              {s} s
            </button>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i />
          IR filtrat · amplitudine relativă
        </span>
        <span>
          <i className="beat-dot" />
          Bătaie detectată
        </span>
      </div>
      <div className="plot-wrap">
        <PpgPlot processorRef={processorRef} historySeconds={historySeconds} running={active} />
        {!measurements.count && (
          <div className="chart-empty">
            <span>∿</span>Semnalul tău începe aici
            <small>Conectează placa sau pornește simulatorul.</small>
          </div>
        )}
      </div>
      <div className="chart-footer">
        <span>DC eliminat → trece-jos → inversare → detecție vârfuri</span>
        <span className="mono">100 eșantioane/s nominal</span>
      </div>
    </section>
  );
}
