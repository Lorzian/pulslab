import { useEffect, useRef, useState } from 'react';
import { Processor } from '../processing/Processor.js';
import { parseLine } from '../communication/protocol.js';
import { demoLine } from '../simulation/simulator.js';
import { SerialConnection } from '../communication/serial.js';
import { downloadSessionCsv } from '../utils/csv.js';

// Coordonează sursa și sesiunea. Algoritmul de semnal rămâne în Processor.
export function useAcquisition() {
  // Datele rapide stau în referințe; interfața este actualizată separat la 5 Hz.
  const processorRef = useRef(new Processor()),
    sessionPointsRef = useRef([]),
    serialConnectionRef = useRef(null),
    demoTimerRef = useRef(null);
  const [measurements, setMeasurements] = useState(processorRef.current.snapshot()),
    [sourceMode, setSourceMode] = useState('idle'),
    [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState({ ...processorRef.current.settings });
  const [logs, setLogs] = useState([
    {
      text: 'Laborator pregătit. Alege o sursă de date.',
      time: new Date().toLocaleTimeString('ro-RO'),
    },
  ]);
  const [bpm, setDemoBpm] = useState(72),
    [scenario, setDemoScenario] = useState('normal'),
    [ledIndex, setLedIndex] = useState(7),
    [error, setError] = useState(''),
    [isConnecting, setIsConnecting] = useState(false);
  const demoConfigRef = useRef({ bpm, scenario, isPaused });
  demoConfigRef.current = { bpm, scenario, isPaused };
  const lastSampleArrivalRef = useRef(0);
  function appendLog(text) {
    setLogs((old) =>
      [{ text, time: new Date().toLocaleTimeString('ro-RO') }, ...old].slice(0, 100),
    );
  }
  function receiveLine(line) {
    const parsed = parseLine(line);
    if (parsed.type === 'message') return appendLog(parsed.text);
    if (parsed.type === 'invalid') {
      processorRef.current.invalid++;
      return;
    }
    lastSampleArrivalRef.current = performance.now();
    const point = processorRef.current.add(parsed);
    if (sessionPointsRef.current.length < 180000) sessionPointsRef.current.push(point);
  }
  // Limitează rerandările, fără a reduce rata de procesare a eșantioanelor.
  useEffect(() => {
    const timer = setInterval(() => {
      const snapshot = processorRef.current.snapshot();
      if (lastSampleArrivalRef.current && performance.now() - lastSampleArrivalRef.current > 2500) {
        processorRef.current.clearVitals();
        snapshot.bpm = snapshot.spo2 = snapshot.ibi = null;
        snapshot.rate = 0;
        snapshot.status = 'Flux de date oprit';
      }
      setMeasurements(snapshot);
    }, 200);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () => () => {
      clearInterval(demoTimerRef.current);
      serialConnectionRef.current?.close();
    },
    [],
  );
  function resetSession() {
    processorRef.current = new Processor();
    processorRef.current.settings = { ...settings };
    sessionPointsRef.current = [];
    lastSampleArrivalRef.current = 0;
    setMeasurements(processorRef.current.snapshot());
    setIsPaused(false);
  }
  async function disconnectSource() {
    clearInterval(demoTimerRef.current);
    demoTimerRef.current = null;
    if (serialConnectionRef.current) {
      const connection = serialConnectionRef.current;
      serialConnectionRef.current = null;
      await connection.close();
    }
    setSourceMode('idle');
    setIsPaused(false);
    processorRef.current.clearVitals();
    appendLog('Sursă deconectată.');
  }
  function startDemo() {
    resetSession();
    setSourceMode('demo');
    setError('');
    appendLog('#DEMO Simulator 100 Hz pornit.');
    let sequence = 0,
      nextSampleAt = performance.now();
    // Recuperează în loturi întârzierile mici ale timerului din browser.
    demoTimerRef.current = setInterval(() => {
      const now = performance.now();
      if (demoConfigRef.current.isPaused) {
        nextSampleAt = now;
        return;
      }
      let batchCount = 0;
      while (nextSampleAt <= now && batchCount++ < 100) {
        receiveLine(
          demoLine(sequence++, demoConfigRef.current.bpm, demoConfigRef.current.scenario),
        );
        nextSampleAt += 10;
      }
    }, 20);
  }
  async function connect() {
    setIsConnecting(true);
    setError('');
    try {
      resetSession();
      const connection = new SerialConnection(receiveLine, () => {
        serialConnectionRef.current = null;
        setSourceMode('idle');
        processorRef.current.clearVitals();
        appendLog('Conexiunea USB s-a închis.');
      });
      await connection.connect();
      serialConnectionRef.current = connection;
      setSourceMode('usb');
      appendLog('USB conectat · 115200 baud.');
    } catch (error) {
      if (error.name !== 'NotFoundError') setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }
  async function sendCommand(text) {
    try {
      if (sourceMode === 'usb') await serialConnectionRef.current.send(text);
      appendLog(`→ ${text}${sourceMode === 'demo' ? ' (demo)' : ''}`);
    } catch (error) {
      setError(error.message);
    }
  }
  async function togglePause() {
    await sendCommand(isPaused ? 'S' : 'P');
    setIsPaused(!isPaused);
  }
  function updateProcessingSetting(key, value) {
    const updated = { ...settings, [key]: Number(value) };
    setSettings(updated);
    processorRef.current.settings = updated;
  }
  function exportSessionCsv() {
    downloadSessionCsv(sessionPointsRef.current);
  }

  return {
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
    canExport: sessionPointsRef.current.length > 0,
  };
}
