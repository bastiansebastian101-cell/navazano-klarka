export function formatCzk(haleru: number): string {
  return `${(haleru / 100).toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kč`;
}
