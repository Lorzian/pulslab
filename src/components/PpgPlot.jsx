import React, { useEffect, useRef } from 'react';
export function PpgPlot({ processorRef, historySeconds, running }) {
  const canvasRef = useRef(null);
  // Canvas citește punctele din referință; animația nu impune rerandări React.
  useEffect(() => {
    let animationFrameId;
    const draw = () => {
      const canvasElement = canvasRef.current,
        bounds = canvasElement.getBoundingClientRect(),
        pixelRatio = devicePixelRatio || 1;
      if (
        canvasElement.width !== Math.round(bounds.width * pixelRatio) ||
        canvasElement.height !== Math.round(bounds.height * pixelRatio)
      ) {
        canvasElement.width = bounds.width * pixelRatio;
        canvasElement.height = bounds.height * pixelRatio;
      }
      const context = canvasElement.getContext('2d');
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const width = bounds.width,
        height = bounds.height,
        padding = 24;
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      context.strokeStyle = '#708d891f';
      for (let index = 0; index <= 10; index++) {
        context.beginPath();
        context.moveTo(padding + (index * (width - 2 * padding)) / 10, padding);
        context.lineTo(padding + (index * (width - 2 * padding)) / 10, height - padding);
        context.stroke();
      }
      for (let index = 0; index <= 4; index++) {
        context.beginPath();
        context.moveTo(padding, padding + (index * (height - 2 * padding)) / 4);
        context.lineTo(width - padding, padding + (index * (height - 2 * padding)) / 4);
        context.stroke();
      }
      const allPoints = processorRef.current.points,
        latestTimeMs = allPoints.at(-1)?.t || historySeconds * 1000;
      const points = allPoints.filter((point) => point.t >= latestTimeMs - historySeconds * 1000);
      const amplitudeScale = Math.max(100, ...points.map((point) => Math.abs(point.value))) * 1.25;
      const getX = (point) =>
          padding +
          ((point.t - latestTimeMs + historySeconds * 1000) / (historySeconds * 1000)) *
            (width - 2 * padding),
        getY = (point) => height / 2 - (point.value / amplitudeScale) * (height / 2 - padding);
      context.strokeStyle = '#2bbca4';
      context.lineWidth = 2;
      context.beginPath();
      points.forEach((point, index) =>
        index ? context.lineTo(getX(point), getY(point)) : context.moveTo(getX(point), getY(point)),
      );
      context.stroke();
      points
        .filter((point) => point.beat)
        .forEach((point) => {
          context.fillStyle = '#e5aa67';
          context.beginPath();
          context.arc(getX(point), getY(point), 4, 0, 2 * Math.PI);
          context.fill();
        });
      context.fillStyle = '#839994';
      context.font = '11px monospace';
      context.fillText(`−${historySeconds} s`, padding, height - 5);
      context.fillText('acum', width - padding - 28, height - 5);
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [processorRef, historySeconds, running]);
  return (
    <canvas
      ref={canvasRef}
      aria-label="Grafic în timp real al semnalului PPG filtrat și bătăilor detectate"
      role="img"
    />
  );
}
