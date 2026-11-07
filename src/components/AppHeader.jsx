import React from 'react';

export function AppHeader({ theme, setTheme }) {
  return (
    <header>
      <a className="brand" href="#">
        <span className="brand-icon">∿</span>Puls<span>Lab</span>
        <small>LABORATOR DE SEMNAL</small>
      </a>
      <div className="header-actions">
        <span className="tag">MAX30100 / ARDUINO UNO</span>
        <button
          className="icon-button"
          aria-label="Schimbă tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}
