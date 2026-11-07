import React from 'react';

export function SensorControls({ ledIndex, setLedIndex, active, sendCommand }) {
  return (
    <section className="panel controls">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">COMENZI USB</p>
          <h2>Control senzor</h2>
        </div>
      </div>
      <label className="range-control">
        <span>
          Index curent LED IR + RED<b>{ledIndex} / 15</b>
        </span>
        <input
          type="range"
          min="0"
          max="15"
          value={ledIndex}
          onChange={(e) => setLedIndex(Number(e.target.value))}
        />
      </label>
      <div className="command-buttons">
        <button disabled={!active} onClick={() => sendCommand(`L${ledIndex},${ledIndex}`)}>
          Aplică LED
        </button>
        <button disabled={!active} onClick={() => sendCommand('?')}>
          Configurație ?
        </button>
      </div>
      <p className="control-help">În demo, comenzile sunt doar jurnalizate.</p>
    </section>
  );
}
