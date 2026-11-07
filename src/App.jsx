import React, { useState } from 'react';
import { useAcquisition } from './hooks/useAcquisition.js';
import { useTheme } from './hooks/useTheme.js';
import { AppHeader } from './components/AppHeader.jsx';
import { PageIntro } from './components/PageIntro.jsx';
import { ConnectionToolbar } from './components/ConnectionToolbar.jsx';
import { VitalMetrics } from './components/VitalMetrics.jsx';
import { SignalChart } from './components/SignalChart.jsx';
import { SignalDiagnostics } from './components/SignalDiagnostics.jsx';
import { DeviceLog } from './components/DeviceLog.jsx';
import { ProcessingControls } from './components/ProcessingControls.jsx';
import { SimulatorControls } from './components/SimulatorControls.jsx';
import { SensorControls } from './components/SensorControls.jsx';
import { AppFooter } from './components/AppFooter.jsx';
export function App() {
  const acquisition = useAcquisition();
  const [theme, setTheme] = useTheme();
  const [historySeconds, setHistorySeconds] = useState(10);
  const {
    processorRef,
    measurements,
    sourceMode,
    isPaused,
    settings,
    logs,
    bpm,
    scenario,
    ledIndex,
    error,
    isConnecting,
    setDemoBpm,
    setDemoScenario,
    setLedIndex,
    setLogs,
    disconnectSource,
    startDemo,
    connect,
    sendCommand,
    togglePause,
    updateProcessingSetting,
    exportSessionCsv,
    canExport,
  } = acquisition;
  const active = sourceMode !== 'idle';
  const serialSupported = 'serial' in navigator;
  return (
    <div className="app-shell">
      <AppHeader theme={theme} setTheme={setTheme} />
      <main>
        <PageIntro active={active} sourceMode={sourceMode} isPaused={isPaused} />
        <ConnectionToolbar
          active={active}
          isPaused={isPaused}
          togglePause={togglePause}
          disconnectSource={disconnectSource}
          isConnecting={isConnecting}
          connect={connect}
          startDemo={startDemo}
          canExport={canExport}
          exportSessionCsv={exportSessionCsv}
          serialSupported={serialSupported}
        />
        {!serialSupported && (
          <p className="notice">
            USB necesită Chrome sau Edge pe desktop, pe localhost. Modul demo funcționează în acest
            browser.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <VitalMetrics measurements={measurements} active={active} isPaused={isPaused} />
        <div className="workspace">
          <div className="main-column">
            <SignalChart
              processorRef={processorRef}
              historySeconds={historySeconds}
              setHistorySeconds={setHistorySeconds}
              active={active}
              measurements={measurements}
            />
            <SignalDiagnostics measurements={measurements} />
            <DeviceLog logs={logs} onClear={() => setLogs([])} />
          </div>
          <aside>
            <ProcessingControls
              settings={settings}
              updateProcessingSetting={updateProcessingSetting}
            />
            <SimulatorControls
              bpm={bpm}
              setDemoBpm={setDemoBpm}
              scenario={scenario}
              setDemoScenario={setDemoScenario}
            />
            <SensorControls
              ledIndex={ledIndex}
              setLedIndex={setLedIndex}
              active={active}
              sendCommand={sendCommand}
            />
          </aside>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}
