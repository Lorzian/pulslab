import React from 'react';

export function ProcessingControls({ settings, updateProcessingSetting }) {
  return (
    <section className="panel controls">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">REGLAJE LIVE</p>
          <h2>Procesare semnal</h2>
        </div>
        <span>⚙</span>
      </div>
      {[
        ['cutoff', 'Filtru trece-jos', 0.5, 10, 0.1, 'Hz'],
        ['threshold', 'Prag adaptiv', 0.1, 2, 0.05, '× amplitudine'],
        ['refractory', 'Perioadă refractară', 250, 800, 10, 'ms'],
        ['finger', 'Prag prezență deget', 500, 30000, 500, 'ADC'],
      ].map(([key, label, min, max, step, unit]) => (
        <label className="range-control" key={key}>
          <span>
            {label}
            <b>
              {settings[key]} <small>{unit}</small>
            </b>
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={settings[key]}
            onChange={(e) => updateProcessingSetting(key, e.target.value)}
          />
        </label>
      ))}
      <p className="control-help">
        Modificările se aplică imediat. Pragurile se ajustează ulterior pe senzorul real.
      </p>
    </section>
  );
}
