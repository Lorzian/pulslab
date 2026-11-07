import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Processor } from './processor.js';
import { parseLine } from './protocol.js';
import { demoLine } from './simulator.js';
import { SerialConnection } from './serial.js';
import './styles.css';

function Plot({ engine, seconds, running }) {
  const canvas = useRef(null);
  useEffect(() => {
    let frame;
    const draw = () => {
      const el = canvas.current, rect = el.getBoundingClientRect(), dpr = devicePixelRatio || 1;
      if (el.width !== Math.round(rect.width*dpr) || el.height !== Math.round(rect.height*dpr)) { el.width = rect.width*dpr; el.height = rect.height*dpr; }
      const ctx = el.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
      const w = rect.width, h = rect.height, pad = 24;
      ctx.clearRect(0,0,w,h); ctx.lineWidth = 1; ctx.strokeStyle = '#708d891f';
      for (let i=0;i<=10;i++) { ctx.beginPath(); ctx.moveTo(pad+i*(w-2*pad)/10,pad);ctx.lineTo(pad+i*(w-2*pad)/10,h-pad);ctx.stroke(); }
      for (let i=0;i<=4;i++) { ctx.beginPath();ctx.moveTo(pad,pad+i*(h-2*pad)/4);ctx.lineTo(w-pad,pad+i*(h-2*pad)/4);ctx.stroke(); }
      const all=engine.current.points, end=all.at(-1)?.t || seconds*1000;
      const points=all.filter(p=>p.t>=end-seconds*1000);
      const scale=Math.max(100,...points.map(p=>Math.abs(p.value)))*1.25;
      const x=p=>pad+(p.t-end+seconds*1000)/(seconds*1000)*(w-2*pad), y=p=>h/2-p.value/scale*(h/2-pad);
      ctx.strokeStyle='#2bbca4';ctx.lineWidth=2;ctx.beginPath();
      points.forEach((p,i)=>i?ctx.lineTo(x(p),y(p)):ctx.moveTo(x(p),y(p)));ctx.stroke();
      points.filter(p=>p.beat).forEach(p=>{ctx.fillStyle='#e5aa67';ctx.beginPath();ctx.arc(x(p),y(p),4,0,2*Math.PI);ctx.fill();});
      ctx.fillStyle='#839994';ctx.font='11px monospace';ctx.fillText(`−${seconds} s`,pad,h-5);ctx.fillText('acum',w-pad-28,h-5);
      frame=requestAnimationFrame(draw);
    };
    draw(); return ()=>cancelAnimationFrame(frame);
  }, [engine, seconds, running]);
  return <canvas ref={canvas} aria-label="Grafic în timp real al semnalului PPG filtrat și bătăilor detectate" role="img"/>;
}
const display = (x, digits=0) => x == null || !Number.isFinite(x) ? '—' : x.toFixed(digits);

function App() {
  const engine = useRef(new Processor()), session = useRef([]), serial = useRef(null), demo = useRef(null);
  const [stats,setStats]=useState(engine.current.snapshot()), [mode,setMode]=useState('idle'), [paused,setPaused]=useState(false);
  const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('pulslab-theme') || 'dark';}catch{return 'dark';}});
  const [seconds,setSeconds]=useState(10), [settings,setSettings]=useState({...engine.current.settings});
  const [logs,setLogs]=useState([{text:'Laborator pregătit. Alege o sursă de date.',time:new Date().toLocaleTimeString('ro-RO')}]);
  const [bpm,setBpm]=useState(72), [scenario,setScenario]=useState('normal'), [led,setLed]=useState(7), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const config=useRef({bpm,scenario,paused}); config.current={bpm,scenario,paused};
  const lastData=useRef(0);
  function log(text) { setLogs(old=>[{text,time:new Date().toLocaleTimeString('ro-RO')},...old].slice(0,100)); }
  function receive(line) {
    const parsed=parseLine(line);
    if(parsed.type==='message') return log(parsed.text);
    if(parsed.type==='invalid') {engine.current.invalid++;return;}
    lastData.current=performance.now();
    const point=engine.current.add(parsed);
    if(session.current.length<180000) session.current.push(point);
  }
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('pulslab-theme',theme);}catch{}},[theme]);
  useEffect(()=>{const timer=setInterval(()=>{
    const snapshot=engine.current.snapshot();
    if(lastData.current && performance.now()-lastData.current>2500) {engine.current.clearVitals();snapshot.bpm=snapshot.spo2=snapshot.ibi=null;snapshot.rate=0;snapshot.status='Flux de date oprit';}
    setStats(snapshot);
  },200);return()=>clearInterval(timer);},[]);
  useEffect(()=>()=>{clearInterval(demo.current);serial.current?.close();},[]);
  function reset() {engine.current=new Processor();engine.current.settings={...settings};session.current=[];lastData.current=0;setStats(engine.current.snapshot());setPaused(false);}
  async function stop() {
    clearInterval(demo.current);demo.current=null;
    if(serial.current) {const connection=serial.current;serial.current=null;await connection.close();}
    setMode('idle');setPaused(false);engine.current.clearVitals();log('Sursă deconectată.');
  }
  function startDemo() {
    reset();setMode('demo');setError('');log('#DEMO Simulator 100 Hz pornit.');
    let n=0, next=performance.now();
    demo.current=setInterval(()=>{
      const now=performance.now();
      if(config.current.paused) {next=now;return;}
      let batch=0;
      while(next<=now && batch++<100) {receive(demoLine(n++,config.current.bpm,config.current.scenario));next+=10;}
    },20);
  }
  async function connect() {
    setBusy(true);setError('');
    try {
      reset();const connection=new SerialConnection(receive,()=>{serial.current=null;setMode('idle');engine.current.clearVitals();log('Conexiunea USB s-a închis.');});
      await connection.connect();serial.current=connection;setMode('usb');log('USB conectat · 115200 baud.');
    }catch(e){if(e.name!=='NotFoundError')setError(e.message);}finally{setBusy(false);}
  }
  async function command(text) {try{if(mode==='usb')await serial.current.send(text);log(`→ ${text}${mode==='demo'?' (demo)':''}`);}catch(e){setError(e.message);}}
  async function pause() {await command(paused?'S':'P');setPaused(!paused);}
  function update(key,value) {const updated={...settings,[key]:Number(value)};setSettings(updated);engine.current.settings=updated;}
  function exportCSV() {
    const rows=['sequence,time_ms,ir,red,ppg_filtered,beat',...session.current.map(p=>`${p.sequence},${p.t},${p.ir},${p.red},${p.value.toFixed(3)},${Number(p.beat)}`)];
    const url=URL.createObjectURL(new Blob([rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`pulslab-${new Date().toISOString().replaceAll(':','-')}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const active=mode!=='idle';
  return <div className="app-shell">
    <header><a className="brand" href="#"><span className="brand-icon">∿</span>Puls<span>Lab</span><small>LABORATOR DE SEMNAL</small></a><div className="header-actions"><span className="tag">MAX30100 / ARDUINO UNO</span><button className="icon-button" aria-label="Schimbă tema" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀':'☾'}</button></div></header>
    <main>
      <div className="page-title"><div><p className="eyebrow">ACHIZIȚIE & ANALIZĂ ÎN TIMP REAL</p><h1>Fiecare bătaie, un semnal.</h1><p className="subtitle">Explorează pulsul. Înțelege semnalul.</p></div><div className={'connection '+(active?'online':'')}><i/>{mode==='demo'?'Simulator activ':mode==='usb'?'Arduino conectat':'Neconectat'}<small>{active?'100 Hz nominal · '+(paused?'pauză':'transmisie activă'):'Alege USB sau modul demo'}</small></div></div>
      <section className="toolbar" aria-label="Conexiune și sesiune"><div><span className="section-index">01</span><strong>Sursa de date</strong></div><div className="toolbar-buttons">{active?<><button onClick={pause}>{paused?'▷ Continuă':'Ⅱ Pauză'}</button><button onClick={stop}>Deconectează</button></>:<><button className="primary" disabled={busy||!('serial' in navigator)} onClick={connect}>{busy?'Se conectează…':'↗ Conectează Arduino'}</button><button onClick={startDemo}>▷ Pornește demo</button></>}<button disabled={!session.current.length} onClick={exportCSV}>↓ Export CSV</button></div></section>
      {!('serial' in navigator)&&<p className="notice">USB necesită Chrome sau Edge pe desktop, pe localhost. Modul demo funcționează în acest browser.</p>}
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="metrics"><article className="metric"><div className="metric-label">PULS <span className="heart">♡</span></div><div className="metric-value">{display(stats.bpm)}<small>BPM</small></div><p>Interval între bătăi <b>{display(stats.ibi)} ms</b></p></article><article className="metric"><div className="metric-label">SATURAȚIE ESTIMATĂ <span>◉</span></div><div className="metric-value oxygen">{display(stats.spo2,1)}<small>% SpO₂</small></div><p>Raport AC/DC · estimare necalibrată</p></article><article className="metric signal"><div className="metric-label">CALITATEA SEMNALULUI <span>▥</span></div><div className="signal-status"><i className={stats.status==='Semnal stabil'&&active&&!paused?'good':''}/>{!active?'Așteptare conexiune':paused?'Achiziție în pauză':stats.status}</div><div className="signal-bars">{Array.from({length:24},(_,i)=><i key={i} style={{height:12+(i%5)*5,opacity:stats.status==='Semnal stabil'&&active ? 1 : .2}}/>)}</div><p>Ține degetul nemișcat pe senzor.</p></article></div>
      <div className="workspace"><div className="main-column"><section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">FORMA DE UNDĂ</p><h2>Semnal PPG</h2></div><div className="segmented" aria-label="Istoric grafic">{[5,10,20].map(s=><button key={s} className={seconds===s?'selected':''} onClick={()=>setSeconds(s)}>{s} s</button>)}</div></div><div className="chart-legend"><span><i/>IR filtrat · amplitudine relativă</span><span><i className="beat-dot"/>Bătaie detectată</span></div><div className="plot-wrap"><Plot engine={engine} seconds={seconds} running={active}/>{!stats.count&&<div className="chart-empty"><span>∿</span>Semnalul tău începe aici<small>Conectează placa sau pornește simulatorul.</small></div>}</div><div className="chart-footer"><span>DC eliminat → trece-jos → inversare → detecție vârfuri</span><span className="mono">100 eșantioane/s nominal</span></div></section>
      <section className="panel diagnostics"><div className="panel-heading"><div><p className="eyebrow">VERIFICĂRI</p><h2>În culisele semnalului</h2></div><span className="tag">SESIUNEA CURENTĂ</span></div><div className="diagnostic-grid">{[['Rată măsurată',display(stats.rate,1),'Hz'],['Eșantioane pierdute',stats.lost,''],['Linii invalide',stats.invalid,''],['Consistență ritm',display(stats.consistency,1),'%']].map(([label,value,unit])=><div key={label}><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>)}</div><div className="hrv"><span>HRV orientativ</span><span>RMSSD <b>{display(stats.rmssd,1)} ms</b></span><span>SDNN <b>{display(stats.sdnn,1)} ms</b></span><span>{stats.count.toLocaleString('ro-RO')} eșantioane</span></div></section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">COMUNICAȚIE</p><h2>Jurnal dispozitiv</h2></div><button className="text-button" onClick={()=>setLogs([])}>Golește</button></div><div className="logs" aria-live="polite">{logs.map((entry,i)=><div key={i}><time>{entry.time}</time><span className={entry.text.includes('#ERR')?'log-error':''}>{entry.text}</span></div>)}{!logs.length&&<p>Niciun mesaj.</p>}</div></section></div>
      <aside><section className="panel controls"><div className="panel-heading"><div><p className="eyebrow">REGLAJE LIVE</p><h2>Procesare semnal</h2></div><span>⚙</span></div>{[['cutoff','Filtru trece-jos',.5,10,.1,'Hz'],['threshold','Prag adaptiv',.1,2,.05,'× amplitudine'],['refractory','Perioadă refractară',250,800,10,'ms'],['finger','Prag prezență deget',500,30000,500,'ADC']].map(([key,label,min,max,step,unit])=><label className="range-control" key={key}><span>{label}<b>{settings[key]} <small>{unit}</small></b></span><input type="range" min={min} max={max} step={step} value={settings[key]} onChange={e=>update(key,e.target.value)}/></label>)}<p className="control-help">Modificările se aplică imediat. Pragurile se ajustează ulterior pe senzorul real.</p></section>
      <section className="panel controls"><div className="panel-heading"><div><p className="eyebrow">BANC DE TEST</p><h2>Simulator</h2></div><span className="tag">100 Hz</span></div><label className="range-control"><span>Puls generat<b>{bpm} BPM</b></span><input type="range" min="40" max="160" value={bpm} onChange={e=>setBpm(Number(e.target.value))}/></label><label className="select-label">Scenariu de test<select value={scenario} onChange={e=>setScenario(e.target.value)}><option value="normal">Semnal stabil</option><option value="absent">Fără deget</option><option value="motion">Mișcare / zgomot</option><option value="saturated">Senzor saturat</option></select></label><p className="control-help">Date sintetice în formatul serial al plăcii: <code>D,nr,ir,red</code>.</p></section>
      <section className="panel controls"><div className="panel-heading"><div><p className="eyebrow">COMENZI USB</p><h2>Control senzor</h2></div></div><label className="range-control"><span>Index curent LED IR + RED<b>{led} / 15</b></span><input type="range" min="0" max="15" value={led} onChange={e=>setLed(Number(e.target.value))}/></label><div className="command-buttons"><button disabled={!active} onClick={()=>command(`L${led},${led}`)}>Aplică LED</button><button disabled={!active} onClick={()=>command('?')}>Configurație ?</button></div><p className="control-help">În demo, comenzile sunt doar jurnalizate.</p></section></aside></div>
      <footer><span><b>＋</b> Prototip didactic. Valorile nu au valoare medicală și nu se folosesc pentru diagnostic.</span><span>PulsLab <span className="mono">v0.1</span></span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
