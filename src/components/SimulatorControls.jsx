import React from 'react';

export function SimulatorControls({ bpm, setDemoBpm, scenario, setDemoScenario }) {
  return (
    <section className="panel controls">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">BANC DE TEST</p>
          <h2>Simulator</h2>
        </div>
        <span className="tag">100 Hz</span>
      </div>
      <label className="range-control">
        <span>
          Puls generat<b>{bpm} BPM</b>
        </span>
        <input
          type="range"
          min="40"
          max="160"
          value={bpm}
          onChange={(e) => setDemoBpm(Number(e.target.value))}
        />
      </label>
      <label className="select-label">
        Scenariu de test
        <select value={scenario} onChange={(e) => setDemoScenario(e.target.value)}>
          <option value="normal">Semnal stabil</option>
          <option value="absent">Fără deget</option>
          <option value="motion">Mișcare / zgomot</option>
          <option value="saturated">Senzor saturat</option>
        </select>
      </label>
      <p className="control-help">
        Date sintetice în formatul serial al plăcii: <code>D,nr,ir,red</code>.
      </p>
    </section>
  );
}
