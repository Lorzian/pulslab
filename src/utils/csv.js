// Serializarea este independentă de browser și poate fi verificată separat.
export function serializeSessionCsv(points) {
  return [
    'sequence,time_ms,ir,red,ppg_filtered,beat',
    ...points.map(
      (point) =>
        `${point.sequence},${point.t},${point.ir},${point.red},${point.value.toFixed(3)},${Number(point.beat)}`,
    ),
  ].join('\r\n');
}
export function downloadSessionCsv(points) {
  const objectUrl = URL.createObjectURL(
    new Blob([serializeSessionCsv(points)], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `pulslab-${new Date().toISOString().replaceAll(':', '-')}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
