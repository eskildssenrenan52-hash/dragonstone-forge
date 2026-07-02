// Sprite loader: 32x32 PNGs for every enemy name, served from /sprites/<slug>.png

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Entry = { img: HTMLImageElement | null; failed: boolean };
const cache = new Map<string, Entry>();

export function getEnemySprite(name: string): HTMLImageElement | null {
  const slug = slugify(name);
  let e = cache.get(slug);
  if (!e) {
    const img = new Image();
    e = { img, failed: false };
    cache.set(slug, e);
    img.onerror = () => {
      const entry = cache.get(slug);
      if (entry) {
        entry.img = null;
        entry.failed = true;
      }
    };
    img.src = `/sprites/${slug}.png`;
  }
  if (e.failed || !e.img) return null;
  return e.img.complete && e.img.naturalWidth > 0 ? e.img : null;
}

export function getSpriteBySlug(slug: string): HTMLImageElement | null {
  let e = cache.get(slug);
  if (!e) {
    const img = new Image();
    e = { img, failed: false };
    cache.set(slug, e);
    img.onerror = () => { const entry = cache.get(slug); if (entry) { entry.img = null; entry.failed = true; } };
    img.src = `/sprites/${slug}.png`;
  }
  if (e.failed || !e.img) return null;
  return e.img.complete && e.img.naturalWidth > 0 ? e.img : null;
}
