import { BIOMES } from "./biomes";
import { coordHash } from "./fixedWorld";
import { ORES } from "./mining";
import { TILE, type GameState, type Vein } from "./types";

// ============================================================================
// High-Definition Pixel-Art Tile Atlas (48x48) & Dynamic Lighting Engine
// ============================================================================

const BIOME_PALETTE = new Map<number, { color: string; accent: string }>();
for (const b of BIOMES) {
  BIOME_PALETTE.set(b.id, { color: b.color, accent: b.accent });
}

export function shadeHex(hex: string, amt: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const n = parseInt(c, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

// Cache pre-rendered 48x48 offscreen tile canvases so 60 FPS rendering is effortless
const tileCache = new Map<string, HTMLCanvasElement>();

function makeTileCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

// Pixel-art grass / terrain tile (4 deterministic variants per biome)
export function getGroundTile(biomeId: number, variant: number): HTMLCanvasElement {
  const key = `g:${biomeId}:${variant}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const pal = BIOME_PALETTE.get(biomeId) ?? { color: "#6fb85f", accent: "#3d7a3a" };
  const [c, ctx] = makeTileCanvas();

  // Base rich turf
  ctx.fillStyle = pal.color;
  ctx.fillRect(0, 0, TILE, TILE);

  // Subtle multi-tone pixel dithering patches (3px pixel blocks for HD pixel feel)
  for (let py = 0; py < TILE; py += 3) {
    for (let px = 0; px < TILE; px += 3) {
      const h = coordHash(px + variant * 31, py + biomeId * 17, 101);
      if (h > 0.78) {
        ctx.fillStyle = shadeHex(pal.color, 12);
        ctx.fillRect(px, py, 3, 3);
      } else if (h < 0.22) {
        ctx.fillStyle = shadeHex(pal.accent, 8);
        ctx.fillRect(px, py, 3, 3);
      }
    }
  }

  // Handcrafted grass blades / pebbles / soil flecks
  for (let i = 0; i < 9; i++) {
    const gx = Math.floor(coordHash(i, variant, biomeId * 13 + 1) * (TILE - 6)) + 3;
    const gy = Math.floor(coordHash(i, variant, biomeId * 13 + 2) * (TILE - 6)) + 3;
    ctx.fillStyle = shadeHex(pal.accent, -12);
    ctx.fillRect(gx, gy, 2, 4);
    ctx.fillStyle = shadeHex(pal.color, 26);
    ctx.fillRect(gx + 2, gy - 1, 2, 3);
  }

  // Tiny wildflower / pebble accent on variant 2 or 3
  if (variant >= 2) {
    const fx = 10 + Math.floor(coordHash(variant, biomeId, 9) * 28);
    const fy = 10 + Math.floor(coordHash(variant, biomeId, 19) * 28);
    ctx.fillStyle = shadeHex(pal.accent, -25);
    ctx.fillRect(fx, fy + 2, 4, 2);
    ctx.fillStyle = biomeId === 9 ? "#ff80a0" : biomeId === 20 ? "#a0f0ff" : "#ffe870";
    ctx.fillRect(fx, fy, 3, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(fx + 1, fy + 1, 1, 1);
  }

  tileCache.set(key, c);
  return c;
}

export function getSandTile(biomeId: number, variant: number): HTMLCanvasElement {
  const key = `s:${biomeId}:${variant}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const base = biomeId === 19 ? "#5e5650" : biomeId === 31 ? "#ebe3cc" : "#d8a45c";
  const [c, ctx] = makeTileCanvas();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, TILE, TILE);

  // Wind-blown dune ripples
  for (let y = 4; y < TILE; y += 10) {
    ctx.fillStyle = shadeHex(base, -14);
    ctx.fillRect(0, y + (variant % 2) * 2, TILE, 2);
    ctx.fillStyle = shadeHex(base, 14);
    ctx.fillRect(4, y + 2 + (variant % 2) * 2, TILE - 8, 2);
  }

  // Scattered sand grains / pebbles
  for (let i = 0; i < 6; i++) {
    const px = Math.floor(coordHash(i, variant, 303) * 42) + 2;
    const py = Math.floor(coordHash(i, variant, 304) * 42) + 2;
    ctx.fillStyle = shadeHex(base, -28);
    ctx.fillRect(px, py, 2, 2);
  }

  tileCache.set(key, c);
  return c;
}

export function getRoadTile(variant: number): HTMLCanvasElement {
  const key = `road:${variant}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const [c, ctx] = makeTileCanvas();
  // Packed earth mortar bed
  ctx.fillStyle = "#4d4136";
  ctx.fillRect(0, 0, TILE, TILE);

  // Irregular bevelled cobblestones
  const stones = [
    [2, 2, 18, 12], [22, 3, 22, 11],
    [3, 16, 12, 13], [17, 16, 16, 14], [35, 16, 11, 13],
    [2, 31, 20, 14], [24, 32, 21, 13],
  ];
  stones.forEach(([sx, sy, sw, sh], i) => {
    const shift = Math.round((coordHash(i, variant, 44) - 0.5) * 16);
    ctx.fillStyle = shadeHex("#8a7e72", shift);
    ctx.fillRect(sx, sy, sw, sh);
    // Top-left bevel highlight
    ctx.fillStyle = shadeHex("#a89b8d", shift);
    ctx.fillRect(sx, sy, sw, 2);
    ctx.fillRect(sx, sy, 2, sh);
    // Bottom-right shadow
    ctx.fillStyle = "#362d25";
    ctx.fillRect(sx, sy + sh - 2, sw, 2);
    ctx.fillRect(sx + sw - 2, sy, 2, sh);
  });

  tileCache.set(key, c);
  return c;
}

export function getCityFloorTile(variant: number): HTMLCanvasElement {
  const key = `cf:${variant}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const [c, ctx] = makeTileCanvas();
  ctx.fillStyle = "#342b24";
  ctx.fillRect(0, 0, TILE, TILE);

  // Ornate royal courtyard ashlar tiles (2x2 pavers per tile)
  for (let py = 0; py < 2; py++) {
    for (let px = 0; px < 2; px++) {
      const x = px * 24 + 1;
      const y = py * 24 + 1;
      const s = Math.round((coordHash(px + variant, py, 88) - 0.5) * 14);
      ctx.fillStyle = shadeHex("#7c6f60", s);
      ctx.fillRect(x, y, 22, 22);
      ctx.fillStyle = shadeHex("#9c8d7a", s);
      ctx.fillRect(x, y, 22, 2);
      ctx.fillRect(x, y, 2, 22);
      ctx.fillStyle = "#483d33";
      ctx.fillRect(x, y + 20, 22, 2);
      ctx.fillRect(x + 20, y, 2, 22);
    }
  }

  tileCache.set(key, c);
  return c;
}

export function getBridgeTile(): HTMLCanvasElement {
  const key = "bridge";
  const cached = tileCache.get(key);
  if (cached) return cached;

  const [c, ctx] = makeTileCanvas();
  // Water peeking underneath
  ctx.fillStyle = "#1b4a72";
  ctx.fillRect(0, 0, TILE, TILE);

  // Heavy oak bridge planks
  for (let x = 2; x < TILE - 2; x += 8) {
    ctx.fillStyle = "#704524";
    ctx.fillRect(x, 3, 7, TILE - 6);
    ctx.fillStyle = "#8f5b32";
    ctx.fillRect(x, 3, 6, 3);
    ctx.fillStyle = "#3e220f";
    ctx.fillRect(x + 6, 3, 1, TILE - 6);
    // Iron rivets
    ctx.fillStyle = "#c0c8d8";
    ctx.fillRect(x + 2, 6, 2, 2);
    ctx.fillRect(x + 2, TILE - 8, 2, 2);
  }
  // Top & bottom timber rails
  ctx.fillStyle = "#4a2a12";
  ctx.fillRect(0, 0, TILE, 4);
  ctx.fillRect(0, TILE - 4, TILE, 4);
  ctx.fillStyle = "#9c683b";
  ctx.fillRect(0, 1, TILE, 1);
  ctx.fillRect(0, TILE - 3, TILE, 1);

  tileCache.set(key, c);
  return c;
}

export function getWallTile(biomeId: number, cracked = false, cityWall = false, floor = 0): HTMLCanvasElement {
  const key = `wall:${biomeId}:${cracked ? 1 : 0}:${cityWall ? 1 : 0}:${Math.floor(floor / 34)}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const [c, ctx] = makeTileCanvas();
  const base = cityWall
    ? "#6d655a"
    : floor > 66
      ? "#381c2e"
      : floor > 33
        ? "#2a2b3a"
        : BIOME_PALETTE.get(biomeId)?.accent ?? "#5a564c";

  // Stone block body
  ctx.fillStyle = shadeHex(base, -24);
  ctx.fillRect(0, 0, TILE, TILE);

  // Top parapet cap
  ctx.fillStyle = shadeHex(base, 18);
  ctx.fillRect(2, 2, TILE - 4, 16);
  ctx.fillStyle = shadeHex(base, 36);
  ctx.fillRect(2, 2, TILE - 4, 3);

  // Masonry brick courses on front face
  const bricks = [
    [2, 20, 20, 12], [24, 20, 22, 12],
    [2, 34, 12, 12], [16, 34, 18, 12], [36, 34, 10, 12],
  ];
  for (const [bx, by, bw, bh] of bricks) {
    ctx.fillStyle = base;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = shadeHex(base, 18);
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = shadeHex(base, -36);
    ctx.fillRect(bx, by + bh - 2, bw, 2);
  }

  if (cityWall) {
    // Battlement crenels
    ctx.fillStyle = "#928878";
    ctx.fillRect(4, 0, 12, 6);
    ctx.fillRect(28, 0, 14, 6);
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(16, 0, 12, 4);
  }

  if (cracked) {
    // Glowing rune fissure indicating secret passage!
    ctx.fillStyle = "#0e0814";
    ctx.fillRect(20, 14, 4, 26);
    ctx.fillRect(14, 22, 8, 3);
    ctx.fillRect(24, 28, 8, 3);
    ctx.fillStyle = "#b870ff";
    ctx.fillRect(21, 16, 2, 22);
  }

  tileCache.set(key, c);
  return c;
}

export function getWaterFrame(frame: number): HTMLCanvasElement {
  const key = `water:${frame % 4}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const [c, ctx] = makeTileCanvas();
  ctx.fillStyle = "#195280";
  ctx.fillRect(0, 0, TILE, TILE);

  // Deep caustic bands
  ctx.fillStyle = "#22689e";
  const off = (frame % 4) * 6;
  for (let y = 0; y < TILE; y += 12) {
    ctx.fillRect((off + y) % TILE, y + 2, 18, 4);
    ctx.fillRect((off + y + 24) % TILE, y + 7, 14, 3);
  }
  // Specular pixel sparkles
  ctx.fillStyle = "#7fd2ff";
  ctx.fillRect((8 + off * 2) % (TILE - 6), 10, 4, 2);
  ctx.fillRect((26 + off) % (TILE - 6), 30, 5, 2);
  ctx.fillStyle = "#d8f4ff";
  ctx.fillRect((10 + off * 2) % (TILE - 6), 10, 2, 1);

  tileCache.set(key, c);
  return c;
}

// ============================================================================
// High-Detail Animated Props & Landmarks
// ============================================================================

export function drawTree5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  biomeId: number,
  x: number,
  y: number,
  time: number,
) {
  const sway = Math.sin(time * 2.1 + x * 0.7 + y * 0.4) * 2.2;

  // Ground dappled shadow
  ctx.fillStyle = "rgba(8, 10, 12, 0.36)";
  ctx.beginPath();
  ctx.ellipse(sx + 24, sy + 41, 17, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gnarled roots & shaded trunk
  ctx.fillStyle = "#2b170c";
  ctx.fillRect(sx + 18, sy + 24, 12, 18);
  ctx.fillRect(sx + 15, sy + 38, 18, 4);
  ctx.fillStyle = "#5c361c";
  ctx.fillRect(sx + 20, sy + 24, 8, 16);
  ctx.fillStyle = "#7d4c2a";
  ctx.fillRect(sx + 21, sy + 24, 3, 15);

  // Canopy palette by biome
  let base = "#2d7038";
  let mid = "#44994f";
  let hi = "#7ad16f";
  if (biomeId === 9) { base = "#731e30"; mid = "#a8324c"; hi = "#e86480"; }
  else if (biomeId === 20) { base = "#362870"; mid = "#5b42b5"; hi = "#9f80ff"; }
  else if (biomeId === 6 || biomeId === 7 || biomeId === 24) { base = "#2b4d52"; mid = "#4c7a80"; hi = "#d8f2f6"; }
  else if (biomeId === 39) { base = "#1e3a3c"; mid = "#366366"; hi = "#7eb8b8"; }
  else if (biomeId === 25) { base = "#287a48"; mid = "#4ec270"; hi = "#a8ffaa"; }

  const cx = sx + 24 + sway;
  const cy = sy + 18;

  // Dark outer leaf silhouette
  ctx.fillStyle = "#101b12";
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.arc(cx - 10, cy + 5, 11, 0, Math.PI * 2);
  ctx.arc(cx + 10, cy + 5, 11, 0, Math.PI * 2);
  ctx.fill();

  // Base shadow clusters
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 16, 0, Math.PI * 2);
  ctx.arc(cx - 9, cy + 5, 9, 0, Math.PI * 2);
  ctx.arc(cx + 9, cy + 5, 9, 0, Math.PI * 2);
  ctx.fill();

  // Midtone leaf puffs
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 10, 0, Math.PI * 2);
  ctx.arc(cx + 6, cy - 2, 9, 0, Math.PI * 2);
  ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
  ctx.fill();

  // Specular sun-kissed pixel leaf highlights
  ctx.fillStyle = hi;
  ctx.fillRect(Math.round(cx - 8), Math.round(cy - 10), 6, 4);
  ctx.fillRect(Math.round(cx + 1), Math.round(cy - 8), 5, 3);
  ctx.fillRect(Math.round(cx - 3), Math.round(cy - 3), 4, 3);

  // Bioluminescent spores / blossoms
  if (biomeId === 20 || biomeId === 25 || biomeId === 9) {
    const pulse = 0.5 + Math.sin(time * 4 + x + y) * 0.5;
    ctx.fillStyle = biomeId === 20 ? `rgba(160, 240, 255, ${0.5 + pulse * 0.5})` : `rgba(255, 220, 140, ${0.5 + pulse * 0.5})`;
    ctx.fillRect(Math.round(cx - 7), Math.round(cy + 2), 3, 3);
    ctx.fillRect(Math.round(cx + 6), Math.round(cy - 5), 3, 3);
  }
}

export function drawTorch5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  x: number,
  y: number,
  time: number,
) {
  const fl = Math.sin(time * 12 + x * 3 + y * 5);
  const fl2 = Math.cos(time * 17 + x + y);

  // Wrought-iron brazier pedestal
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(sx + 24, sy + 39, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#161214";
  ctx.fillRect(sx + 20, sy + 20, 8, 19);
  ctx.fillStyle = "#484c58";
  ctx.fillRect(sx + 21, sy + 20, 6, 17);
  ctx.fillStyle = "#8a92a4";
  ctx.fillRect(sx + 22, sy + 21, 2, 15);
  // Bowl
  ctx.fillStyle = "#262830";
  ctx.fillRect(sx + 16, sy + 16, 16, 6);
  ctx.fillStyle = "#c8943d";
  ctx.fillRect(sx + 17, sy + 17, 14, 2);

  // Multi-tongue animated pixel fire
  ctx.fillStyle = "#e84818";
  ctx.fillRect(sx + 18, Math.round(sy + 9 + fl), 12, 8);
  ctx.fillStyle = "#ff9a24";
  ctx.fillRect(sx + 20, Math.round(sy + 6 + fl2 * 1.5), 8, 10);
  ctx.fillStyle = "#fff288";
  ctx.fillRect(sx + 22, Math.round(sy + 9 + fl * 0.8), 4, 6);

  // Rising spark
  const sparkY = ((time * 24 + x * 7) % 14);
  ctx.fillStyle = "#ffd868";
  ctx.fillRect(Math.round(sx + 23 + fl * 3), Math.round(sy + 8 - sparkY), 2, 2);
}

export function drawDragonFountain5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
) {
  // Large ornate octagonal marble fountain spanning center of tile + aura
  const cx = sx + 24;
  const cy = sy + 24;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer carved stone rim
  ctx.fillStyle = "#4c5464";
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9aa6ba";
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  // Crystal blue basin water
  ctx.fillStyle = "#1c6da8";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();

  // Animated concentric ripple rings
  const r1 = 5 + ((time * 8) % 10);
  ctx.strokeStyle = `rgba(160, 235, 255, ${1 - (r1 - 5) / 10})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r1, 0, Math.PI * 2);
  ctx.stroke();

  // Central gilded dragon spire
  ctx.fillStyle = "#6c768a";
  ctx.fillRect(cx - 4, cy - 10, 8, 14);
  ctx.fillStyle = "#f4c85b";
  ctx.fillRect(cx - 5, cy - 12, 10, 4);
  ctx.fillStyle = "#fff0a8";
  ctx.fillRect(cx - 2, cy - 15, 4, 4);

  // Splashing water arcs
  const splash = Math.sin(time * 9) * 2;
  ctx.fillStyle = "#b8f0ff";
  ctx.fillRect(cx - 8, Math.round(cy - 8 + splash), 3, 4);
  ctx.fillRect(cx + 5, Math.round(cy - 8 - splash), 3, 4);
  ctx.fillRect(cx - 1, Math.round(cy - 18 + splash * 0.5), 2, 3);
}

export function drawForgeStation5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
) {
  const pulse = 0.6 + Math.sin(time * 10) * 0.4;
  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(sx + 4, sy + 36, 40, 8);

  // Stone hearth furnace
  ctx.fillStyle = "#2b2528";
  ctx.fillRect(sx + 4, sy + 6, 22, 32);
  ctx.fillStyle = "#5c5256";
  ctx.fillRect(sx + 6, sy + 8, 18, 12);
  // Glowing dragonfire mouth
  ctx.fillStyle = "#ff4414";
  ctx.fillRect(sx + 8, sy + 22, 14, 12);
  ctx.fillStyle = `rgba(255, 220, 90, ${pulse})`;
  ctx.fillRect(sx + 10, sy + 24, 10, 8);

  // Heavy Dragonstone Anvil next to furnace
  ctx.fillStyle = "#161820";
  ctx.fillRect(sx + 28, sy + 24, 16, 12);
  ctx.fillStyle = "#6e788a";
  ctx.fillRect(sx + 29, sy + 22, 14, 6);
  ctx.fillStyle = "#b8c6dc";
  ctx.fillRect(sx + 27, sy + 21, 18, 3);
  // Glowing hot ingot on anvil
  ctx.fillStyle = "#ff8020";
  ctx.fillRect(sx + 33, sy + 19, 6, 2);
}

export function drawAlchemistStall5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
) {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(sx + 4, sy + 36, 40, 8);
  // Wooden stall posts & counter
  ctx.fillStyle = "#4d2c16";
  ctx.fillRect(sx + 6, sy + 22, 36, 16);
  ctx.fillStyle = "#7c4b27";
  ctx.fillRect(sx + 8, sy + 23, 32, 5);
  // Striped canopy
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#a82830" : "#ebd8b2";
    ctx.fillRect(sx + 4 + i * 7, sy + 6, 7, 10);
  }
  // Glowing potion bottles on counter
  const g = 0.7 + Math.sin(time * 4) * 0.3;
  ctx.fillStyle = `rgba(80, 240, 160, ${g})`;
  ctx.fillRect(sx + 12, sy + 17, 5, 6);
  ctx.fillStyle = `rgba(90, 170, 255, ${g})`;
  ctx.fillRect(sx + 21, sy + 16, 5, 7);
  ctx.fillStyle = `rgba(255, 90, 110, ${g})`;
  ctx.fillRect(sx + 30, sy + 17, 5, 6);
}

export function drawGrandStair5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
) {
  const pulse = 0.65 + Math.sin(time * 3.5) * 0.35;
  // Golden stone portal base
  ctx.fillStyle = "#18100a";
  ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = "#8a6328";
  ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = "#f4c85b";
  ctx.fillRect(sx + 6, sy + 6, TILE - 12, 3);
  ctx.fillRect(sx + 6, sy + 6, 3, TILE - 12);
  ctx.fillRect(sx + TILE - 9, sy + 6, 3, TILE - 12);

  // Descending dark spiral steps
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = shadeHex("#4a3826", -i * 12);
    ctx.fillRect(sx + 10 + i * 2, sy + 12 + i * 7, TILE - 20 - i * 4, 6);
  }

  // Pulsing golden sigil arrow
  ctx.fillStyle = `rgba(255, 232, 120, ${pulse})`;
  ctx.beginPath();
  ctx.moveTo(sx + 24, sy + 36);
  ctx.lineTo(sx + 16, sy + 24);
  ctx.lineTo(sx + 32, sy + 24);
  ctx.closePath();
  ctx.fill();
}

export function drawStair5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  isDown: boolean,
  time: number,
) {
  const pulse = 0.7 + Math.sin(time * 4) * 0.3;
  ctx.fillStyle = "#1a1614";
  ctx.fillRect(sx + 5, sy + 5, TILE - 10, TILE - 10);
  ctx.fillStyle = "#6c6256";
  ctx.fillRect(sx + 7, sy + 7, TILE - 14, TILE - 14);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = isDown ? shadeHex("#564c42", -i * 14) : shadeHex("#38322c", i * 16);
    ctx.fillRect(sx + 9, sy + 10 + i * 7, TILE - 18, 6);
  }
  ctx.strokeStyle = isDown ? `rgba(244, 200, 91, ${pulse})` : `rgba(120, 210, 255, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
}

export function drawCityMonument5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  biomeId: number,
  time: number,
) {
  const accent = BIOME_PALETTE.get(biomeId)?.accent ?? "#f4c85b";
  const wave = Math.sin(time * 4.5) * 2;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(sx + 4, sy + 38, TILE - 8, 6);

  // Stone keep tower
  ctx.fillStyle = "#483f38";
  ctx.fillRect(sx + 8, sy + 12, TILE - 16, 28);
  ctx.fillStyle = "#8a7c6c";
  ctx.fillRect(sx + 10, sy + 14, TILE - 20, 24);
  // Battlement roof
  ctx.fillStyle = "#7d2820";
  ctx.beginPath();
  ctx.moveTo(sx + 6, sy + 14);
  ctx.lineTo(sx + 24, sy + 2);
  ctx.lineTo(sx + TILE - 6, sy + 14);
  ctx.closePath();
  ctx.fill();
  // Door & glowing windows
  ctx.fillStyle = "#2b180e";
  ctx.fillRect(sx + 20, sy + 28, 8, 12);
  ctx.fillStyle = "#ffd670";
  ctx.fillRect(sx + 14, sy + 20, 4, 5);
  ctx.fillRect(sx + 30, sy + 20, 4, 5);
  // Waving banner
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(sx + 24, sy - 6);
  ctx.lineTo(sx + 35 + wave, sy - 3);
  ctx.lineTo(sx + 24, sy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#161210";
  ctx.fillRect(sx + 23, sy - 7, 2, 10);
}

export function drawChest5x(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number,
  secret = false,
) {
  const pulse = 0.65 + Math.sin(time * 4.5) * 0.35;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(sx + 24, sy + 37, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#140c08";
  ctx.fillRect(sx + 9, sy + 13, 30, 24);
  ctx.fillStyle = secret ? "#5a227a" : "#703c1b";
  ctx.fillRect(sx + 11, sy + 21, 26, 14);
  ctx.fillStyle = secret ? "#863bb0" : "#9c582b";
  ctx.fillRect(sx + 11, sy + 15, 26, 6);
  // Gold trim & clasp
  ctx.fillStyle = "#f4c85b";
  ctx.fillRect(sx + 11, sy + 20, 26, 3);
  ctx.fillRect(sx + 21, sy + 15, 6, 20);
  ctx.fillStyle = secret ? "#e090ff" : "#fff098";
  ctx.fillRect(sx + 22, sy + 22, 4, 4);

  // Sparkling glint
  if (pulse > 0.85) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sx + 15, sy + 16, 3, 1);
    ctx.fillRect(sx + 16, sy + 15, 1, 3);
  }
}

export function drawVein5x(
  ctx: CanvasRenderingContext2D,
  v: Vein,
  sx: number,
  sy: number,
  time: number,
) {
  const meta = ORES[v.ore];
  const flash = v.hitFlash > 0;
  const col = flash ? "#ffffff" : meta.color;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 14, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rocky boulder base with dark pixel outline
  ctx.fillStyle = "#141418";
  ctx.beginPath();
  ctx.moveTo(sx - 15, sy + 12);
  ctx.lineTo(sx - 17, sy - 2);
  ctx.lineTo(sx - 7, sy - 14);
  ctx.lineTo(sx + 8, sy - 13);
  ctx.lineTo(sx + 17, sy - 1);
  ctx.lineTo(sx + 14, sy + 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? "#fff" : "#4b4e58";
  ctx.beginPath();
  ctx.moveTo(sx - 13, sy + 10);
  ctx.lineTo(sx - 14, sy - 2);
  ctx.lineTo(sx - 6, sy - 11);
  ctx.lineTo(sx + 7, sy - 10);
  ctx.lineTo(sx + 14, sy - 1);
  ctx.lineTo(sx + 12, sy + 10);
  ctx.closePath();
  ctx.fill();

  // Top highlight facet
  if (!flash) {
    ctx.fillStyle = "#767c8c";
    ctx.fillRect(sx - 6, sy - 9, 10, 4);
  }

  // Faceted Ore Crystal Clusters protruding from rock
  const glint = 0.65 + Math.sin(time * 5 + v.id) * 0.35;
  ctx.fillStyle = col;
  ctx.fillRect(sx - 9, sy - 7, 6, 8);
  ctx.fillRect(sx + 2, sy - 10, 7, 10);
  ctx.fillRect(sx - 2, sy - 2, 6, 7);

  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = glint * 0.75;
  ctx.fillRect(sx + 4, sy - 8, 2, 4);
  ctx.fillRect(sx - 7, sy - 5, 2, 3);
  ctx.globalAlpha = 1;

  // HP bar when damaged
  if (v.hp < v.maxHp) {
    const bw = 28;
    ctx.fillStyle = "#080604";
    ctx.fillRect(sx - bw / 2 - 1, sy - 22, bw + 2, 5);
    ctx.fillStyle = meta.color;
    ctx.fillRect(sx - bw / 2, sy - 21, (bw * Math.max(0, v.hp)) / v.maxHp, 3);
  }
}

export function drawIronGate5x(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  ctx.fillStyle = "#262830";
  ctx.fillRect(sx, sy + 2, TILE, 5);
  ctx.fillRect(sx, sy + TILE - 6, TILE, 5);
  for (let x = 6; x < TILE; x += 10) {
    ctx.fillStyle = "#6c7688";
    ctx.fillRect(sx + x, sy + 2, 3, TILE - 4);
    ctx.fillStyle = "#f4c85b";
    ctx.fillRect(sx + x, sy + 10, 3, 2);
  }
}

export function drawSteelPillar5x(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(sx + 6, sy + 40, 36, 6);
  ctx.fillStyle = "#181c24";
  ctx.fillRect(sx + 10, sy + 4, 28, 38);
  ctx.fillStyle = "#5c6678";
  ctx.fillRect(sx + 12, sy + 6, 24, 34);
  ctx.fillStyle = "#9aa6ba";
  ctx.fillRect(sx + 15, sy + 8, 6, 30);
  // Gold rune band
  ctx.fillStyle = "#f4c85b";
  ctx.fillRect(sx + 10, sy + 18, 28, 3);
}

// ============================================================================
// Dynamic Real-Time Lighting & Atmosphere Engine
// ============================================================================

let lightCanvas: HTMLCanvasElement | null = null;
let lightCtx: CanvasRenderingContext2D | null = null;

function ensureLightCanvas(w: number, h: number): CanvasRenderingContext2D {
  const lw = Math.max(1, Math.floor(w / 2));
  const lh = Math.max(1, Math.floor(h / 2));
  if (!lightCanvas) {
    lightCanvas = document.createElement("canvas");
    lightCtx = lightCanvas.getContext("2d");
  }
  if (lightCanvas.width !== lw || lightCanvas.height !== lh) {
    lightCanvas.width = lw;
    lightCanvas.height = lh;
  }
  if (!lightCtx) throw new Error("Canvas 2D indisponível");
  return lightCtx;
}

export type PointLight = {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
};

let lightMaskSprite: HTMLCanvasElement | null = null;
const bloomSpriteCache = new Map<string, HTMLCanvasElement>();

function getLightMaskSprite(): HTMLCanvasElement {
  if (lightMaskSprite) return lightMaskSprite;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, "rgba(0, 0, 0, 1)");
  grad.addColorStop(0.55, "rgba(0, 0, 0, 0.5)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  lightMaskSprite = c;
  return c;
}

function getBloomSprite(color: string): HTMLCanvasElement {
  let c = bloomSpriteCache.get(color);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  bloomSpriteCache.set(color, c);
  return c;
}

export function renderDynamicLighting(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  camX: number,
  camY: number,
  w: number,
  h: number,
  lights: PointLight[],
) {
  const inCave = !!g.activeCaveBiome || g.activeGrandFloor > 0;
  // Day-night cycle (overworld): 180s full cycle; starts in warm late afternoon -> dusk -> starlit night -> dawn
  const cycle = ((g.time + 20) / 180) % 1;
  const nightAmt = inCave
    ? 0.72
    : Math.max(0, Math.sin(cycle * Math.PI * 2 - 0.4)) * 0.56;

  // Ambient darkness overlay via half-res offscreen lightmap
  if (nightAmt > 0.04) {
    const lctx = ensureLightCanvas(w, h);
    if (!lightCanvas) return;
    const lw = lightCanvas.width;
    const lh = lightCanvas.height;
    const mask = getLightMaskSprite();

    lctx.globalCompositeOperation = "source-over";
    lctx.globalAlpha = 1;
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = inCave
      ? `rgba(8, 7, 16, ${nightAmt})`
      : g.activeEvent?.kind === "bloodMoon"
        ? `rgba(48, 8, 16, ${Math.max(0.42, nightAmt)})`
        : `rgba(10, 14, 34, ${nightAmt})`;
    lctx.fillRect(0, 0, lw, lh);

    // Punch out visibility around every point light using cached radial mask
    lctx.globalCompositeOperation = "destination-out";
    for (const lt of lights) {
      const lx = (lt.x - camX) * 0.5;
      const ly = (lt.y - camY) * 0.5;
      const lr = lt.radius * 0.5;
      if (lx < -lr || ly < -lr || lx > lw + lr || ly > lh + lr) continue;
      lctx.globalAlpha = Math.min(1, lt.intensity);
      lctx.drawImage(mask, lx - lr, ly - lr, lr * 2, lr * 2);
    }
    lctx.globalAlpha = 1;

    ctx.drawImage(lightCanvas!, 0, 0, w, h);
  }

  // Additive colored light bloom (warm torches, dragonstone forge, arcane spells)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const lt of lights) {
    const sx = lt.x - camX;
    const sy = lt.y - camY;
    const br = lt.radius * 0.72;
    if (sx < -br || sy < -br || sx > w + br || sy > h + br) continue;
    ctx.globalAlpha = lt.intensity * (inCave ? 0.32 : 0.22);
    ctx.drawImage(getBloomSprite(lt.color), sx - br, sy - br, br * 2, br * 2);
  }
  ctx.restore();
}
