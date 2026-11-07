import React, { useEffect, useRef } from 'react';
export function PpgPlot({ processorRef, historySeconds, running }) {
  const canvas = useRef(null);
  useEffect(() => {
    let frame;
    const draw = () => {
      const el = canvas.current,
        rect = el.getBoundingClientRect(),
        dpr = devicePixelRatio || 1;
      if (
        el.width !== Math.round(rect.width * dpr) ||
        el.height !== Math.round(rect.height * dpr)
      ) {
        el.width = rect.width * dpr;
        el.height = rect.height * dpr;
      }
      const ctx = el.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width,
        h = rect.height,
        pad = 24;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#708d891f';
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(pad + (i * (w - 2 * pad)) / 10, pad);
        ctx.lineTo(pad + (i * (w - 2 * pad)) / 10, h - pad);
        ctx.stroke();
      }
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(pad, pad + (i * (h - 2 * pad)) / 4);
        ctx.lineTo(w - pad, pad + (i * (h - 2 * pad)) / 4);
        ctx.stroke();
      }
      const all = processorRef.current.points,
        end = all.at(-1)?.t || historySeconds * 1000;
      const points = all.filter((p) => p.t >= end - historySeconds * 1000);
      const scale = Math.max(100, ...points.map((p) => Math.abs(p.value))) * 1.25;
      const x = (p) =>
          pad + ((p.t - end + historySeconds * 1000) / (historySeconds * 1000)) * (w - 2 * pad),
        y = (p) => h / 2 - (p.value / scale) * (h / 2 - pad);
      ctx.strokeStyle = '#2bbca4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(x(p), y(p)) : ctx.moveTo(x(p), y(p))));
      ctx.stroke();
      points
        .filter((p) => p.beat)
        .forEach((p) => {
          ctx.fillStyle = '#e5aa67';
          ctx.beginPath();
          ctx.arc(x(p), y(p), 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      ctx.fillStyle = '#839994';
      ctx.font = '11px monospace';
      ctx.fillText(`−${historySeconds} s`, pad, h - 5);
      ctx.fillText('acum', w - pad - 28, h - 5);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [processorRef, historySeconds, running]);
  return (
    <canvas
      ref={canvas}
      aria-label="Grafic în timp real al semnalului PPG filtrat și bătăilor detectate"
      role="img"
    />
  );
}
