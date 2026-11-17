const cache = new Map<string, string>();

export function gameColor(value: string): string {
  const match = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (!match) return value;
  const cached = cache.get(value);
  if (cached) return cached;
  const color = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  cache.set(value, color);
  return color;
}