import React from 'react';

export function PageIntro({ active, sourceMode, isPaused }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">ACHIZIȚIE & ANALIZĂ ÎN TIMP REAL</p>
        <h1>Fiecare bătaie, un semnal.</h1>
        <p className="subtitle">Explorează pulsul. Înțelege semnalul.</p>
      </div>
      <div className={'connection ' + (active ? 'online' : '')}>
        <i />
        {sourceMode === 'demo'
          ? 'Simulator activ'
          : sourceMode === 'usb'
            ? 'Arduino conectat'
            : 'Neconectat'}
        <small>
          {active
            ? '100 Hz nominal · ' + (isPaused ? 'pauză' : 'transmisie activă')
            : 'Alege USB sau modul demo'}
        </small>
      </div>
    </div>
  );
}
