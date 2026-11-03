export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return 'Ontem';
  return `${diffDays}d atrás`;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// "17,7921° S, 50,9213° O"
export function formatCoords(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4).replace('.', ',')}° ${latitude < 0 ? 'S' : 'N'}`;
  const lng = `${Math.abs(longitude).toFixed(4).replace('.', ',')}° ${longitude < 0 ? 'O' : 'L'}`;
  return `${lat}, ${lng}`;
}
