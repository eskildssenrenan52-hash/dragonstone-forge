import { TILE, BIOMES, CLASS_INFO, PROFESSION_LIST, PROFESSION_NAME, type Enemy } from "./engine";
import type { GameState } from "./game";
import { getEnemySprite, getSpriteBySlug } from "./sprites";
import { ORES, PICKAXE_TIERS, miningStats } from "./mining";
import { RECIPES, canCraftRecipe, PROFESSION_BENCH, BENCH_NAME } from "./crafting";

const BIOME_COLOR: Record<number, { base: string; accent: string }> = {};
for (const b of BIOMES) BIOME_COLOR[b.id] = { base: b.color, accent: b.accent };

function caveTint(biomeId: number) {
  const b = BIOMES.find(bb => bb.id === biomeId);
  return b ? b.caveTheme : { floor: "#222", wall: "#111", accent: "#666", label: "Caverna", monsters: [], boss: "" };
}

// --------- utilities ---------
function hashXY(x: number, y: number, s = 0) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (s * 2147483647);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function shade(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt))).toString(16).padStart(2, "0");
  return "#" + f(r) + f(g) + f(b);
}
function mix(hex1: string, hex2: string, t: number): string {
  const p = (h: string) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(hex1); const [r2,g2,b2] = p(hex2);
  const f = (a:number,b:number)=>Math.round(a+(b-a)*t).toString(16).padStart(2,"0");
  return "#"+f(r1,r2)+f(g1,g2)+f(b1,b2);
}

// --------- tile drawing helpers ---------
function drawGrassTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, x: number, y: number, time: number) {
  const b = BIOME_COLOR[biomeId] || { base: "#4a8a3a", accent: "#2a5a2a" };
  // gradient base
  const grad = ctx.createLinearGradient(sx, sy, sx, sy + TILE);
  grad.addColorStop(0, shade(b.base, 12));
  grad.addColorStop(1, shade(b.base, -14));
  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, TILE, TILE);
  // mottled darker patches
  const h1 = hashXY(x, y, 7);
  if (h1 > 0.65) {
    ctx.fillStyle = shade(b.accent, -8);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(sx + 8 + h1*16, sy + 8 + hashXY(x,y,8)*16, 6+h1*4, 3+h1*2, h1*Math.PI, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // grass blades
  ctx.strokeStyle = shade(b.base, -22);
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const hh = hashXY(x, y, 20 + i);
    if (hh < 0.55) continue;
    const bx = sx + hh * TILE;
    const by = sy + hashXY(x,y,30+i) * TILE;
    const sway = Math.sin(time * 1.5 + hh * 10) * 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, by + 3);
    ctx.lineTo(bx + sway, by - 2);
    ctx.stroke();
  }
  // occasional small flower
  const fh = hashXY(x, y, 55);
  if (fh > 0.93) {
    const palette = ["#f0a0c0", "#f0e060", "#f0e0f0", "#e0ffff", "#ff8060"];
    const col = palette[Math.floor(fh * 1000) % palette.length];
    const fx = sx + 8 + hashXY(x,y,56)*16;
    const fy = sy + 8 + hashXY(x,y,57)*16;
    ctx.fillStyle = "#3a6a2a";
    ctx.fillRect(fx, fy, 1, 3);
    ctx.fillStyle = col;
    for (let a = 0; a < 5; a++) {
      const ang = (a/5)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(ang)*1.6, fy + Math.sin(ang)*1.6, 1.4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = "#f0c040";
    ctx.beginPath(); ctx.arc(fx, fy, 1.1, 0, Math.PI*2); ctx.fill();
  }
  // rare pebble
  const ph = hashXY(x, y, 88);
  if (ph > 0.94) {
    ctx.fillStyle = "#5a5a60";
    ctx.beginPath();
    ctx.ellipse(sx + 6 + ph*20, sy + 6 + hashXY(x,y,89)*20, 2.2, 1.4, ph*Math.PI, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(sx + 6 + ph*20 - 0.6, sy + 6 + hashXY(x,y,89)*20 - 0.6, 0.7, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawWaterTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number, time: number) {
  const grad = ctx.createLinearGradient(sx, sy, sx, sy + TILE);
  grad.addColorStop(0, "#2a5a90");
  grad.addColorStop(0.5, "#1e4a80");
  grad.addColorStop(1, "#173a68");
  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, TILE, TILE);
  // moving wave lines
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  const off = Math.sin(time * 1.6 + (x+y)*0.5) * 4;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy + 10 + off*0.3);
  ctx.quadraticCurveTo(sx + 8, sy + 8 + off*0.3, sx + 16, sy + 10 + off*0.3);
  ctx.quadraticCurveTo(sx + 24, sy + 12 + off*0.3, sx + 30, sy + 10 + off*0.3);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy + 22 + off*0.2);
  ctx.quadraticCurveTo(sx + 10, sy + 20 + off*0.2, sx + 18, sy + 22 + off*0.2);
  ctx.quadraticCurveTo(sx + 26, sy + 24 + off*0.2, sx + 30, sy + 22 + off*0.2);
  ctx.stroke();
  // sparkle
  if (hashXY(x, y, 3) > 0.85) {
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + (x*17+y*13));
    ctx.fillStyle = `rgba(255,255,255,${0.4*tw})`;
    ctx.fillRect(sx + 8 + hashXY(x,y,4)*16, sy + 6 + hashXY(x,y,5)*20, 2, 2);
  }
}

function drawSandTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, x: number, y: number) {
  const base = biomeId === 31 ? "#e8e0c8" : biomeId === 23 ? "#c88054" : "#d09550";
  const grad = ctx.createLinearGradient(sx, sy, sx + TILE, sy + TILE);
  grad.addColorStop(0, shade(base, 15));
  grad.addColorStop(1, shade(base, -12));
  ctx.fillStyle = grad;
  ctx.fillRect(sx, sy, TILE, TILE);
  // dune striations
  ctx.strokeStyle = shade(base, -18);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yy = sy + 6 + i * 10 + hashXY(x,y,10+i)*3;
    ctx.beginPath();
    ctx.moveTo(sx, yy);
    ctx.bezierCurveTo(sx + 8, yy - 2, sx + 20, yy + 2, sx + TILE, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // tiny stones
  if (hashXY(x, y, 44) > 0.88) {
    ctx.fillStyle = shade(base, -30);
    ctx.beginPath();
    ctx.arc(sx + 8 + hashXY(x,y,45)*18, sy + 8 + hashXY(x,y,46)*18, 1.5, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawMountainTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, x: number, y: number) {
  // grounding
  ctx.fillStyle = "#4a4a52";
  ctx.fillRect(sx, sy, TILE, TILE);
  // rock chunks with depth
  const h = hashXY(x,y,60);
  const isSnow = biomeId === 6 || biomeId === 7 || biomeId === 24;
  const isVolcano = biomeId === 10 || biomeId === 40 || biomeId === 19;
  const rockLight = isVolcano ? "#7a2818" : isSnow ? "#a8b0b8" : "#8a8a94";
  const rockDark = isVolcano ? "#3a0a08" : isSnow ? "#4a5058" : "#3a3a44";
  // back rock
  ctx.fillStyle = rockDark;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy + 30);
  ctx.lineTo(sx + 18, sy + 4);
  ctx.lineTo(sx + 30, sy + 30);
  ctx.closePath();
  ctx.fill();
  // front rock
  ctx.fillStyle = rockLight;
  ctx.beginPath();
  ctx.moveTo(sx + 5, sy + 30);
  ctx.lineTo(sx + 15, sy + 10);
  ctx.lineTo(sx + 26, sy + 30);
  ctx.closePath();
  ctx.fill();
  // lit face
  ctx.fillStyle = shade(rockLight, 22);
  ctx.beginPath();
  ctx.moveTo(sx + 15, sy + 10);
  ctx.lineTo(sx + 20, sy + 20);
  ctx.lineTo(sx + 12, sy + 22);
  ctx.closePath();
  ctx.fill();
  // snow cap
  if (isSnow) {
    ctx.fillStyle = "#f0f6fa";
    ctx.beginPath();
    ctx.moveTo(sx + 15, sy + 10);
    ctx.lineTo(sx + 20, sy + 16);
    ctx.lineTo(sx + 15, sy + 15);
    ctx.lineTo(sx + 11, sy + 16);
    ctx.closePath();
    ctx.fill();
  }
  if (isVolcano && h > 0.5) {
    // glowing crack
    ctx.strokeStyle = "#ff8030";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 14, sy + 20);
    ctx.lineTo(sx + 17, sy + 26);
    ctx.stroke();
  }
  // outline
  ctx.strokeStyle = "#12121a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + 5, sy + 30);
  ctx.lineTo(sx + 15, sy + 10);
  ctx.lineTo(sx + 26, sy + 30);
  ctx.stroke();
}

function drawTreeTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, x: number, y: number, time: number) {
  // ground under tree
  const b = BIOME_COLOR[biomeId] || { base: "#4a8a3a", accent: "#2a5a2a" };
  ctx.fillStyle = shade(b.base, -10);
  ctx.fillRect(sx, sy, TILE, TILE);
  // shadow ellipse
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(sx + 16, sy + 28, 10, 3, 0, 0, Math.PI*2); ctx.fill();
  // sway
  const sway = Math.sin(time * 1.2 + (x + y) * 0.7) * 1.5;
  // trunk
  const trunkCol = biomeId === 9 ? "#4a1a10" : biomeId === 8 ? "#3a2810" : "#3a2010";
  ctx.fillStyle = trunkCol;
  ctx.fillRect(sx + 14, sy + 18, 4, 12);
  ctx.strokeStyle = "#1a0a06";
  ctx.strokeRect(sx + 14, sy + 18, 4, 12);
  // foliage — 3 layers depending on biome
  let foliage = "#2f6a3a", foliageHi = "#5aa060";
  if (biomeId === 8) { foliage = "#1f6a30"; foliageHi = "#4fb060"; }
  else if (biomeId === 9) { foliage = "#8a3050"; foliageHi = "#e05070"; }
  else if (biomeId === 20) { foliage = "#5040a0"; foliageHi = "#a880ff"; }
  else if (biomeId === 25) { foliage = "#40a050"; foliageHi = "#a0ffa0"; }
  else if (biomeId === 39) { foliage = "#284040"; foliageHi = "#6a9898"; }
  else if (biomeId === 6 || biomeId === 7 || biomeId === 24) { foliage = "#3a5a5a"; foliageHi = "#b0d8d8"; }

  ctx.fillStyle = shade(foliage, -12);
  ctx.beginPath(); ctx.arc(sx + 16 + sway, sy + 14, 12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = foliage;
  ctx.beginPath(); ctx.arc(sx + 12 + sway, sy + 12, 8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 20 + sway, sy + 13, 8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 16 + sway, sy + 8, 8, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = foliageHi;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.arc(sx + 13 + sway, sy + 10, 3, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // fruit/glow for bioluminescent
  if (biomeId === 20) {
    ctx.fillStyle = "#f0f0a0";
    ctx.globalAlpha = 0.9;
    const pulse = 0.6 + Math.sin(time*3 + x + y)*0.4;
    ctx.beginPath(); ctx.arc(sx + 18 + sway, sy + 12, 1.5 + pulse*0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 11 + sway, sy + 14, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Decorative object drawn on empty ground tiles (deterministic per tile)
function drawDecor(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, x: number, y: number, time: number) {
  const h = hashXY(x, y, 111);
  if (h < 0.86) return; // rarity
  const kind = Math.floor(hashXY(x, y, 222) * 6);
  const fx = sx + 6 + hashXY(x,y,333)*20;
  const fy = sy + 6 + hashXY(x,y,444)*20;
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath(); ctx.ellipse(fx, fy + 4, 4, 1.6, 0, 0, Math.PI*2); ctx.fill();
  if (kind === 0) {
    // bush
    const bushCol = biomeId === 9 ? "#5a2030" : biomeId === 20 ? "#4a3080" : biomeId === 3 || biomeId === 31 ? "#7a6030" : "#2f5a2a";
    ctx.fillStyle = shade(bushCol, -10);
    ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = bushCol;
    ctx.beginPath(); ctx.arc(fx - 2, fy - 1, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 2, fy - 1, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = shade(bushCol, 22);
    ctx.beginPath(); ctx.arc(fx - 1, fy - 2, 1.2, 0, Math.PI*2); ctx.fill();
  } else if (kind === 1) {
    // rocks pile
    ctx.fillStyle = "#5a5a62";
    ctx.beginPath(); ctx.ellipse(fx, fy, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#8a8a92";
    ctx.beginPath(); ctx.arc(fx - 1, fy - 1, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 2, fy, 1.8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath(); ctx.arc(fx - 1.5, fy - 1.5, 0.8, 0, Math.PI*2); ctx.fill();
  } else if (kind === 2) {
    // mushroom
    const shroomCol = biomeId === 20 ? "#c060f0" : biomeId === 36 ? "#a080e0" : "#c04030";
    ctx.fillStyle = "#f0e0c0";
    ctx.fillRect(fx - 1, fy - 1, 2, 4);
    ctx.fillStyle = shroomCol;
    ctx.beginPath(); ctx.arc(fx, fy - 2, 3, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(fx - 1.5, fy - 2.5, 1, 1);
    ctx.fillRect(fx + 0.5, fy - 3, 1, 1);
    if (biomeId === 20 || biomeId === 36) {
      ctx.fillStyle = `rgba(240,240,180,${0.4 + Math.sin(time*2+x+y)*0.3})`;
      ctx.beginPath(); ctx.arc(fx, fy - 2, 5, 0, Math.PI*2); ctx.fill();
    }
  } else if (kind === 3) {
    // crystal shard (in crystal / cold biomes)
    if (biomeId === 13 || biomeId === 37 || biomeId === 6 || biomeId === 7) {
      const cCol = biomeId === 13 ? "#c8a0ff" : biomeId === 37 ? "#a0e0f0" : "#c0e0ff";
      ctx.fillStyle = shade(cCol, -30);
      ctx.beginPath();
      ctx.moveTo(fx, fy - 6); ctx.lineTo(fx + 3, fy); ctx.lineTo(fx - 3, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cCol;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 6); ctx.lineTo(fx + 2, fy - 1); ctx.lineTo(fx, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(fx - 0.5, fy - 4, 1, 2);
    } else {
      // fallen log
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(fx - 4, fy - 1, 8, 3);
      ctx.strokeStyle = "#2a1408"; ctx.strokeRect(fx - 4, fy - 1, 8, 3);
      ctx.fillStyle = "#7a5030";
      ctx.beginPath(); ctx.arc(fx - 4, fy, 1.5, 0, Math.PI*2); ctx.fill();
    }
  } else if (kind === 4) {
    // bone/skull for dark biomes; otherwise tall grass tuft
    if (biomeId === 27 || biomeId === 28 || biomeId === 33 || biomeId === 38) {
      ctx.fillStyle = "#e8e0c0";
      ctx.beginPath(); ctx.arc(fx, fy, 2.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillRect(fx - 1.4, fy - 0.5, 0.8, 0.8);
      ctx.fillRect(fx + 0.6, fy - 0.5, 0.8, 0.8);
      ctx.fillRect(fx - 0.4, fy + 0.8, 0.8, 0.5);
    } else {
      const cc = BIOME_COLOR[biomeId]?.accent ?? "#3a6a3a";
      ctx.strokeStyle = shade(cc, -8);
      ctx.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(fx + i, fy + 2); ctx.lineTo(fx + i*0.6, fy - 3); ctx.stroke();
      }
    }
  } else {
    // torch/campfire glow for imperial / dungeon-ish
    if (biomeId === 17 || biomeId === 22 || biomeId === 26 || biomeId === 33) {
      ctx.fillStyle = "#3a2810";
      ctx.fillRect(fx - 0.5, fy - 2, 1, 4);
      const fl = 0.6 + Math.sin(time*8 + x + y) * 0.4;
      ctx.fillStyle = `rgba(255,180,60,${0.5 + fl*0.3})`;
      ctx.beginPath(); ctx.arc(fx, fy - 3, 3 + fl, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(255,240,180,${0.7})`;
      ctx.beginPath(); ctx.arc(fx, fy - 3, 1.2, 0, Math.PI*2); ctx.fill();
    } else {
      // small flower cluster
      const palette = ["#f0a0c0", "#f0e060", "#f0e0f0", "#e0ffff", "#ff8060", "#a080ff"];
      const col = palette[Math.floor(h * 1000) % palette.length];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(fx + (i-1)*2, fy + (i%2)*1.2, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#f0c040";
        ctx.fillRect(fx + (i-1)*2 - 0.3, fy + (i%2)*1.2 - 0.3, 0.6, 0.6);
      }
    }
  }
}

// Detailed city (renders in place of grass on kind === 5)
function drawCity(ctx: CanvasRenderingContext2D, sx: number, sy: number, biomeId: number, time: number) {
  // stone base
  const grad = ctx.createLinearGradient(sx, sy, sx, sy + TILE);
  grad.addColorStop(0, "#c8b490");
  grad.addColorStop(1, "#8a7458");
  ctx.fillStyle = grad;
  ctx.fillRect(sx + 2, sy + 8, TILE - 4, TILE - 10);
  ctx.strokeStyle = "#4a3020";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 2, sy + 8, TILE - 4, TILE - 10);
  // battlements
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = "#c8b490";
    ctx.fillRect(sx + 3 + i * 7, sy + 5, 5, 4);
    ctx.strokeRect(sx + 3 + i * 7, sy + 5, 5, 4);
  }
  // tower
  ctx.fillStyle = "#a89078";
  ctx.fillRect(sx + 12, sy + 2, 8, 10);
  ctx.strokeRect(sx + 12, sy + 2, 8, 10);
  // roof
  ctx.fillStyle = "#7a2818";
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy + 3);
  ctx.lineTo(sx + 16, sy - 3);
  ctx.lineTo(sx + 22, sy + 3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#3a0a08"; ctx.stroke();
  // flag
  const wave = Math.sin(time * 4) * 1.5;
  ctx.strokeStyle = "#111"; ctx.beginPath();
  ctx.moveTo(sx + 16, sy - 3); ctx.lineTo(sx + 16, sy - 10); ctx.stroke();
  const fCol = BIOME_COLOR[biomeId]?.accent ?? "#5aa8e0";
  ctx.fillStyle = fCol;
  ctx.beginPath();
  ctx.moveTo(sx + 16, sy - 10); ctx.lineTo(sx + 22 + wave, sy - 8); ctx.lineTo(sx + 16, sy - 6); ctx.closePath();
  ctx.fill();
  // door
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(sx + 14, sy + 20, 4, 8);
  // windows glow
  const glow = 0.6 + Math.sin(time * 2) * 0.15;
  ctx.fillStyle = `rgba(240,200,120,${glow})`;
  ctx.fillRect(sx + 7, sy + 14, 3, 3);
  ctx.fillRect(sx + 22, sy + 14, 3, 3);
  ctx.fillStyle = `rgba(240,220,140,${glow})`;
  ctx.fillRect(sx + 14, sy + 5, 4, 4);
}

// Ornate stair
function drawStair(ctx: CanvasRenderingContext2D, sx: number, sy: number, kind: number, time: number) {
  const pulse = 0.55 + Math.sin(time * 4) * 0.35;
  // ground halo
  const grd = ctx.createRadialGradient(sx + 16, sy + 16, 4, sx + 16, sy + 16, 24);
  grd.addColorStop(0, `rgba(240,208,64,${0.85 * pulse})`);
  grd.addColorStop(1, "rgba(240,208,64,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(sx - 8, sy - 8, TILE + 16, TILE + 16);
  // stone frame with beveled edge
  ctx.fillStyle = "#2a1c10";
  ctx.fillRect(sx + 3, sy + 3, 26, 26);
  ctx.fillStyle = "#4a3624";
  ctx.fillRect(sx + 4, sy + 4, 24, 24);
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(sx + 5, sy + 5, 22, 2); // top shadow
  // stepped descent
  ctx.fillStyle = "#100804";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(sx + 6 + i * 2, sy + 6 + i * 3, 20 - i * 4, 2);
  }
  // rune arrow
  ctx.fillStyle = `rgba(255,240,120,${0.85 + pulse*0.15})`;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(kind === 6 ? "▼" : "▲", sx + 16, sy + 22);
  ctx.textBaseline = "alphabetic";
  // ornate corners
  ctx.strokeStyle = `rgba(240,208,64,${0.7 + pulse*0.3})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx + 3, sy + 3, 26, 26);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#f0d040";
  ctx.beginPath();
  ctx.moveTo(sx + 3, sy + 8); ctx.lineTo(sx + 3, sy + 3); ctx.lineTo(sx + 8, sy + 3);
  ctx.moveTo(sx + 24, sy + 3); ctx.lineTo(sx + 29, sy + 3); ctx.lineTo(sx + 29, sy + 8);
  ctx.moveTo(sx + 3, sy + 24); ctx.lineTo(sx + 3, sy + 29); ctx.lineTo(sx + 8, sy + 29);
  ctx.moveTo(sx + 24, sy + 29); ctx.lineTo(sx + 29, sy + 29); ctx.lineTo(sx + 29, sy + 24);
  ctx.stroke();
}

// ---------- City tile (kinds 8..16) rendered over grass ----------
function drawCityFloor(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number) {
  // paved cobblestones — warm sandy palette
  ctx.fillStyle = "#c9b48a";
  ctx.fillRect(sx, sy, 32, 32);
  ctx.fillStyle = "#b39c74";
  ctx.fillRect(sx, sy + 15, 32, 2);
  ctx.fillRect(sx + 15, sy, 2, 32);
  const h = hashXY(x, y, 3);
  ctx.fillStyle = `rgba(90,70,40,${0.15 + h * 0.15})`;
  ctx.fillRect(sx + 2, sy + 2, 12, 12);
  ctx.fillRect(sx + 18, sy + 18, 12, 12);
  ctx.fillStyle = `rgba(255,240,200,${0.1 + h * 0.1})`;
  ctx.fillRect(sx + 18, sy + 2, 12, 12);
  ctx.fillRect(sx + 2, sy + 18, 12, 12);
}
function drawTorch(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number, time: number, warm = true) {
  // sconce
  ctx.fillStyle = "#3a2010"; ctx.fillRect(sx + 14, sy + 12, 4, 14);
  ctx.fillStyle = "#5a3820"; ctx.fillRect(sx + 13, sy + 10, 6, 3);
  const fl = 0.6 + Math.sin(time * 8 + x * 1.7 + y) * 0.4;
  const glow = ctx.createRadialGradient(sx + 16, sy + 8, 1, sx + 16, sy + 8, 22);
  glow.addColorStop(0, warm ? `rgba(255,220,120,${0.55 + fl * 0.3})` : `rgba(160,200,255,${0.55 + fl * 0.3})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow; ctx.fillRect(sx - 4, sy - 8, 40, 32);
  ctx.fillStyle = warm ? `rgba(255,160,60,${0.9})` : `rgba(120,180,255,0.9)`;
  ctx.beginPath(); ctx.ellipse(sx + 16, sy + 8, 3 + fl, 5 + fl, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff8c0";
  ctx.beginPath(); ctx.arc(sx + 16, sy + 8, 1.5, 0, Math.PI * 2); ctx.fill();
}
function drawIronGate(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  ctx.fillStyle = "#c9b48a"; ctx.fillRect(sx, sy, 32, 32);
  ctx.fillStyle = "#40444c";
  ctx.fillRect(sx + 2, sy + 6, 3, 20);
  ctx.fillRect(sx + 27, sy + 6, 3, 20);
  ctx.fillRect(sx + 2, sy + 4, 28, 3);
  ctx.fillRect(sx + 2, sy + 26, 28, 3);
  ctx.strokeStyle = "#20242a"; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const gx = sx + 6 + i * 5;
    ctx.strokeRect(gx, sy + 7, 3, 18);
  }
  ctx.fillStyle = "#e0d090";
  ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 2, 0, Math.PI * 2); ctx.fill();
}
function drawSteelPillar(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const g = ctx.createLinearGradient(sx, sy, sx + 32, sy);
  g.addColorStop(0, "#3a4048"); g.addColorStop(0.5, "#7a828e"); g.addColorStop(1, "#3a4048");
  ctx.fillStyle = g; ctx.fillRect(sx + 6, sy + 2, 20, 28);
  ctx.fillStyle = "#20242a"; ctx.fillRect(sx + 4, sy, 24, 4); ctx.fillRect(sx + 4, sy + 28, 24, 4);
  ctx.fillStyle = "#a0a8b4"; ctx.fillRect(sx + 8, sy + 6, 2, 22);
  ctx.strokeStyle = "#20242a"; ctx.strokeRect(sx + 6, sy + 2, 20, 28);
}
function drawChest(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number, secret = false) {
  const pulse = 0.7 + Math.sin(time * 4) * 0.3;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(sx + 16, sy + 28, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
  // body
  const wood = secret ? "#5a2a70" : "#6b3c1c";
  const wood2 = secret ? "#7a3a90" : "#8a5028";
  ctx.fillStyle = wood; ctx.fillRect(sx + 5, sy + 12, 22, 15);
  ctx.fillStyle = wood2; ctx.fillRect(sx + 5, sy + 8, 22, 6);
  ctx.strokeStyle = "#2a1810"; ctx.strokeRect(sx + 5, sy + 8, 22, 19);
  // bands
  ctx.fillStyle = secret ? "#f0c840" : "#c0a040";
  ctx.fillRect(sx + 5, sy + 13, 22, 2);
  ctx.fillRect(sx + 14, sy + 8, 4, 19);
  // lock
  ctx.fillStyle = "#f0d060";
  ctx.fillRect(sx + 15, sy + 16, 2, 4);
  ctx.beginPath(); ctx.arc(sx + 16, sy + 15, 2, 0, Math.PI * 2); ctx.fill();
  // aura
  const aura = ctx.createRadialGradient(sx + 16, sy + 16, 2, sx + 16, sy + 16, 20);
  aura.addColorStop(0, secret ? `rgba(200,90,255,${0.35 * pulse})` : `rgba(255,210,80,${0.3 * pulse})`);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura; ctx.fillRect(sx - 4, sy - 4, 40, 40);
}
function drawFountain(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number) {
  ctx.fillStyle = "#8a95a8"; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3b7fbf"; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6cb2f0"; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
  const r = 4 + Math.sin(time * 3) * 1.5;
  ctx.beginPath(); ctx.arc(sx + 16, sy + 16, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#c0d8f0"; ctx.beginPath(); ctx.arc(sx + 16, sy + 16, 2, 0, Math.PI * 2); ctx.fill();
}
function drawCityWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number) {
  ctx.fillStyle = "#7a746a"; ctx.fillRect(sx, sy, 32, 32);
  ctx.fillStyle = "#5a544a"; ctx.fillRect(sx, sy + 15, 32, 2); ctx.fillRect(sx + 15, sy, 2, 32);
  const h = hashXY(x, y, 5);
  ctx.fillStyle = `rgba(30,26,20,${0.3 + h * 0.2})`;
  ctx.fillRect(sx + 2, sy + 2, 12, 12);
  ctx.fillRect(sx + 18, sy + 18, 12, 12);
  ctx.fillStyle = `rgba(200,190,170,${0.2})`;
  ctx.fillRect(sx + 18, sy + 2, 12, 12);
  ctx.fillRect(sx + 2, sy + 18, 12, 12);
  ctx.strokeStyle = "#2a2620"; ctx.lineWidth = 0.5; ctx.strokeRect(sx, sy, 32, 32);
}
function drawGrandStair(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number) {
  const pulse = 0.7 + Math.sin(time * 3) * 0.3;
  // stone base
  ctx.fillStyle = "#5a5450"; ctx.fillRect(sx + 2, sy + 2, 28, 28);
  // dark stairwell
  const grad = ctx.createRadialGradient(sx + 16, sy + 16, 2, sx + 16, sy + 16, 16);
  grad.addColorStop(0, "#000");
  grad.addColorStop(1, "#20140a");
  ctx.fillStyle = grad; ctx.fillRect(sx + 5, sy + 5, 22, 22);
  // gold rim
  ctx.strokeStyle = `rgba(255,210,80,${0.8 + pulse * 0.2})`;
  ctx.lineWidth = 2; ctx.strokeRect(sx + 4, sy + 4, 24, 24);
  ctx.strokeStyle = "#f0c040"; ctx.lineWidth = 1;
  ctx.strokeRect(sx + 2, sy + 2, 28, 28);
  // arrow
  ctx.fillStyle = `rgba(255,220,120,${0.9 * pulse + 0.1})`;
  ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("▼", sx + 16, sy + 17);
  ctx.textBaseline = "alphabetic";
  // glow halo
  const glow = ctx.createRadialGradient(sx + 16, sy + 16, 4, sx + 16, sy + 16, 28);
  glow.addColorStop(0, `rgba(255,210,80,${0.25 * pulse})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow; ctx.fillRect(sx - 8, sy - 8, 48, 48);
}
function drawCityTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, kind: number, x: number, y: number, time: number) {
  drawCityFloor(ctx, sx, sy, x, y);
  if (kind === 8) drawTorch(ctx, sx, sy, x, y, time);
  else if (kind === 10) drawIronGate(ctx, sx, sy);
  else if (kind === 11) drawSteelPillar(ctx, sx, sy);
  else if (kind === 12) drawChest(ctx, sx, sy, time, false);
  else if (kind === 13) { /* just paved floor */ }
  else if (kind === 14) drawCityWall(ctx, sx, sy, x, y);
  else if (kind === 15) drawFountain(ctx, sx, sy, time);
  else if (kind === 16) drawGrandStair(ctx, sx, sy, time);
}

// ---------- Grand Dungeon tile rendering ----------
function drawCrackedWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number, floor: number) {
  const base = floor > 66 ? "#3a2030" : floor > 33 ? "#2a2830" : "#3c3830";
  const lite = floor > 66 ? "#5a3050" : floor > 33 ? "#484858" : "#5c5648";
  ctx.fillStyle = base; ctx.fillRect(sx, sy, 32, 32);
  ctx.fillStyle = lite; ctx.fillRect(sx, sy + 15, 32, 2); ctx.fillRect(sx + 15, sy, 2, 32);
  const h = hashXY(x, y, 11);
  ctx.fillStyle = `rgba(0,0,0,${0.35 + h * 0.2})`;
  ctx.fillRect(sx + 2, sy + 2, 12, 12); ctx.fillRect(sx + 18, sy + 18, 12, 12);
  // cracks
  ctx.strokeStyle = `rgba(0,0,0,0.6)`; ctx.lineWidth = 1;
  const cx = sx + 4 + hashXY(x, y, 1) * 22;
  const cy = sy + 4 + hashXY(x, y, 2) * 22;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 6 * (hashXY(x, y, 4) - 0.5) * 2, cy + 8);
  ctx.lineTo(cx + 10 * (hashXY(x, y, 6) - 0.5) * 2, cy + 14);
  ctx.stroke();
}
function drawPlainWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number, floor: number) {
  const base = floor > 66 ? "#2a1828" : floor > 33 ? "#232028" : "#302c26";
  const lite = floor > 66 ? "#402840" : floor > 33 ? "#3a3846" : "#4a463c";
  ctx.fillStyle = base; ctx.fillRect(sx, sy, 32, 32);
  ctx.fillStyle = lite; ctx.fillRect(sx, sy + 15, 32, 2); ctx.fillRect(sx + 15, sy, 2, 32);
  const h = hashXY(x, y, 13);
  ctx.fillStyle = `rgba(0,0,0,${0.3 + h * 0.15})`;
  ctx.fillRect(sx + 2, sy + 2, 12, 12); ctx.fillRect(sx + 18, sy + 18, 12, 12);
}
function drawDungeonFloor(ctx: CanvasRenderingContext2D, sx: number, sy: number, x: number, y: number, floor: number) {
  const base = floor > 66 ? "#181018" : floor > 33 ? "#1a1a22" : "#20201c";
  ctx.fillStyle = base; ctx.fillRect(sx, sy, 32, 32);
  const h = hashXY(x, y, 17);
  if (h > 0.7) {
    ctx.fillStyle = `rgba(255,255,255,${(h - 0.7) * 0.08})`;
    ctx.fillRect(sx + 4, sy + 4, 24, 24);
  }
  // occasional cracks
  if (hashXY(x, y, 19) > 0.9) {
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 6, sy + 10); ctx.lineTo(sx + 14, sy + 16); ctx.lineTo(sx + 22, sy + 14);
    ctx.stroke();
  }
}
function drawDungeonTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, kind: number, x: number, y: number, time: number, floor: number) {
  if (kind === 2) { drawPlainWall(ctx, sx, sy, x, y, floor); return; }
  if (kind === 9) { drawCrackedWall(ctx, sx, sy, x, y, floor); return; }
  if (kind === 14) { drawPlainWall(ctx, sx, sy, x, y, floor); return; }
  drawDungeonFloor(ctx, sx, sy, x, y, floor);
  if (kind === 8) drawTorch(ctx, sx, sy, x, y, time, floor <= 66);
  else if (kind === 10) drawIronGate(ctx, sx, sy);
  else if (kind === 11) drawSteelPillar(ctx, sx, sy);
  else if (kind === 12) drawChest(ctx, sx, sy, time, false);
  else if (kind === 6 || kind === 7) drawStair(ctx, sx, sy, kind, time);
}

// --------- enemy classification & sprites ---------
type EnemyCategory =
  | "wolf" | "spider" | "skeleton" | "zombie" | "slime" | "dragon" | "wyvern"
  | "fae" | "demon" | "angel" | "fire" | "ice" | "electric" | "wind"
  | "golem" | "crystal" | "aberration" | "phoenix" | "aquatic" | "scorpion"
  | "bat" | "worm" | "rat" | "insect" | "boar" | "bear" | "eagle" | "mushroom"
  | "plant" | "ghost" | "knight" | "mage" | "bandit" | "cultist" | "orc"
  | "mummy" | "beholder" | "tentacle" | "generic";

function classify(name: string): EnemyCategory {
  const n = name.toLowerCase();
  const has = (...s: string[]) => s.some(x => n.includes(x));
  if (has("lobo", "lobis")) return "wolf";
  if (has("aranha")) return "spider";
  if (has("esqueleto", "esquele", "lich", "cadavé", "necroman", "coveiro", "necrofago")) return "skeleton";
  if (has("zumbi", "ghoul", "podre", "afogado", "draugr", "sepulto")) return "zombie";
  if (has("múmia", "mumia", "faraó", "farao", "escrava amaldiç", "escaravelho")) return "mummy";
  if (has("slime", "poça", "poca", "lodo", "ácido", "acido")) return "slime";
  if (has("dragão", "dragao", "wyrm", "basilisco", "draconi")) return "dragon";
  if (has("wyvern")) return "wyvern";
  if (has("fada", "ninfa", "vagalume", "biolumines", "wisp", "espírito sibil", "espirito sibil")) return "fae";
  if (has("demônio", "demonio", "diabrete")) return "demon";
  if (has("anjo", "serafim", "herald", "coro", "arauto", "criador", "divin")) return "angel";
  if (has("fenix", "fênix", "phoenix")) return "phoenix";
  if (has("salaman", "chama", "ígneo", "igneo", "magma", "lava", "fundido", "fumaça", "fumaca", "cinzas", "primal")) return "fire";
  if (has("boreal", "árti", "arti", "yeti", "urso polar", "permafrost", "gelo", "congela", "iceberg")) return "ice";
  if (has("voltai", "raio", "tempesta", "trovão", "trovao")) return "electric";
  if (has("vento", "ar ", " ar", "vórtice", "vortice", "djinn", "aéreo", "aereo", "sibil", "servo do vento", "roc", "piloto")) return "wind";
  if (has("golem", "colosso", "titã", "tita", "estátua", "estatua")) return "golem";
  if (has("cristal", "prisma", "vidro", "ametista", "espelho")) return "crystal";
  if (has("aberran", "aberraç", "voraz", "fauces", "boca", "órgão", "orgao", "coração do mundo", "coracao do mundo", "coração de mag", "coracao de mag", "devorador")) return "aberration";
  if (has("tentácul", "tentacul")) return "tentacle";
  if (has("olho flutuan", "sentinela cós", "sentinela cos", "vigia astral")) return "beholder";
  if (has("kraken", "polvo", "sereia", "peixe", "tubarão", "tubarao", "anguí", "angui", "naga", "marujo", "corsário", "corsario", "pirata", "capitão", "capitao", "almirante", "leviatã", "leviata", "skywhale")) return "aquatic";
  if (has("escorpião", "escorpiao")) return "scorpion";
  if (has("morcego")) return "bat";
  if (has("verme", "larva")) return "worm";
  if (has("rato")) return "rat";
  if (has("traça", "traca", "vagalume gigante", "espo")) return "insect";
  if (has("javali")) return "boar";
  if (has("urso")) return "bear";
  if (has("águia", "aguia", "grifo", "harpia")) return "eagle";
  if (has("cogumelo", "mycon", "micomorfe")) return "mushroom";
  if (has("treant", "broto", "espinho", "raiz", "guardião floral", "guardiao floral", "guardião do fungo", "guardiao do fungo", "espantalho", "ídolo", "idolo")) return "plant";
  if (has("sombra", "assombra", "espectro", "espectral", "fantasma", "umbra", "aparição", "aparicao", "assombraç", "eco")) return "ghost";
  if (has("cavaleiro", "legioná", "legiona", "monge", "guardião ancião", "guardiao anciao")) return "knight";
  if (has("bruxa", "necromante", "sacerdot", "alquimist", "elfo sombri", "vampiro")) return "mage";
  if (has("bandido", "salteador", "bandoleir", "nôma", "noma", "ladrão", "ladrao", "caçador", "cacador", "assassino", "arqueiro", "corsário jov", "minerador", "camponês", "campones", "cidadão", "cidadao", "contramestre", "prefeito", "marinheiro amaldi")) return "bandit";
  if (has("kobold", "anão", "anao")) return "orc";
  if (has("ogro", "trol")) return "orc";
  if (has("cão", "cao ", "cao", " cão")) return "wolf";
  return "generic";
}

function drawBossAura(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, time: number) {
  const pulse = 0.6 + Math.sin(time * 3) * 0.3;
  const grd = ctx.createRadialGradient(x, y, r, x, y, r * 2.4);
  grd.addColorStop(0, `rgba(240,60,80,${0.35 * pulse})`);
  grd.addColorStop(1, "rgba(240,60,80,0)");
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI*2); ctx.fill();
  // rotating rune circle
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.8);
  ctx.strokeStyle = `rgba(255,180,60,${0.5 + pulse*0.3})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, (i/6)*Math.PI*2, (i/6)*Math.PI*2 + 0.4);
    ctx.stroke();
  }
  ctx.restore();
  // crown
  ctx.fillStyle = "#f0c040";
  ctx.beginPath();
  ctx.moveTo(x - r*0.6, y - r - 4);
  ctx.lineTo(x - r*0.4, y - r - 10);
  ctx.lineTo(x - r*0.15, y - r - 5);
  ctx.lineTo(x, y - r - 12);
  ctx.lineTo(x + r*0.15, y - r - 5);
  ctx.lineTo(x + r*0.4, y - r - 10);
  ctx.lineTo(x + r*0.6, y - r - 4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#8a5010"; ctx.stroke();
  // gems
  ctx.fillStyle = "#f04060";
  ctx.beginPath(); ctx.arc(x, y - r - 9, 1.5, 0, Math.PI*2); ctx.fill();
  void color;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, sx: number, sy: number, time: number) {
  const r = e.radius;
  const col = e.hitFlash > 0 ? "#fff" : e.color;
  const dark = shade(col, -35);
  const light = shade(col, 30);
  const cat = classify(e.name);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(sx, sy + r, r, r/2.4, 0, 0, Math.PI*2); ctx.fill();
  if (e.isBoss) drawBossAura(ctx, sx, sy, r, col, time);

  const bob = Math.sin(time * 3 + e.id) * 1.2;

  // Try AI-generated 32x32 sprite first
  const sprite = getEnemySprite(e.name);
  if (sprite) {
    const scale = (r * 2.4) / 32; // fit sprite to enemy radius
    const size = 32 * scale;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    if (e.hitFlash > 0) {
      ctx.save();
      ctx.filter = "brightness(3) saturate(0)";
      ctx.drawImage(sprite, sx - size / 2, sy - size / 2 + bob, size, size);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, sx - size / 2, sy - size / 2 + bob, size, size);
    }
    ctx.imageSmoothingEnabled = prev;
    void col; void dark; void light; void cat;
    return;
  }



  switch (cat) {
    case "wolf": {
      // body
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy + 2, r, r*0.72, 0, 0, Math.PI*2); ctx.fill();
      // back highlight
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy + 1, r*0.9, r*0.6, 0, 0, Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx + r*0.7, sy - r*0.2, r*0.55, 0, Math.PI*2); ctx.fill();
      // snout
      ctx.fillStyle = shade(col, -20);
      ctx.beginPath(); ctx.moveTo(sx + r*1.1, sy - r*0.2); ctx.lineTo(sx + r*1.5, sy); ctx.lineTo(sx + r*1.1, sy + r*0.1); ctx.closePath(); ctx.fill();
      // ears
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(sx + r*0.5, sy - r*0.7); ctx.lineTo(sx + r*0.7, sy - r*1.1); ctx.lineTo(sx + r*0.9, sy - r*0.6); ctx.closePath(); ctx.fill();
      // eye
      ctx.fillStyle = "#f0e040";
      ctx.beginPath(); ctx.arc(sx + r*0.85, sy - r*0.25, 1.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.fillRect(sx + r*0.85 - 0.3, sy - r*0.25 - 0.3, 0.8, 1.4);
      // fang
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(sx + r*1.3, sy + r*0.05); ctx.lineTo(sx + r*1.35, sy + r*0.25); ctx.lineTo(sx + r*1.25, sy + r*0.15); ctx.closePath(); ctx.fill();
      // legs
      ctx.fillStyle = dark;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(sx - r*0.8 + i*r*0.5, sy + r*0.5, r*0.2, r*0.5);
      }
      break;
    }
    case "spider": {
      // legs
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      const legOff = Math.sin(time*6 + e.id)*2;
      for (let i = 0; i < 4; i++) {
        const a = (i/4) * Math.PI - Math.PI*0.15;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(a)*r*0.4, sy);
        ctx.lineTo(sx - Math.cos(a)*r*1.4, sy - Math.sin(a)*r*1.2 + legOff);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a)*r*0.4, sy);
        ctx.lineTo(sx + Math.cos(a)*r*1.4, sy - Math.sin(a)*r*1.2 - legOff);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // abdomen
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.2, r*0.9, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx + r*0.2, sy, r*0.4, 0, Math.PI*2); ctx.fill();
      // eyes cluster
      ctx.fillStyle = "#ff4060";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(sx - r*0.3 + (i%2)*r*0.4, sy - r*0.1 + Math.floor(i/2)*r*0.2, 1.4, 0, Math.PI*2);
        ctx.fill();
      }
      // marking
      ctx.strokeStyle = light; ctx.beginPath();
      ctx.moveTo(sx - r*0.4, sy + r*0.5); ctx.lineTo(sx, sy + r*0.15); ctx.lineTo(sx + r*0.4, sy + r*0.5); ctx.stroke();
      break;
    }
    case "skeleton": {
      // ribcage body
      ctx.fillStyle = "#e8e0c8";
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.3, r*0.55, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#8a806a"; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(sx - r*0.5, sy + r*0.05 + i*r*0.2); ctx.lineTo(sx + r*0.5, sy + r*0.05 + i*r*0.2); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(sx, sy - r*0.3); ctx.lineTo(sx, sy + r*0.7); ctx.stroke();
      // skull
      ctx.fillStyle = "#f0e8d0";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.6, r*0.6, 0, Math.PI*2); ctx.fill();
      // eye sockets
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.22, sy - r*0.65, r*0.15, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.22, sy - r*0.65, r*0.15, 0, Math.PI*2); ctx.fill();
      // glowing eyes
      ctx.fillStyle = e.isBoss ? "#ff4060" : "#40e0ff";
      ctx.beginPath(); ctx.arc(sx - r*0.22, sy - r*0.65, 1.1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.22, sy - r*0.65, 1.1, 0, Math.PI*2); ctx.fill();
      // teeth
      ctx.fillStyle = "#000";
      ctx.fillRect(sx - r*0.28, sy - r*0.35, r*0.56, 1);
      for (let i = 0; i < 5; i++) ctx.fillRect(sx - r*0.24 + i*r*0.12, sy - r*0.32, 1, 2);
      // sword
      ctx.strokeStyle = "#c0c0d0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + r*0.7, sy); ctx.lineTo(sx + r*1.4, sy - r*0.6); ctx.stroke();
      ctx.strokeStyle = "#8a5010"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx + r*0.6, sy + r*0.1); ctx.lineTo(sx + r*0.8, sy - r*0.1); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case "zombie":
    case "mummy": {
      // body
      ctx.fillStyle = cat === "mummy" ? "#c8b890" : shade(col, -20);
      ctx.fillRect(sx - r*0.6, sy - r*0.3, r*1.2, r*1.2);
      // head
      ctx.fillStyle = cat === "mummy" ? "#e0d0a8" : shade(col, 10);
      ctx.beginPath(); ctx.arc(sx, sy - r*0.7, r*0.55, 0, Math.PI*2); ctx.fill();
      // bandage lines
      if (cat === "mummy") {
        ctx.strokeStyle = "#8a7050"; ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const yy = sy - r*0.3 + i*r*0.24;
          ctx.beginPath(); ctx.moveTo(sx - r*0.6, yy); ctx.lineTo(sx + r*0.6, yy + (i%2?1:-1)*2); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(sx, sy - r*0.7, r*0.55, 0.2, Math.PI - 0.2); ctx.stroke();
      }
      // eye
      ctx.fillStyle = "#ff2020"; ctx.beginPath(); ctx.arc(sx - r*0.15, sy - r*0.75, 1.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.15, sy - r*0.75, 1.4, 0, Math.PI*2); ctx.fill();
      // mouth
      ctx.fillStyle = "#000"; ctx.fillRect(sx - r*0.2, sy - r*0.5, r*0.4, 1);
      ctx.fillStyle = "#5a1010"; ctx.fillRect(sx - r*0.15, sy - r*0.5, r*0.06, 3);
      // arms outstretched
      ctx.fillStyle = shade(col, -20);
      ctx.fillRect(sx - r*1.1, sy - r*0.15, r*0.5, r*0.25);
      ctx.fillRect(sx + r*0.6, sy - r*0.15, r*0.5, r*0.25);
      break;
    }
    case "slime": {
      const wob = Math.sin(time*5 + e.id) * r*0.08;
      ctx.fillStyle = shade(col, -20);
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.3, r + wob, r*0.7 - wob, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.9, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(sx - r*0.3, sy - r*0.35, r*0.3, r*0.15, -0.4, 0, Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.25, sy - r*0.05, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.25, sy - r*0.05, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx - r*0.28, sy - r*0.1, 0.8, 0.8);
      ctx.fillRect(sx + r*0.22, sy - r*0.1, 0.8, 0.8);
      break;
    }
    case "dragon":
    case "wyvern": {
      // wings
      const flap = Math.sin(time*4 + e.id) * 0.4;
      ctx.fillStyle = shade(col, -30);
      ctx.beginPath();
      ctx.moveTo(sx, sy - r*0.2);
      ctx.quadraticCurveTo(sx - r*1.4, sy - r*1.2 + flap*r, sx - r*1.6, sy + r*0.2);
      ctx.quadraticCurveTo(sx - r*0.8, sy - r*0.1, sx, sy - r*0.2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy - r*0.2);
      ctx.quadraticCurveTo(sx + r*1.4, sy - r*1.2 + flap*r, sx + r*1.6, sy + r*0.2);
      ctx.quadraticCurveTo(sx + r*0.8, sy - r*0.1, sx, sy - r*0.2);
      ctx.fill();
      // body
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.1, r*0.75, r*0.9, 0, 0, Math.PI*2); ctx.fill();
      // scales
      ctx.fillStyle = shade(col, 20);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          ctx.arc(sx - r*0.4 + j*r*0.4, sy - r*0.1 + i*r*0.25, r*0.12, Math.PI, 0);
        }
        ctx.fill();
      }
      // head
      ctx.fillStyle = shade(col, -10);
      ctx.beginPath(); ctx.ellipse(sx, sy - r*0.7, r*0.55, r*0.4, 0, 0, Math.PI*2); ctx.fill();
      // horns
      ctx.fillStyle = "#f0d090";
      ctx.beginPath(); ctx.moveTo(sx - r*0.3, sy - r*0.9); ctx.lineTo(sx - r*0.4, sy - r*1.3); ctx.lineTo(sx - r*0.15, sy - r*0.85); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*0.3, sy - r*0.9); ctx.lineTo(sx + r*0.4, sy - r*1.3); ctx.lineTo(sx + r*0.15, sy - r*0.85); ctx.closePath(); ctx.fill();
      // eyes
      ctx.fillStyle = "#f0e040";
      ctx.beginPath(); ctx.arc(sx - r*0.2, sy - r*0.72, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.2, sy - r*0.72, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.fillRect(sx - r*0.22, sy - r*0.75, 0.6, 1.5); ctx.fillRect(sx + r*0.18, sy - r*0.75, 0.6, 1.5);
      // tail
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, sy + r*0.9); ctx.quadraticCurveTo(sx + r*0.8, sy + r*1.2, sx + r*1.2, sy + r*0.6); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case "fae": {
      // glow aura
      const pulse = 0.6 + Math.sin(time*4 + e.id)*0.35;
      const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, r*2);
      grd.addColorStop(0, `rgba(255,240,180,${0.6*pulse})`);
      grd.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(sx, sy, r*2, 0, Math.PI*2); ctx.fill();
      // body
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(sx, sy + bob, r*0.55, 0, Math.PI*2); ctx.fill();
      // wings
      ctx.fillStyle = `rgba(255,255,255,0.65)`;
      const wf = Math.sin(time*10+e.id)*0.3;
      ctx.beginPath(); ctx.ellipse(sx - r*0.7, sy - r*0.2, r*0.5, r*0.25, -0.5 + wf, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*0.7, sy - r*0.2, r*0.5, r*0.25, 0.5 - wf, 0, Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.18, sy - r*0.1 + bob, 1.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.18, sy - r*0.1 + bob, 1.2, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "demon": {
      // body
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.3, r*0.85, r*0.9, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.7, r*0.65, 0, 0, Math.PI*2); ctx.fill();
      // horns
      ctx.fillStyle = "#1a0808";
      ctx.beginPath(); ctx.moveTo(sx - r*0.6, sy - r*0.5); ctx.lineTo(sx - r*0.9, sy - r*1.2); ctx.lineTo(sx - r*0.35, sy - r*0.7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*0.6, sy - r*0.5); ctx.lineTo(sx + r*0.9, sy - r*1.2); ctx.lineTo(sx + r*0.35, sy - r*0.7); ctx.closePath(); ctx.fill();
      // face
      ctx.fillStyle = "#ff4020";
      ctx.beginPath(); ctx.arc(sx - r*0.25, sy - r*0.15, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.25, sy - r*0.15, 2, 0, Math.PI*2); ctx.fill();
      // grin
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy + r*0.15, r*0.35, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.lineWidth = 1;
      // fangs
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.moveTo(sx - r*0.15, sy + r*0.3); ctx.lineTo(sx - r*0.1, sy + r*0.5); ctx.lineTo(sx - r*0.05, sy + r*0.3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*0.05, sy + r*0.3); ctx.lineTo(sx + r*0.1, sy + r*0.5); ctx.lineTo(sx + r*0.15, sy + r*0.3); ctx.closePath(); ctx.fill();
      // bat wings
      ctx.fillStyle = shade(col, -35);
      const flap = Math.sin(time*5 + e.id) * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx - r*0.5, sy); ctx.quadraticCurveTo(sx - r*1.5, sy - r*0.5 + flap*r, sx - r*1.3, sy + r*0.4); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + r*0.5, sy); ctx.quadraticCurveTo(sx + r*1.5, sy - r*0.5 + flap*r, sx + r*1.3, sy + r*0.4); ctx.closePath(); ctx.fill();
      break;
    }
    case "angel": {
      // wings
      ctx.fillStyle = "rgba(240,240,255,0.9)";
      ctx.beginPath(); ctx.ellipse(sx - r*0.9, sy - r*0.2, r*0.8, r*0.4, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*0.9, sy - r*0.2, r*0.8, r*0.4, 0.4, 0, Math.PI*2); ctx.fill();
      // robe
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.moveTo(sx - r*0.5, sy + r); ctx.lineTo(sx - r*0.35, sy - r*0.2); ctx.lineTo(sx + r*0.35, sy - r*0.2); ctx.lineTo(sx + r*0.5, sy + r); ctx.closePath(); ctx.fill();
      // head
      ctx.fillStyle = "#f0d0a8";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.4, r*0.35, 0, Math.PI*2); ctx.fill();
      // halo
      const pulse = 0.7 + Math.sin(time*3)*0.2;
      ctx.strokeStyle = `rgba(255,220,120,${pulse})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy - r*0.85, r*0.4, r*0.1, 0, 0, Math.PI*2); ctx.stroke();
      ctx.lineWidth = 1;
      // eyes shine
      ctx.fillStyle = "#ffff80";
      ctx.fillRect(sx - r*0.18, sy - r*0.45, 3, 1.5); ctx.fillRect(sx + r*0.08, sy - r*0.45, 3, 1.5);
      // sword
      ctx.strokeStyle = "#e0e8ff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + r*0.4, sy); ctx.lineTo(sx + r*1.1, sy - r*0.9); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case "phoenix":
    case "fire": {
      // flame body
      const fl = 0.7 + Math.sin(time*8 + e.id)*0.25;
      const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, r*1.3);
      grd.addColorStop(0, "#ffff80");
      grd.addColorStop(0.4, "#ff8020");
      grd.addColorStop(1, "rgba(200,20,20,0)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(sx, sy, r*1.3, 0, Math.PI*2); ctx.fill();
      // core body
      ctx.fillStyle = "#ff5020";
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.7, r*0.85, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ffb040";
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.1, r*0.45, r*0.5, 0, 0, Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx - r*0.2, sy - r*0.1, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.2, sy - r*0.1, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.fillRect(sx - r*0.22, sy - r*0.13, 0.9, 1); ctx.fillRect(sx + r*0.15, sy - r*0.13, 0.9, 1);
      // flame tongues on top
      ctx.fillStyle = `rgba(255,200,80,${fl})`;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const bx = sx - r*0.4 + i*r*0.4;
        ctx.moveTo(bx - 2, sy - r*0.6);
        ctx.quadraticCurveTo(bx, sy - r*1.4 - fl*4, bx + 2, sy - r*0.6);
        ctx.fill();
      }
      // phoenix wings
      if (cat === "phoenix") {
        ctx.fillStyle = "#ff6030";
        const flap = Math.sin(time*5+e.id)*0.3;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - r*1.4, sy - r + flap*r, sx - r*1.2, sy + r*0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + r*1.4, sy - r + flap*r, sx + r*1.2, sy + r*0.3); ctx.closePath(); ctx.fill();
      }
      break;
    }
    case "ice": {
      // frost aura
      ctx.fillStyle = "rgba(180,220,255,0.35)";
      ctx.beginPath(); ctx.arc(sx, sy, r*1.3, 0, Math.PI*2); ctx.fill();
      // crystal body
      ctx.fillStyle = "#8ac0d8";
      ctx.beginPath();
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx + r*0.9, sy - r*0.2);
      ctx.lineTo(sx + r*0.7, sy + r*0.9);
      ctx.lineTo(sx - r*0.7, sy + r*0.9);
      ctx.lineTo(sx - r*0.9, sy - r*0.2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#e0f0ff"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r*0.9);
      ctx.moveTo(sx - r*0.9, sy - r*0.2); ctx.lineTo(sx + r*0.9, sy - r*0.2);
      ctx.stroke();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath(); ctx.moveTo(sx - r*0.2, sy - r*0.7); ctx.lineTo(sx - r*0.1, sy - r*0.1); ctx.lineTo(sx + r*0.15, sy - r*0.5); ctx.closePath(); ctx.fill();
      // eyes
      ctx.fillStyle = "#0060a0";
      ctx.beginPath(); ctx.arc(sx - r*0.2, sy + r*0.1, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.2, sy + r*0.1, 1.6, 0, Math.PI*2); ctx.fill();
      // snowflakes
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 3; i++) {
        const a = time + i*2.1 + e.id;
        ctx.fillRect(sx + Math.cos(a)*r*1.2 - 0.6, sy + Math.sin(a)*r*1.2 - 0.6, 1.2, 1.2);
      }
      break;
    }
    case "electric": {
      // body
      ctx.fillStyle = "#e0e0ff";
      ctx.beginPath(); ctx.arc(sx, sy, r*0.7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#8080ff";
      ctx.beginPath(); ctx.arc(sx, sy, r*0.45, 0, Math.PI*2); ctx.fill();
      // lightning arcs
      ctx.strokeStyle = "#f0f0ff"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const a = (i/5) * Math.PI * 2 + time*3;
        const x1 = sx + Math.cos(a)*r*0.8, y1 = sy + Math.sin(a)*r*0.8;
        const x2 = sx + Math.cos(a)*r*1.5, y2 = sy + Math.sin(a)*r*1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1*0.6+x2*0.4 + (hashXY(i, e.id, 1)-0.5)*3, y1*0.6+y2*0.4 + (hashXY(i, e.id, 2)-0.5)*3);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(sx - r*0.2, sy - r*0.1, 2, 2); ctx.fillRect(sx + r*0.05, sy - r*0.1, 2, 2);
      break;
    }
    case "wind": {
      // swirling body
      const rot = time * 4;
      ctx.strokeStyle = shade(col, 30); ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(sx, sy, r*0.7 - i*3, rot + i*1.2, rot + i*1.2 + Math.PI*1.4);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // core
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx, sy, r*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx - r*0.1, sy - r*0.15, 1.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.1, sy - r*0.15, 1.4, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "golem": {
      // body chunks
      ctx.fillStyle = dark;
      ctx.fillRect(sx - r*0.9, sy - r*0.5, r*1.8, r*1.4);
      ctx.fillStyle = col;
      ctx.fillRect(sx - r*0.8, sy - r*0.4, r*1.6, r*1.2);
      // cracks
      ctx.strokeStyle = shade(col, -35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx - r*0.3, sy - r*0.4); ctx.lineTo(sx - r*0.1, sy); ctx.lineTo(sx - r*0.4, sy + r*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + r*0.5, sy - r*0.2); ctx.lineTo(sx + r*0.3, sy + r*0.2); ctx.stroke();
      // head
      ctx.fillStyle = dark;
      ctx.fillRect(sx - r*0.45, sy - r*0.95, r*0.9, r*0.5);
      ctx.fillStyle = col;
      ctx.fillRect(sx - r*0.4, sy - r*0.9, r*0.8, r*0.4);
      // eyes glow
      ctx.fillStyle = "#ff8040";
      ctx.fillRect(sx - r*0.25, sy - r*0.75, 4, 3);
      ctx.fillRect(sx + r*0.05, sy - r*0.75, 4, 3);
      ctx.fillStyle = "rgba(255,200,120,0.5)";
      ctx.fillRect(sx - r*0.3, sy - r*0.8, 5, 5);
      ctx.fillRect(sx, sy - r*0.8, 5, 5);
      // shoulder plates
      ctx.fillStyle = shade(col, 25);
      ctx.beginPath(); ctx.arc(sx - r*0.85, sy - r*0.3, r*0.35, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.85, sy - r*0.3, r*0.35, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "crystal": {
      // faceted body
      ctx.fillStyle = shade(col, -25);
      ctx.beginPath();
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx + r*0.9, sy - r*0.3);
      ctx.lineTo(sx + r*0.55, sy + r*0.9);
      ctx.lineTo(sx - r*0.55, sy + r*0.9);
      ctx.lineTo(sx - r*0.9, sy - r*0.3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx + r*0.35, sy - r*0.3);
      ctx.lineTo(sx, sy + r*0.9);
      ctx.lineTo(sx - r*0.35, sy - r*0.3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx - r*0.1, sy);
      ctx.lineTo(sx + r*0.1, sy - r*0.6);
      ctx.closePath(); ctx.fill();
      // inner eye
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx, sy + r*0.1, r*0.16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#8040ff";
      ctx.beginPath(); ctx.arc(sx, sy + r*0.1, r*0.09, 0, Math.PI*2); ctx.fill();
      // glowing edges
      ctx.strokeStyle = light; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r*0.9, sy - r*0.3);
      ctx.moveTo(sx, sy - r); ctx.lineTo(sx - r*0.9, sy - r*0.3);
      ctx.stroke();
      break;
    }
    case "aberration":
    case "beholder":
    case "tentacle": {
      // pulsing horror
      const pulse = 0.6 + Math.sin(time*3 + e.id)*0.2;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx, sy, r*(0.9 + pulse*0.1), 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx, sy, r*0.75, 0, Math.PI*2); ctx.fill();
      // giant central eye
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx, sy, r*0.45, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#8040ff";
      ctx.beginPath(); ctx.arc(sx, sy, r*0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx, sy, r*0.15, 0, Math.PI*2); ctx.fill();
      // veins
      ctx.strokeStyle = shade(col, -50); ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i/6)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a)*r*0.55, sy + Math.sin(a)*r*0.55);
        ctx.lineTo(sx + Math.cos(a)*r*0.9, sy + Math.sin(a)*r*0.9);
        ctx.stroke();
      }
      // tentacles
      ctx.strokeStyle = dark; ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const a = (i/5)*Math.PI*2 + time*0.5;
        const wig = Math.sin(time*4 + i)*0.4;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a)*r*0.9, sy + Math.sin(a)*r*0.9);
        ctx.quadraticCurveTo(
          sx + Math.cos(a + wig)*r*1.4, sy + Math.sin(a + wig)*r*1.4,
          sx + Math.cos(a + wig*2)*r*1.8, sy + Math.sin(a + wig*2)*r*1.8
        );
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      // small eyes
      ctx.fillStyle = "#ff4060";
      for (let i = 0; i < 4; i++) {
        const a = (i/4)*Math.PI*2 + Math.PI/4;
        ctx.beginPath(); ctx.arc(sx + Math.cos(a)*r*0.6, sy + Math.sin(a)*r*0.6, 1.5, 0, Math.PI*2); ctx.fill();
      }
      break;
    }
    case "aquatic": {
      // fish/sea body
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy, r, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.1, r*0.85, r*0.55, 0, 0, Math.PI*2); ctx.fill();
      // belly
      ctx.fillStyle = shade(col, 30);
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.3, r*0.6, r*0.25, 0, 0, Math.PI*2); ctx.fill();
      // fins
      ctx.fillStyle = dark;
      const flap = Math.sin(time*6 + e.id)*0.3;
      ctx.beginPath(); ctx.moveTo(sx - r*0.9, sy); ctx.lineTo(sx - r*1.4, sy - r*0.4 + flap*r); ctx.lineTo(sx - r*1.4, sy + r*0.4 + flap*r); ctx.closePath(); ctx.fill();
      // dorsal
      ctx.beginPath(); ctx.moveTo(sx - r*0.2, sy - r*0.5); ctx.lineTo(sx + r*0.1, sy - r*1); ctx.lineTo(sx + r*0.4, sy - r*0.5); ctx.closePath(); ctx.fill();
      // eye
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx + r*0.55, sy - r*0.15, 2.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(sx + r*0.55, sy - r*0.15, 1.2, 0, Math.PI*2); ctx.fill();
      // gill
      ctx.strokeStyle = shade(col, -20); ctx.beginPath(); ctx.moveTo(sx + r*0.25, sy - r*0.15); ctx.lineTo(sx + r*0.25, sy + r*0.2); ctx.stroke();
      // scales
      ctx.strokeStyle = shade(col, 20);
      for (let i = 0; i < 3; i++) ctx.strokeRect(sx - r*0.2 + i*r*0.2, sy - r*0.1, r*0.16, r*0.16);
      break;
    }
    case "scorpion": {
      // body segments
      ctx.fillStyle = dark;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.ellipse(sx - r*0.6 + i*r*0.3, sy + i*r*0.05, r*0.28, r*0.22, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = col;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.ellipse(sx - r*0.6 + i*r*0.3, sy + i*r*0.05 - 1, r*0.22, r*0.17, 0, 0, Math.PI*2); ctx.fill();
      }
      // claws
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx - r*1.1, sy - r*0.3, r*0.4, r*0.22, -0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*1.1, sy - r*0.3, r*0.4, r*0.22, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.moveTo(sx - r*1.4, sy - r*0.5); ctx.lineTo(sx - r*1.25, sy - r*0.15); ctx.lineTo(sx - r*1.1, sy - r*0.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*1.4, sy - r*0.5); ctx.lineTo(sx + r*1.25, sy - r*0.15); ctx.lineTo(sx + r*1.1, sy - r*0.4); ctx.fill();
      // tail curl
      ctx.strokeStyle = dark; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + r*0.6, sy + r*0.2);
      ctx.quadraticCurveTo(sx + r*1.4, sy - r*0.6, sx + r*0.8, sy - r*1.1);
      ctx.stroke();
      ctx.lineWidth = 1;
      // stinger
      ctx.fillStyle = "#f0c020";
      ctx.beginPath(); ctx.moveTo(sx + r*0.75, sy - r*1.1); ctx.lineTo(sx + r*0.9, sy - r*1.4); ctx.lineTo(sx + r, sy - r*1.05); ctx.closePath(); ctx.fill();
      break;
    }
    case "bat": {
      const flap = Math.sin(time*10 + e.id)*0.4;
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - r*1.5, sy - r + flap*r, sx - r*1.6, sy + r*0.3);
      ctx.quadraticCurveTo(sx - r*0.9, sy + r*0.1, sx - r*0.5, sy + r*0.4);
      ctx.lineTo(sx, sy + r*0.4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + r*1.5, sy - r + flap*r, sx + r*1.6, sy + r*0.3);
      ctx.quadraticCurveTo(sx + r*0.9, sy + r*0.1, sx + r*0.5, sy + r*0.4);
      ctx.lineTo(sx, sy + r*0.4);
      ctx.closePath(); ctx.fill();
      // body
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.15, r*0.4, r*0.45, 0, 0, Math.PI*2); ctx.fill();
      // ears
      ctx.beginPath(); ctx.moveTo(sx - r*0.25, sy - r*0.2); ctx.lineTo(sx - r*0.35, sy - r*0.5); ctx.lineTo(sx - r*0.12, sy - r*0.25); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*0.25, sy - r*0.2); ctx.lineTo(sx + r*0.35, sy - r*0.5); ctx.lineTo(sx + r*0.12, sy - r*0.25); ctx.fill();
      // eyes
      ctx.fillStyle = "#ff4060";
      ctx.beginPath(); ctx.arc(sx - r*0.15, sy - r*0.05, 1.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.15, sy - r*0.05, 1.4, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "worm": {
      // segmented worm
      ctx.fillStyle = dark;
      for (let i = 0; i < 5; i++) {
        const off = Math.sin(time*3 + i*0.7 + e.id)*3;
        ctx.beginPath(); ctx.ellipse(sx - r*0.8 + i*r*0.4, sy + off, r*0.35, r*0.4, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const off = Math.sin(time*3 + i*0.7 + e.id)*3;
        ctx.beginPath(); ctx.ellipse(sx - r*0.8 + i*r*0.4, sy - 1 + off, r*0.3, r*0.32, 0, 0, Math.PI*2); ctx.fill();
      }
      // head with mandibles
      const hOff = Math.sin(time*3 + 4*0.7 + e.id)*3;
      ctx.fillStyle = shade(col, 20);
      ctx.beginPath(); ctx.arc(sx + r*0.8, sy + hOff, r*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.moveTo(sx + r*1, sy + hOff - r*0.3); ctx.lineTo(sx + r*1.3, sy + hOff); ctx.lineTo(sx + r*1, sy + hOff + r*0.3); ctx.fill();
      // eyes
      ctx.fillStyle = "#f0e040";
      ctx.beginPath(); ctx.arc(sx + r*0.7, sy + hOff - r*0.15, 1.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.7, sy + hOff + r*0.15, 1.3, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "rat": {
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy, r, r*0.65, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy - 1, r*0.85, r*0.5, 0, 0, Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx + r*0.7, sy - r*0.15, r*0.45, 0, Math.PI*2); ctx.fill();
      // ears
      ctx.fillStyle = "#f0a0a0";
      ctx.beginPath(); ctx.arc(sx + r*0.55, sy - r*0.55, r*0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.9, sy - r*0.55, r*0.18, 0, Math.PI*2); ctx.fill();
      // eye
      ctx.fillStyle = "#ff2020";
      ctx.beginPath(); ctx.arc(sx + r*0.85, sy - r*0.2, 1.5, 0, Math.PI*2); ctx.fill();
      // nose
      ctx.fillStyle = "#f0a0a0";
      ctx.beginPath(); ctx.arc(sx + r*1.15, sy - r*0.05, 1.3, 0, Math.PI*2); ctx.fill();
      // tail
      ctx.strokeStyle = "#f0a080"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx - r*0.9, sy + r*0.1);
      ctx.quadraticCurveTo(sx - r*1.6, sy - r*0.4, sx - r*1.4, sy - r*0.9);
      ctx.stroke();
      ctx.lineWidth = 1;
      // teeth
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx + r*1.05, sy + r*0.05, 1.4, 1.6);
      break;
    }
    case "insect": {
      // beetle
      const flap = Math.sin(time*15+e.id)*r*0.15;
      // wings
      ctx.fillStyle = "rgba(200,220,255,0.4)";
      ctx.beginPath(); ctx.ellipse(sx - r*0.4, sy - r*0.2 - flap, r*0.6, r*0.35, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*0.4, sy - r*0.2 - flap, r*0.6, r*0.35, 0.3, 0, Math.PI*2); ctx.fill();
      // shell
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.85, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.65, r*0.55, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = dark; ctx.beginPath(); ctx.moveTo(sx, sy - r*0.7); ctx.lineTo(sx, sy + r*0.7); ctx.stroke();
      // head
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx, sy - r*0.75, r*0.35, 0, Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = "#f0e040";
      ctx.beginPath(); ctx.arc(sx - r*0.15, sy - r*0.75, 1.4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.15, sy - r*0.75, 1.4, 0, Math.PI*2); ctx.fill();
      // antennae
      ctx.strokeStyle = "#000";
      ctx.beginPath(); ctx.moveTo(sx - r*0.1, sy - r); ctx.lineTo(sx - r*0.3, sy - r*1.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + r*0.1, sy - r); ctx.lineTo(sx + r*0.3, sy - r*1.3); ctx.stroke();
      break;
    }
    case "boar": {
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*1.1, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy - 1, r*0.95, r*0.55, 0, 0, Math.PI*2); ctx.fill();
      // bristles
      ctx.strokeStyle = "#1a0f08"; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(sx + i*3, sy - r*0.55); ctx.lineTo(sx + i*3 - 1, sy - r*0.85); ctx.stroke();
      }
      // head
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx + r*0.85, sy, r*0.5, 0, Math.PI*2); ctx.fill();
      // snout
      ctx.fillStyle = "#3a2010";
      ctx.beginPath(); ctx.ellipse(sx + r*1.25, sy + r*0.1, r*0.25, r*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(sx + r*1.35, sy + r*0.05, 0.9, 0, Math.PI*2); ctx.fill();
      // tusks
      ctx.fillStyle = "#f0e0c0";
      ctx.beginPath(); ctx.moveTo(sx + r*1.15, sy + r*0.15); ctx.lineTo(sx + r*1.3, sy - r*0.05); ctx.lineTo(sx + r*1.1, sy + r*0.05); ctx.fill();
      // eyes
      ctx.fillStyle = "#ff4040";
      ctx.beginPath(); ctx.arc(sx + r*0.8, sy - r*0.2, 1.3, 0, Math.PI*2); ctx.fill();
      // legs
      ctx.fillStyle = dark;
      for (let i = 0; i < 4; i++) ctx.fillRect(sx - r*0.7 + i*r*0.45, sy + r*0.5, r*0.15, r*0.4);
      break;
    }
    case "bear": {
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(sx, sy + 1, r*1.05, r*0.85, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy, r*0.9, r*0.7, 0, 0, Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx, sy - r*0.7, r*0.55, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx, sy - r*0.65, r*0.42, 0, Math.PI*2); ctx.fill();
      // ears
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(sx - r*0.4, sy - r*1.05, r*0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.4, sy - r*1.05, r*0.2, 0, Math.PI*2); ctx.fill();
      // snout
      ctx.fillStyle = "#3a2010";
      ctx.beginPath(); ctx.ellipse(sx, sy - r*0.45, r*0.22, r*0.15, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(sx, sy - r*0.5, 1.4, 0, Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.2, sy - r*0.75, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.2, sy - r*0.75, 1.5, 0, Math.PI*2); ctx.fill();
      // claws
      ctx.fillStyle = "#f0e0c0";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(sx - r*0.9 + i*3, sy + r*0.75); ctx.lineTo(sx - r*0.9 + i*3, sy + r*0.9); ctx.lineTo(sx - r*0.9 + i*3 + 1.5, sy + r*0.75); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sx + r*0.7 + i*3, sy + r*0.75); ctx.lineTo(sx + r*0.7 + i*3, sy + r*0.9); ctx.lineTo(sx + r*0.7 + i*3 + 1.5, sy + r*0.75); ctx.fill();
      }
      break;
    }
    case "eagle": {
      const flap = Math.sin(time*4 + e.id)*0.5;
      // wings
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx - r*1.6, sy - r*0.5 + flap*r, sx - r*1.8, sy + r*0.1); ctx.quadraticCurveTo(sx - r, sy + r*0.2, sx - r*0.2, sy - r*0.1); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + r*1.6, sy - r*0.5 + flap*r, sx + r*1.8, sy + r*0.1); ctx.quadraticCurveTo(sx + r, sy + r*0.2, sx + r*0.2, sy - r*0.1); ctx.fill();
      // body
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.2, r*0.5, r*0.65, 0, 0, Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = "#f0f0e8";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.4, r*0.35, 0, Math.PI*2); ctx.fill();
      // beak
      ctx.fillStyle = "#f0b040";
      ctx.beginPath(); ctx.moveTo(sx, sy - r*0.3); ctx.lineTo(sx + r*0.35, sy - r*0.2); ctx.lineTo(sx, sy - r*0.1); ctx.fill();
      // eye
      ctx.fillStyle = "#f0d040"; ctx.beginPath(); ctx.arc(sx - r*0.1, sy - r*0.42, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(sx - r*0.1, sy - r*0.42, 0.9, 0, Math.PI*2); ctx.fill();
      // talons
      ctx.strokeStyle = "#f0b040"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx - r*0.15, sy + r*0.7); ctx.lineTo(sx - r*0.15, sy + r*0.95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + r*0.15, sy + r*0.7); ctx.lineTo(sx + r*0.15, sy + r*0.95); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case "mushroom": {
      // stem
      ctx.fillStyle = "#e0d0a0";
      ctx.fillRect(sx - r*0.25, sy - r*0.1, r*0.5, r);
      ctx.strokeStyle = "#8a7050"; ctx.strokeRect(sx - r*0.25, sy - r*0.1, r*0.5, r);
      // cap
      ctx.fillStyle = shade(col, -20);
      ctx.beginPath(); ctx.ellipse(sx, sy - r*0.3, r, r*0.6, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx, sy - r*0.4, r*0.9, r*0.5, 0, Math.PI, 0); ctx.fill();
      // spots
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx - r*0.4, sy - r*0.5, r*0.14, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.35, sy - r*0.6, r*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy - r*0.75, r*0.1, 0, Math.PI*2); ctx.fill();
      // eyes on stem
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.1, sy + r*0.15, 1.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.1, sy + r*0.15, 1.2, 0, Math.PI*2); ctx.fill();
      // spore glow
      ctx.fillStyle = `rgba(200,120,240,${0.4 + Math.sin(time*3+e.id)*0.2})`;
      for (let i = 0; i < 3; i++) {
        const a = time + i*2;
        ctx.beginPath(); ctx.arc(sx + Math.cos(a)*r*0.8, sy - r*0.5 + Math.sin(a)*r*0.3, 1.5, 0, Math.PI*2); ctx.fill();
      }
      break;
    }
    case "plant": {
      // trunk
      ctx.fillStyle = "#3a2010";
      ctx.fillRect(sx - r*0.3, sy - r*0.2, r*0.6, r*1.1);
      ctx.strokeStyle = "#1a0f06"; ctx.strokeRect(sx - r*0.3, sy - r*0.2, r*0.6, r*1.1);
      // face on trunk
      ctx.fillStyle = "#f0e040";
      ctx.beginPath(); ctx.arc(sx - r*0.12, sy + r*0.3, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.12, sy + r*0.3, 1.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.fillRect(sx - r*0.14, sy + r*0.28, 0.6, 1.3); ctx.fillRect(sx + r*0.1, sy + r*0.28, 0.6, 1.3);
      ctx.strokeStyle = "#000"; ctx.beginPath(); ctx.arc(sx, sy + r*0.55, r*0.18, 0.1, Math.PI-0.1); ctx.stroke();
      // foliage
      ctx.fillStyle = shade(col, -20);
      ctx.beginPath(); ctx.arc(sx, sy - r*0.4, r*0.85, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx - r*0.3, sy - r*0.5, r*0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.3, sy - r*0.45, r*0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy - r*0.75, r*0.45, 0, Math.PI*2); ctx.fill();
      // arms (branches)
      ctx.strokeStyle = "#3a2010"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx - r*0.3, sy + r*0.2); ctx.lineTo(sx - r*0.8, sy + r*0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + r*0.3, sy + r*0.2); ctx.lineTo(sx + r*0.8, sy + r*0.1); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
    case "ghost": {
      // ethereal body
      const bob2 = Math.sin(time*2 + e.id)*3;
      ctx.globalAlpha = 0.85;
      const grd = ctx.createRadialGradient(sx, sy + bob2, r*0.2, sx, sy + bob2, r*1.1);
      grd.addColorStop(0, shade(col, 40));
      grd.addColorStop(1, "rgba(60,60,100,0.05)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(sx - r, sy + r + bob2);
      ctx.quadraticCurveTo(sx - r, sy - r + bob2, sx, sy - r + bob2);
      ctx.quadraticCurveTo(sx + r, sy - r + bob2, sx + r, sy + r + bob2);
      // wavy bottom
      ctx.quadraticCurveTo(sx + r*0.5, sy + r*0.7 + bob2, sx, sy + r + bob2);
      ctx.quadraticCurveTo(sx - r*0.5, sy + r*0.7 + bob2, sx - r, sy + r + bob2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // eyes glowing
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(sx - r*0.25, sy - r*0.2 + bob2, r*0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.25, sy - r*0.2 + bob2, r*0.18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = e.isBoss ? "#ff4060" : "#80e0ff";
      ctx.beginPath(); ctx.arc(sx - r*0.25, sy - r*0.2 + bob2, r*0.09, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.25, sy - r*0.2 + bob2, r*0.09, 0, Math.PI*2); ctx.fill();
      // mouth
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.ellipse(sx, sy + r*0.15 + bob2, r*0.15, r*0.22, 0, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "knight": {
      // armor body
      ctx.fillStyle = "#7080a0";
      ctx.fillRect(sx - r*0.55, sy - r*0.3, r*1.1, r*1.2);
      ctx.fillStyle = "#9aa8c0";
      ctx.fillRect(sx - r*0.5, sy - r*0.25, r*1.0, r*0.7);
      // shoulder pads
      ctx.fillStyle = "#5a6a8a";
      ctx.beginPath(); ctx.ellipse(sx - r*0.7, sy - r*0.2, r*0.3, r*0.25, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*0.7, sy - r*0.2, r*0.3, r*0.25, 0, 0, Math.PI*2); ctx.fill();
      // helmet
      ctx.fillStyle = "#5a6a8a";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.7, r*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillRect(sx - r*0.3, sy - r*0.75, r*0.6, r*0.15);
      ctx.fillStyle = e.isBoss ? "#ff4060" : "#80e0ff";
      ctx.fillRect(sx - r*0.22, sy - r*0.72, r*0.15, r*0.08);
      ctx.fillRect(sx + r*0.07, sy - r*0.72, r*0.15, r*0.08);
      // plume
      ctx.fillStyle = "#c04040";
      ctx.beginPath(); ctx.moveTo(sx, sy - r*1.2); ctx.lineTo(sx + r*0.3, sy - r*0.8); ctx.lineTo(sx - r*0.3, sy - r*0.8); ctx.fill();
      // sword
      ctx.strokeStyle = "#e0e8f0"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(sx + r*0.6, sy + r*0.2); ctx.lineTo(sx + r*1.3, sy - r*0.7); ctx.stroke();
      ctx.strokeStyle = "#8a5010"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + r*0.5, sy + r*0.3); ctx.lineTo(sx + r*0.7, sy + r*0.1); ctx.stroke();
      // shield
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(sx - r*0.7, sy + r*0.3, r*0.35, r*0.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#f0d040"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx - r*0.7, sy - r*0.1); ctx.lineTo(sx - r*0.7, sy + r*0.7);
      ctx.moveTo(sx - r*0.95, sy + r*0.3); ctx.lineTo(sx - r*0.45, sy + r*0.3); ctx.stroke();
      break;
    }
    case "mage": {
      // robe
      ctx.fillStyle = shade(col, -30);
      ctx.beginPath();
      ctx.moveTo(sx - r*0.7, sy + r);
      ctx.lineTo(sx - r*0.4, sy - r*0.2);
      ctx.lineTo(sx + r*0.4, sy - r*0.2);
      ctx.lineTo(sx + r*0.7, sy + r);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx - r*0.5, sy + r);
      ctx.lineTo(sx - r*0.3, sy);
      ctx.lineTo(sx + r*0.3, sy);
      ctx.lineTo(sx + r*0.5, sy + r);
      ctx.closePath(); ctx.fill();
      // hood shadow face
      ctx.fillStyle = shade(col, -40);
      ctx.beginPath(); ctx.arc(sx, sy - r*0.4, r*0.4, 0, Math.PI*2); ctx.fill();
      // hat/hood point
      ctx.fillStyle = shade(col, -30);
      ctx.beginPath(); ctx.moveTo(sx - r*0.4, sy - r*0.3); ctx.lineTo(sx, sy - r*1.3); ctx.lineTo(sx + r*0.4, sy - r*0.3); ctx.fill();
      // eyes
      ctx.fillStyle = e.isBoss ? "#ff2040" : "#80e0ff";
      ctx.fillRect(sx - r*0.2, sy - r*0.42, 3, 2);
      ctx.fillRect(sx + r*0.05, sy - r*0.42, 3, 2);
      // staff with glow orb
      ctx.strokeStyle = "#3a2010"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + r*0.6, sy - r*0.8); ctx.lineTo(sx + r*0.7, sy + r*0.8); ctx.stroke();
      const pulse = 0.6 + Math.sin(time*3 + e.id)*0.3;
      const grd = ctx.createRadialGradient(sx + r*0.6, sy - r*0.9, 1, sx + r*0.6, sy - r*0.9, r*0.6);
      grd.addColorStop(0, "#fff");
      grd.addColorStop(0.4, col);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.globalAlpha = pulse;
      ctx.beginPath(); ctx.arc(sx + r*0.6, sy - r*0.9, r*0.6, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx + r*0.6, sy - r*0.9, r*0.18, 0, Math.PI*2); ctx.fill();
      break;
    }
    case "orc": {
      // stocky humanoid
      ctx.fillStyle = "#3a5a3a";
      ctx.fillRect(sx - r*0.7, sy - r*0.2, r*1.4, r*1.2);
      ctx.fillStyle = "#5a7a4a";
      ctx.fillRect(sx - r*0.6, sy - r*0.15, r*1.2, r*0.6);
      // head
      ctx.fillStyle = "#5a7a4a";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.6, r*0.5, 0, Math.PI*2); ctx.fill();
      // tusks
      ctx.fillStyle = "#f0e0c0";
      ctx.beginPath(); ctx.moveTo(sx - r*0.2, sy - r*0.4); ctx.lineTo(sx - r*0.22, sy - r*0.2); ctx.lineTo(sx - r*0.1, sy - r*0.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + r*0.1, sy - r*0.4); ctx.lineTo(sx + r*0.22, sy - r*0.2); ctx.lineTo(sx + r*0.2, sy - r*0.4); ctx.fill();
      // eyes
      ctx.fillStyle = "#ff4040";
      ctx.beginPath(); ctx.arc(sx - r*0.18, sy - r*0.65, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + r*0.18, sy - r*0.65, 1.5, 0, Math.PI*2); ctx.fill();
      // eyebrows
      ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx - r*0.3, sy - r*0.8); ctx.lineTo(sx - r*0.05, sy - r*0.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + r*0.3, sy - r*0.8); ctx.lineTo(sx + r*0.05, sy - r*0.75); ctx.stroke();
      ctx.lineWidth = 1;
      // club
      ctx.fillStyle = "#5a3010";
      ctx.fillRect(sx + r*0.7, sy - r*0.5, r*0.3, r*0.9);
      ctx.strokeStyle = "#2a1408"; ctx.strokeRect(sx + r*0.7, sy - r*0.5, r*0.3, r*0.9);
      // spikes
      ctx.fillStyle = "#8a8a94";
      for (let i = 0; i < 2; i++) {
        ctx.beginPath(); ctx.moveTo(sx + r*0.7, sy - r*0.3 + i*r*0.3); ctx.lineTo(sx + r*0.55, sy - r*0.2 + i*r*0.3); ctx.lineTo(sx + r*0.7, sy - r*0.1 + i*r*0.3); ctx.fill();
      }
      break;
    }
    case "bandit":
    default: {
      // human-ish
      ctx.fillStyle = shade(col, -25);
      ctx.fillRect(sx - r*0.5, sy - r*0.2, r, r*1.1);
      ctx.fillStyle = col;
      ctx.fillRect(sx - r*0.45, sy - r*0.15, r*0.9, r*0.55);
      // head
      ctx.fillStyle = "#d09060";
      ctx.beginPath(); ctx.arc(sx, sy - r*0.55, r*0.4, 0, Math.PI*2); ctx.fill();
      // hair/hood
      ctx.fillStyle = shade(col, -40);
      ctx.beginPath(); ctx.arc(sx, sy - r*0.7, r*0.4, Math.PI + 0.3, -0.3); ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(sx - r*0.18, sy - r*0.55, 2, 2);
      ctx.fillRect(sx + r*0.05, sy - r*0.55, 2, 2);
      // mask/scarf
      ctx.fillStyle = shade(col, -50);
      ctx.fillRect(sx - r*0.28, sy - r*0.4, r*0.55, r*0.15);
      // weapon (dagger)
      ctx.strokeStyle = "#c0c0d0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + r*0.55, sy + r*0.1); ctx.lineTo(sx + r*1.0, sy - r*0.3); ctx.stroke();
      ctx.strokeStyle = "#5a3010"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx + r*0.5, sy + r*0.2); ctx.lineTo(sx + r*0.6, sy + r*0.05); ctx.stroke();
      ctx.lineWidth = 1;
      break;
    }
  }

  // hit flash overlay
  if (e.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, e.hitFlash*2)})`;
    ctx.beginPath(); ctx.arc(sx, sy, r*1.1, 0, Math.PI*2); ctx.fill();
  }
}

function drawLoot(ctx: CanvasRenderingContext2D, sx: number, sy: number, iconChar: string, color: string, time: number) {
  const pulse = 4 + Math.sin(time * 5) * 2;
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(sx, sy + 8, 8, 3, 0, 0, Math.PI*2); ctx.fill();
  // aura
  const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, 14 + pulse);
  grd.addColorStop(0, color);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(sx, sy, 14 + pulse, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // container based on icon
  const bob = Math.sin(time*3) * 2;
  if (iconChar === "⚔") {
    // sword
    ctx.strokeStyle = "#e0e8f0"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx - 6, sy + 6 + bob); ctx.lineTo(sx + 6, sy - 6 + bob); ctx.stroke();
    ctx.strokeStyle = "#8a5010"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx - 7, sy + 8 + bob); ctx.lineTo(sx - 4, sy + 5 + bob); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx - 6, sy + 6 + bob, 2, 0, Math.PI*2); ctx.fill();
  } else if (iconChar === "🛡") {
    // shield
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(sx, sy - 7 + bob); ctx.lineTo(sx + 6, sy - 4 + bob); ctx.lineTo(sx + 5, sy + 5 + bob); ctx.lineTo(sx, sy + 8 + bob); ctx.lineTo(sx - 5, sy + 5 + bob); ctx.lineTo(sx - 6, sy - 4 + bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#f0d040"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#f0d040"; ctx.fillRect(sx - 0.5, sy - 4 + bob, 1, 9); ctx.fillRect(sx - 4, sy - 0.5 + bob, 9, 1);
  } else if (iconChar === "🧪" || iconChar === "❤") {
    // potion
    ctx.fillStyle = "#3a2010";
    ctx.fillRect(sx - 3, sy - 8 + bob, 6, 3);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(sx - 5, sy - 5 + bob); ctx.lineTo(sx + 5, sy - 5 + bob); ctx.lineTo(sx + 6, sy + 8 + bob); ctx.lineTo(sx - 6, sy + 8 + bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(sx - 3, sy + bob, 1, 5);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
    ctx.strokeRect(sx - 3, sy - 8 + bob, 6, 3);
    ctx.beginPath(); ctx.moveTo(sx - 5, sy - 5 + bob); ctx.lineTo(sx + 5, sy - 5 + bob); ctx.lineTo(sx + 6, sy + 8 + bob); ctx.lineTo(sx - 6, sy + 8 + bob); ctx.closePath(); ctx.stroke();
  } else {
    // gem/coin
    ctx.fillStyle = shade(color, -30);
    ctx.beginPath(); ctx.arc(sx, sy + bob, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(sx, sy + bob, 5.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.arc(sx - 1.5, sy - 1.5 + bob, 1.8, 0, Math.PI*2); ctx.fill();
  }
  // sparkles
  for (let i = 0; i < 3; i++) {
    const a = time * 2 + i * 2.1;
    const sp = 8 + Math.sin(a) * 4;
    const sxs = sx + Math.cos(a) * sp, sys = sy + Math.sin(a) * sp;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(sxs - 0.8, sys - 0.8, 1.6, 1.6);
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, sx: number, sy: number, fromPlayer: boolean, time: number) {
  const core = fromPlayer ? "#8ecfff" : "#ff8060";
  // outer glow
  const grd = ctx.createRadialGradient(sx, sy, 1, sx, sy, 10);
  grd.addColorStop(0, core);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI*2); ctx.fill();
  // core
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI*2); ctx.fill();
  // white center
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, Math.PI*2); ctx.fill();
  // trail sparkles
  for (let i = 0; i < 2; i++) {
    const a = time * 20 + i * 3;
    ctx.fillStyle = `rgba(255,255,255,${0.5 - i*0.2})`;
    ctx.fillRect(sx + Math.cos(a)*3, sy + Math.sin(a)*3, 1.2, 1.2);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: import("./engine").Player, psx: number, psy: number, time: number) {
  const bob = Math.sin(time*4) * 0.6;
  // Try class sprite first
  const clsSlug = CLASS_INFO[p.cls]?.sprite ?? "guerreiro";
  const sprite = getSpriteBySlug(clsSlug);
  if (sprite) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath(); ctx.ellipse(psx, psy + 14, 12, 4, 0, 0, Math.PI*2); ctx.fill();
    const size = 36;
    if (p.hitFlash > 0) { ctx.globalAlpha = 0.7; }
    ctx.drawImage(sprite, psx - size/2, psy - size/2 + bob, size, size);
    ctx.globalAlpha = 1;
    return;
  }
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.ellipse(psx, psy + 14, 12, 4, 0, 0, Math.PI*2); ctx.fill();
  // cape
  const capeSway = Math.sin(time*2)*2;
  ctx.fillStyle = "#7a1818";
  ctx.beginPath();
  ctx.moveTo(psx - 7, psy - 8);
  ctx.lineTo(psx + 7, psy - 8);
  ctx.lineTo(psx + 9 + capeSway, psy + 12 + bob);
  ctx.lineTo(psx - 9 + capeSway, psy + 12 + bob);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#4a1010";
  ctx.beginPath();
  ctx.moveTo(psx - 6, psy - 6);
  ctx.lineTo(psx, psy + 10 + bob);
  ctx.lineTo(psx - 8 + capeSway, psy + 12 + bob);
  ctx.closePath(); ctx.fill();
  // legs
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(psx - 6, psy + 6 + bob, 4, 8);
  ctx.fillRect(psx + 2, psy + 6 + bob, 4, 8);
  ctx.fillStyle = "#1a0f08";
  ctx.fillRect(psx - 7, psy + 12 + bob, 6, 3);
  ctx.fillRect(psx + 1, psy + 12 + bob, 6, 3);
  // torso armor
  ctx.fillStyle = p.hitFlash > 0 ? "#fff" : "#8090a8";
  ctx.fillRect(psx - 8, psy - 8 + bob, 16, 16);
  ctx.fillStyle = "#5a6a80";
  ctx.fillRect(psx - 8, psy + bob, 16, 8);
  // chest plate detail
  ctx.strokeStyle = "#3a4a60"; ctx.lineWidth = 1;
  ctx.strokeRect(psx - 8, psy - 8 + bob, 16, 16);
  ctx.beginPath(); ctx.moveTo(psx, psy - 8 + bob); ctx.lineTo(psx, psy + 8 + bob); ctx.stroke();
  // belt
  ctx.fillStyle = "#3a2010"; ctx.fillRect(psx - 8, psy + 4 + bob, 16, 2);
  ctx.fillStyle = "#f0c040"; ctx.fillRect(psx - 2, psy + 4 + bob, 4, 2);
  // shoulder pauldrons
  ctx.fillStyle = "#5a6a80";
  ctx.beginPath(); ctx.arc(psx - 9, psy - 5 + bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(psx + 9, psy - 5 + bob, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#7080a0";
  ctx.beginPath(); ctx.arc(psx - 9, psy - 6 + bob, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(psx + 9, psy - 6 + bob, 2, 0, Math.PI*2); ctx.fill();
  // head
  ctx.fillStyle = "#d8a878";
  ctx.beginPath(); ctx.arc(psx, psy - 14 + bob, 6, 0, Math.PI*2); ctx.fill();
  // hair
  ctx.fillStyle = "#3a2010";
  ctx.beginPath(); ctx.arc(psx, psy - 17 + bob, 5.5, Math.PI, 0); ctx.fill();
  // eyes
  ctx.fillStyle = "#000";
  ctx.fillRect(psx - 3, psy - 14 + bob, 1.5, 1.8);
  ctx.fillRect(psx + 1.5, psy - 14 + bob, 1.5, 1.8);
  // shine
  ctx.fillStyle = "#fff";
  ctx.fillRect(psx - 2.5, psy - 14 + bob, 0.6, 0.6);
  ctx.fillRect(psx + 2, psy - 14 + bob, 0.6, 0.6);
  // mouth
  ctx.fillStyle = "#7a3020";
  ctx.fillRect(psx - 1.5, psy - 11 + bob, 3, 0.8);
  // weapon
  const fl = Math.hypot(p.facing.x, p.facing.y) || 1;
  const fx = p.facing.x / fl, fy = p.facing.y / fl;
  const wCol = p.equipped.weapon?.color ?? "#e0e8f0";
  // handle
  ctx.strokeStyle = "#5a3010"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(psx + fx*4, psy + fy*4 + bob); ctx.lineTo(psx + fx*10, psy + fy*10 + bob); ctx.stroke();
  // blade
  ctx.strokeStyle = wCol; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(psx + fx*10, psy + fy*10 + bob); ctx.lineTo(psx + fx*22, psy + fy*22 + bob); ctx.stroke();
  // blade highlight
  ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(psx + fx*12, psy + fy*12 + bob); ctx.lineTo(psx + fx*20, psy + fy*20 + bob); ctx.stroke();
  ctx.lineWidth = 1;
}

// -------- main render --------
export function render(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  const camX = g.camera.x - w / 2;
  const camY = g.camera.y - h / 2;
  const inCave = !!g.activeCaveBiome;
  const inGrand = g.activeGrandFloor > 0;
  const biomeLook = !inCave && !inGrand || g.activeFloor === 4;
  const cave = inCave ? caveTint(g.activeCaveBiome!) : null;

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(g.activeMap.size, Math.ceil((camX + w) / TILE) + 1);
  const y1 = Math.min(g.activeMap.size, Math.ceil((camY + h) / TILE) + 1);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const t = g.activeMap.get(x, y);
      const sx = x * TILE - camX, sy = y * TILE - camY;
      if (inGrand) {
        drawDungeonTile(ctx, sx, sy, t.kind, x, y, g.time, g.activeGrandFloor);
      } else if (biomeLook) {
        if (t.kind === 1) drawWaterTile(ctx, sx, sy, x, y, g.time);
        else if (t.kind === 3) drawSandTile(ctx, sx, sy, t.biome, x, y);
        else if (t.kind === 2) drawMountainTile(ctx, sx, sy, t.biome, x, y);
        else if (t.kind === 4) drawTreeTile(ctx, sx, sy, t.biome, x, y, g.time);
        else if (t.kind === 5) { drawGrassTile(ctx, sx, sy, t.biome, x, y, g.time); drawCity(ctx, sx, sy, t.biome, g.time); }
        else if (t.kind === 6 || t.kind === 7) { drawGrassTile(ctx, sx, sy, t.biome, x, y, g.time); drawStair(ctx, sx, sy, t.kind, g.time); }
        else if (t.kind >= 8 && t.kind <= 16) drawCityTile(ctx, sx, sy, t.kind, x, y, g.time);
        else { drawGrassTile(ctx, sx, sy, t.biome, x, y, g.time); drawDecor(ctx, sx, sy, t.biome, x, y, g.time); }
      } else {
        // cave rendering — floor + wall + accents
        const floor = cave!.floor;
        const wall = cave!.wall;
        const grad = ctx.createRadialGradient(sx + 16, sy + 16, 2, sx + 16, sy + 16, 22);
        grad.addColorStop(0, shade(floor, 10));
        grad.addColorStop(1, shade(floor, -8));
        ctx.fillStyle = grad; ctx.fillRect(sx, sy, TILE, TILE);
        // cracks in floor
        if (hashXY(x, y, 7) > 0.85) {
          ctx.strokeStyle = shade(floor, -25); ctx.lineWidth = 1;
          const cx = sx + 4 + hashXY(x,y,1)*24, cy = sy + 4 + hashXY(x,y,2)*24;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 6, cy + 4); ctx.lineTo(cx + 3, cy + 9); ctx.stroke();
        }
        if (t.kind === 2) {
          ctx.fillStyle = shade(wall, -15);
          ctx.beginPath(); ctx.moveTo(sx + 4, sy + 30); ctx.lineTo(sx + 16, sy + 4); ctx.lineTo(sx + 28, sy + 30); ctx.closePath(); ctx.fill();
          ctx.fillStyle = wall;
          ctx.beginPath(); ctx.moveTo(sx + 8, sy + 30); ctx.lineTo(sx + 16, sy + 10); ctx.lineTo(sx + 24, sy + 30); ctx.closePath(); ctx.fill();
          ctx.fillStyle = cave!.accent;
          ctx.globalAlpha = 0.4;
          ctx.fillRect(sx + 15, sy + 8, 3, 6);
          ctx.globalAlpha = 1;
          ctx.fillStyle = shade(cave!.accent, -10);
          ctx.fillRect(sx + 12, sy + 6, 1, 4);
          ctx.fillRect(sx + 20, sy + 8, 1, 3);
        } else if (t.kind === 6 || t.kind === 7) {
          drawStair(ctx, sx, sy, t.kind, g.time);
        } else if (hashXY(x, y, 999) > 0.94) {
          const kind = Math.floor(hashXY(x,y,998)*3);
          if (kind === 0) {
            ctx.fillStyle = shade(wall, 10);
            ctx.beginPath(); ctx.moveTo(sx + 12, sy + 24); ctx.lineTo(sx + 16, sy + 14); ctx.lineTo(sx + 20, sy + 24); ctx.closePath(); ctx.fill();
          } else if (kind === 1) {
            ctx.fillStyle = "#e0d8c0";
            ctx.fillRect(sx + 10, sy + 18, 12, 2);
            ctx.beginPath(); ctx.arc(sx + 10, sy + 19, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 22, sy + 19, 2, 0, Math.PI*2); ctx.fill();
          } else {
            ctx.fillStyle = "#3a2010"; ctx.fillRect(sx + 15, sy + 14, 2, 10);
            const fl = 0.6 + Math.sin(g.time*8 + x + y)*0.35;
            ctx.fillStyle = `rgba(255,180,60,${0.5 + fl*0.3})`;
            ctx.beginPath(); ctx.arc(sx + 16, sy + 12, 4 + fl, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#fff8c0";
            ctx.beginPath(); ctx.arc(sx + 16, sy + 12, 1.5, 0, Math.PI*2); ctx.fill();
          }
        }
      }
    }
  }

  // city labels (overworld only)
  if (!inCave && !inGrand) {
    for (const c of g.world.cities) {
      const sx = c.x - camX, sy = c.y - camY;
      if (sx < -80 || sy < -40 || sx > w + 80 || sy > h + 40) continue;
      ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(sx - 42, sy - 46, 84, 14);
      ctx.strokeStyle = "#f0c040"; ctx.strokeRect(sx - 42, sy - 46, 84, 14);
      ctx.fillStyle = "#f0e0a0";
      ctx.fillText(c.name, sx, sy - 36);
    }
  }

  // loot
  for (const l of g.loot) {
    const sx = l.pos.x - camX, sy = l.pos.y - camY;
    drawLoot(ctx, sx, sy, l.item.icon, l.item.color, g.time);
  }

  // veins (mining nodes)
  if (g.veins) {
    for (const v of g.veins) {
      const sx = v.pos.x - camX, sy = v.pos.y - camY;
      if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
      drawVein(ctx, v, sx, sy, g.time);
    }
  }

  // necromancer minions
  if (g.player.minions && g.player.minions.length) {
    for (const m of g.player.minions) {
      const sx = m.pos.x - camX, sy = m.pos.y - camY;
      if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
      drawSkeleton(ctx, sx, sy, g.time, m.hp / m.maxHp);
    }
  }


  // enemies
  for (const e of g.enemies) {
    const sx = e.pos.x - camX, sy = e.pos.y - camY;
    if (sx < -60 || sy < -60 || sx > w + 60 || sy > h + 60) continue;
    drawEnemy(ctx, e, sx, sy, g.time);
    // hp bar
    const bw = e.radius * 2 + (e.isBoss ? 20 : 4), bh = e.isBoss ? 6 : 4;
    const bx = sx - bw / 2, by = sy - e.radius - 14;
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
    if (e.isBoss) { hpGrad.addColorStop(0, "#ff2040"); hpGrad.addColorStop(1, "#c00020"); }
    else { hpGrad.addColorStop(0, "#40e060"); hpGrad.addColorStop(1, "#20a040"); }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx, by, (bw * e.hp) / e.maxHp, bh);
    if (e.isBoss) {
      ctx.fillStyle = "#f0b040"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
      ctx.fillText(e.name, sx, sy - e.radius - 18);
    } else {
      ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.textAlign = "center";
      ctx.fillText(`Lv${e.level}`, sx, sy - e.radius - 18);
    }
  }

  // projectiles
  for (const pr of g.projectiles) {
    const sx = pr.pos.x - camX, sy = pr.pos.y - camY;
    drawProjectile(ctx, sx, sy, pr.from === "player", g.time);
  }

  // player
  const p = g.player;
  drawPlayer(ctx, p, p.pos.x - camX, p.pos.y - camY, g.time);

  ctx.textAlign = "center"; ctx.font = "bold 12px monospace";
  for (const f of g.floaters) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillText(f.text, f.x - camX + 1, f.y - camY + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x - camX, f.y - camY);
  }

  // falling meteors (event)
  if (g.meteors && g.meteors.length) {
    for (const m of g.meteors) {
      const sx = m.x - camX, sy = m.y - camY;
      // fire trail
      ctx.fillStyle = "rgba(255,140,60,0.5)";
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        ctx.fillRect(sx - 3 + Math.sin(g.time * 20 + i) * 2, sy - i * 14, 6 - t * 5, 4);
      }
      // meteor body
      ctx.fillStyle = "#ff6030";
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff080";
      ctx.beginPath(); ctx.arc(sx - 2, sy - 2, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // day/night tint (skip in caves) + cave vignette + blood moon
  if (inCave && g.activeFloor !== 4) {
    const grd = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, Math.max(w, h) * 0.7);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  } else {
    const t01 = ((g.time / 120) % 1);
    const night = Math.max(0, Math.sin(t01 * Math.PI * 2)) * 0.35;
    if (night > 0) { ctx.fillStyle = `rgba(0,0,40,${night})`; ctx.fillRect(0, 0, w, h); }
  }
  if (g.activeEvent?.kind === "bloodMoon") {
    ctx.fillStyle = "rgba(180,20,40,0.28)"; ctx.fillRect(0, 0, w, h);
    // moon
    ctx.fillStyle = "#ff4060";
    ctx.beginPath(); ctx.arc(w - 80, 90, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a01020";
    ctx.beginPath(); ctx.arc(w - 70, 82, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w - 92, 100, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (g.activeEvent?.kind === "earthquake") {
    const sh = Math.sin(g.time * 40) * 3;
    ctx.fillStyle = "rgba(120,80,20,0.15)"; ctx.fillRect(sh, sh, w, h);
  }

  drawHUD(ctx, g, w, h);
  if (g.panel === "inventory") drawInventory(ctx, g, w, h);
  else if (g.panel === "stats") drawStats(ctx, g, w, h);
  else if (g.panel === "help") drawHelp(ctx, g, w, h);
  else if (g.panel === "map") drawWorldMap(ctx, g, w, h);
  else if (g.panel === "mining") drawMining(ctx, g, w, h);
  else if (g.panel === "crafting") drawCrafting(ctx, g, w, h);
  if (g.paused) {
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff"; ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
    ctx.fillText("PAUSADO", w / 2, h / 2);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  const p = g.player;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(10, 10, 280, 110);
  ctx.strokeStyle = "#f0c040"; ctx.strokeRect(10, 10, 280, 110);
  ctx.strokeStyle = "#333"; ctx.strokeRect(11, 11, 278, 108);

  ctx.textAlign = "left"; ctx.font = "bold 14px monospace"; ctx.fillStyle = "#f0e0a0";
  ctx.fillText(`Nível ${p.level}`, 20, 30);
  ctx.fillStyle = "#f0c040";
  ctx.fillText(`${p.gold}g`, 220, 30);

  drawBar(ctx, 20, 40, 260, 14, p.hp / p.maxHp, "#c03030", "#3a0a0a", `HP ${Math.ceil(p.hp)}/${p.maxHp}`);
  drawBar(ctx, 20, 58, 260, 12, p.mp / p.maxMp, "#3060c0", "#0a1a3a", `MP ${Math.floor(p.mp)}/${p.maxMp}`);
  drawBar(ctx, 20, 74, 260, 8, p.xp / p.xpNext, "#f0b040", "#3a2a08", ``);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#ccc";
  ctx.fillText(`XP ${p.xp}/${p.xpNext}   ATK ${p.atk()}   DEF ${p.def()}`, 20, 96);
  let regionName = "—";
  if (g.activeCaveBiome) {
    const b = BIOMES.find(bb => bb.id === g.activeCaveBiome!);
    if (b) regionName = b.caveTheme.label;
  } else {
    const t = g.activeMap.get(Math.floor(p.pos.x / TILE), Math.floor(p.pos.y / TILE));
    const b = BIOMES.find(bb => bb.id === t.biome);
    if (b) regionName = b.name;
  }
  ctx.fillText(`Região: ${regionName}   Inimigos: ${g.enemies.length}   Kills: ${g.kills} (chefes ${g.bossKills})`, 20, 112);

  // skill bar bottom
  const sw = 56, gap = 6, total = p.skills.length * sw + (p.skills.length - 1) * gap;
  const sx0 = w / 2 - total / 2;
  for (let i = 0; i < p.skills.length; i++) {
    const s = p.skills[i];
    const x = sx0 + i * (sw + gap);
    const y = h - 66;
    const g2 = ctx.createLinearGradient(x, y, x, y + 56);
    g2.addColorStop(0, "rgba(40,40,60,0.9)");
    g2.addColorStop(1, "rgba(10,10,20,0.9)");
    ctx.fillStyle = g2; ctx.fillRect(x, y, sw, 56);
    ctx.strokeStyle = "#f0c040"; ctx.strokeRect(x, y, sw, 56);
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(s.key, x + sw / 2, y + 24);
    ctx.font = "9px monospace"; ctx.fillText(s.name, x + sw / 2, y + 38);
    ctx.fillStyle = "#8ecfff";
    ctx.fillText(`${s.cost}mp`, x + sw / 2, y + 50);
    if (s.cur > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(x, y + 56 - (s.cur / s.cd) * 56, sw, (s.cur / s.cd) * 56);
    }
  }

  let ly = h - 76;
  ctx.font = "12px monospace"; ctx.textAlign = "left";
  for (const l of g.log) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.6, l.life / 6)})`;
    ctx.fillRect(10, ly - 12, 460, 16);
    ctx.fillStyle = l.color;
    ctx.globalAlpha = Math.min(1, l.life / 3);
    ctx.fillText(l.text, 14, ly);
    ctx.globalAlpha = 1;
    ly -= 18;
  }

  ctx.font = "11px monospace"; ctx.textAlign = "right"; ctx.fillStyle = "#aaa";
  ctx.fillText("M=Mapa  I=Inventário  C=Atributos  H=Ajuda  P=Pausa  F5=Salvar", w - 12, 22);

  drawMinimap(ctx, g, w - 170, 36, 160, 160);
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ratio: number, color: string, bg: string, label: string) {
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, shade(color, 25));
  grd.addColorStop(1, shade(color, -15));
  ctx.fillStyle = grd; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
  // shine
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), Math.max(1, h/3));
  ctx.strokeStyle = "#000"; ctx.strokeRect(x, y, w, h);
  if (label) {
    ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2 + 1, y + h - 2);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + w / 2, y + h - 3);
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, g: GameState, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.strokeStyle = "#f0c040"; ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  const map = g.activeMap;
  const sz = map.size;
  const inCave = !!g.activeCaveBiome;
  const cave = inCave ? caveTint(g.activeCaveBiome!) : null;
  const img = ctx.getImageData(x, y, w, h);
  const parseHex = (c: string): [number, number, number] => [
    parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)
  ];
  const caveFloorC: [number, number, number] | null = cave ? parseHex(cave.floor) : null;
  const caveWallC: [number, number, number] | null = cave ? parseHex(cave.wall) : null;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const wx = Math.floor((px / w) * sz);
      const wy = Math.floor((py / h) * sz);
      const t = map.get(wx, wy);
      let col: [number, number, number] = [80, 80, 80];
      if (inCave && g.activeFloor !== 4) {
        col = t.kind === 2 ? caveWallC! : caveFloorC!;
      } else if (inCave && g.activeFloor === 4) {
        const b = BIOMES.find(bb => bb.id === g.activeCaveBiome!);
        if (t.kind === 2) col = [90, 90, 100];
        else if (t.kind === 1) col = [30, 60, 120];
        else if (b) col = parseHex(b.color);
      } else {
        if (t.kind === 1) col = [30, 60, 120];
        else if (t.kind === 2) col = [90, 90, 100];
        else {
          const b = BIOMES.find(bb => bb.id === t.biome);
          if (b) col = parseHex(b.color);
        }
      }
      const idx = (py * w + px) * 4;
      img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, x, y);

  const pulse = 0.5 + Math.sin(g.time * 4) * 0.5;
  for (const s of map.stairs) {
    const sx = x + (s.x / TILE / sz) * w;
    const sy = y + (s.y / TILE / sz) * h;
    ctx.save();
    ctx.globalAlpha = 0.35 + pulse * 0.35;
    ctx.fillStyle = "#f0d040";
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff060";
    ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const p = g.player;
  const pxm = x + (p.pos.x / TILE / sz) * w;
  const pym = y + (p.pos.y / TILE / sz) * h;
  ctx.fillStyle = "#fff"; ctx.fillRect(pxm - 2, pym - 2, 4, 4);

  ctx.fillStyle = "#f0d040"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
  ctx.fillText(inCave ? `${g.activeFloor}º ANDAR` : "OVERWORLD", x, y + h + 12);
}

// ===== Pixel-art modal shell (matches reference RPG UI) =====
type PanelId = "inventory" | "stats" | "help" | "map" | "mining" | "crafting";
type TabHit = { id: PanelId; rect: [number, number, number, number] };

function drawPixelFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // outer dim
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x + 6, y + 6, w, h);
  // outer black border
  ctx.fillStyle = "#0a0806";
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  // gold outer frame
  ctx.fillStyle = "#8a5a1a";
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = "#f0c040";
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = "#8a5a1a";
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  // inner dark panel
  ctx.fillStyle = "#1a120a";
  ctx.fillRect(x, y, w, h);
  // top highlight / bottom shadow for bevel
  ctx.fillStyle = "rgba(240,192,64,0.18)";
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, y + h - 2, w, 2);
}

function drawTabs(ctx: CanvasRenderingContext2D, g: GameState, x: number, y: number, w: number, active: PanelId) {
  const tabs: { id: PanelId; label: string }[] = [
    { id: "stats", label: "STATS" },
    { id: "inventory", label: "INVENT." },
    { id: "mining", label: "MINER." },
    { id: "crafting", label: "CRAFT" },
    { id: "help", label: "AJUDA" },
    { id: "map", label: "MAPA" },
  ];
  const tw = Math.floor(w / tabs.length);
  const th = 30;
  const hits: TabHit[] = [];
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  tabs.forEach((t, i) => {
    const tx = x + i * tw;
    const isActive = t.id === active;
    // base
    ctx.fillStyle = isActive ? "#f0c040" : "#2a1c10";
    ctx.fillRect(tx, y, tw - 2, th);
    // top bevel
    ctx.fillStyle = isActive ? "#fff0a0" : "#4a3420";
    ctx.fillRect(tx, y, tw - 2, 2);
    // bottom shadow
    ctx.fillStyle = isActive ? "#a8781c" : "#0a0604";
    ctx.fillRect(tx, y + th - 2, tw - 2, 2);
    // border
    ctx.strokeStyle = "#0a0604";
    ctx.strokeRect(tx + 0.5, y + 0.5, tw - 3, th - 1);
    // label
    ctx.fillStyle = isActive ? "#1a0a04" : "#c8a878";
    ctx.fillText(t.label, tx + (tw - 2) / 2, y + th / 2 + 1);
    hits.push({ id: t.id, rect: [tx, y, tw - 2, th] });
  });
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  (g as unknown as { _tabs?: TabHit[] })._tabs = hits;
}

function drawSlot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // outer dark
  ctx.fillStyle = "#0a0604";
  ctx.fillRect(x, y, s, s);
  // tan cell
  ctx.fillStyle = "#6a4a2a";
  ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
  ctx.fillStyle = "#8a6438";
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  // top highlight
  ctx.fillStyle = "#b08858";
  ctx.fillRect(x + 2, y + 2, s - 4, 1);
  ctx.fillRect(x + 2, y + 2, 1, s - 4);
  // bottom shadow
  ctx.fillStyle = "#3a2410";
  ctx.fillRect(x + 2, y + s - 3, s - 4, 1);
  ctx.fillRect(x + s - 3, y + 2, 1, s - 4);
}

function drawInventory(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  const bw = 560, bh = 400;
  const x = w / 2 - bw / 2, y = h / 2 - bh / 2;
  drawPixelFrame(ctx, x, y, bw, bh);
  drawTabs(ctx, g, x + 8, y + 8, bw - 16, "inventory");

  const p = g.player;
  // equipped strip
  const eqY = y + 52;
  ctx.fillStyle = "#c8a878"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
  ctx.fillText("EQUIPADOS", x + 16, eqY + 12);
  drawSlot(ctx, x + 16, eqY + 20, 40);
  drawSlot(ctx, x + 62, eqY + 20, 40);
  if (p.equipped.weapon) { ctx.fillStyle = p.equipped.weapon.color; ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.fillText(p.equipped.weapon.icon, x + 36, eqY + 47); }
  if (p.equipped.armor) { ctx.fillStyle = p.equipped.armor.color; ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.fillText(p.equipped.armor.icon, x + 82, eqY + 47); }
  ctx.textAlign = "left"; ctx.font = "10px monospace"; ctx.fillStyle = "#f0e0a0";
  ctx.fillText(p.equipped.weapon ? `${p.equipped.weapon.name} +${p.equipped.weapon.power}` : "sem arma", x + 112, eqY + 32);
  ctx.fillText(p.equipped.armor ? `${p.equipped.armor.name} +${p.equipped.armor.power}` : "sem armadura", x + 112, eqY + 50);
  ctx.fillStyle = "#c8a878"; ctx.font = "9px monospace";
  ctx.fillText("clique num item para usar/equipar/vender  •  I fecha", x + 16, y + bh - 12);

  // grid
  const cols = 8, rows = 4;
  const slot = 44;
  const gridW = cols * (slot + 2) - 2;
  const gx = x + (bw - gridW) / 2;
  const gy = eqY + 72;
  const grid = { x: gx, y: gy, cellW: slot + 2, cellH: slot + 2 };
  (g as unknown as { _invGrid?: typeof grid })._invGrid = grid;
  for (let i = 0; i < cols * rows; i++) {
    const cx = gx + (i % cols) * (slot + 2);
    const cy = gy + Math.floor(i / cols) * (slot + 2);
    drawSlot(ctx, cx, cy, slot);
    const it = p.inventory[i];
    if (it) {
      // rarity glow
      ctx.fillStyle = it.color + "40";
      ctx.fillRect(cx + 3, cy + 3, slot - 6, slot - 6);
      // icon
      ctx.fillStyle = it.color; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(it.icon, cx + slot / 2, cy + slot / 2);
      // power badge bottom-right
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "right";
      ctx.fillStyle = "#000"; ctx.fillRect(cx + slot - 16, cy + slot - 12, 14, 10);
      ctx.fillStyle = "#f0e0a0"; ctx.font = "bold 9px monospace";
      ctx.fillText(`+${it.power}`, cx + slot - 3, cy + slot - 4);
    }
  }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

function drawStats(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  const bw = 480, bh = 400;
  const x = w / 2 - bw / 2, y = h / 2 - bh / 2;
  drawPixelFrame(ctx, x, y, bw, bh);
  drawTabs(ctx, g, x + 8, y + 8, bw - 16, "stats");

  const p = g.player;
  const startY = y + 60;
  ctx.font = "bold 14px monospace"; ctx.fillStyle = "#f0c040"; ctx.textAlign = "left";
  ctx.fillText(`Nv ${p.level}   HP ${Math.round(p.hp)}/${p.maxHp}   MP ${Math.round(p.mp)}/${p.maxMp}`, x + 20, startY);
  ctx.font = "10px monospace"; ctx.fillStyle = "#c8a878";
  ctx.fillText(`Pontos disponíveis: ${p.attrPoints}    •    C fecha`, x + 20, startY + 18);

  const rows: Array<["str" | "agi" | "int" | "vit", string, string]> = [
    ["str", "FOR", "Força — dano corpo-a-corpo"],
    ["agi", "AGI", "Agilidade — reservada"],
    ["int", "INT", "Inteligência — MP e magia"],
    ["vit", "VIT", "Vitalidade — HP e defesa"],
  ];
  const grid = { x, y, rows: [] as Array<{ k: "str" | "agi" | "int" | "vit"; rect: [number, number, number, number] }> };
  rows.forEach((r, i) => {
    const yy = startY + 44 + i * 56;
    // row bg
    ctx.fillStyle = "#0f0906"; ctx.fillRect(x + 16, yy - 4, bw - 32, 46);
    ctx.strokeStyle = "#3a2410"; ctx.strokeRect(x + 16, yy - 4, bw - 32, 46);
    // stat chip
    ctx.fillStyle = "#f0c040"; ctx.fillRect(x + 22, yy + 2, 38, 32);
    ctx.fillStyle = "#8a5a1a"; ctx.fillRect(x + 22, yy + 30, 38, 4);
    ctx.fillStyle = "#1a0a04"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(r[1], x + 41, yy + 15);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    // value
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace";
    ctx.fillText(String(p.attr[r[0]]), x + 72, yy + 26);
    // desc
    ctx.fillStyle = "#c8a878"; ctx.font = "10px monospace";
    ctx.fillText(r[2], x + 108, yy + 26);
    // + button
    const bx = x + bw - 60, by = yy + 4, bwB = 40, bhB = 30;
    const active = p.attrPoints > 0;
    ctx.fillStyle = "#0a0604"; ctx.fillRect(bx - 1, by - 1, bwB + 2, bhB + 2);
    ctx.fillStyle = active ? "#3a8a3a" : "#3a2410"; ctx.fillRect(bx, by, bwB, bhB);
    ctx.fillStyle = active ? "#7ad078" : "#5a3a20"; ctx.fillRect(bx, by, bwB, 3);
    ctx.fillStyle = active ? "#1a4a1a" : "#1a0a04"; ctx.fillRect(bx, by + bhB - 3, bwB, 3);
    ctx.fillStyle = active ? "#fff" : "#8a6438"; ctx.font = "bold 18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", bx + bwB / 2, by + bhB / 2 + 1);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    grid.rows.push({ k: r[0], rect: [bx, by, bwB, bhB] });
  });
  (g as unknown as { _statsGrid?: typeof grid })._statsGrid = grid;
}

function drawHelp(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  const bw = 600, bh = 400;
  const x = w / 2 - bw / 2, y = h / 2 - bh / 2;
  drawPixelFrame(ctx, x, y, bw, bh);
  drawTabs(ctx, g, x + 8, y + 8, bw - 16, "help");

  ctx.font = "bold 14px monospace"; ctx.fillStyle = "#f0c040"; ctx.textAlign = "left";
  ctx.fillText("CONTROLES", x + 20, y + 66);
  ctx.font = "12px monospace"; ctx.fillStyle = "#e8d8a8";
  const lines = [
    "WASD / setas — mover           Shift — correr",
    "Mouse — mirar                  Clique — atacar",
    "1 Golpe Giratório   2 Raio Arcano   3 Cura   4 Investida",
    "I Inventário   C Atributos   H Ajuda   P Pausar   M Mapa",
    "F5 Salvar   F9 Carregar   F10 Apagar save",
    "",
    "Explore Asterion: 40 biomas procedurais.",
    "Cada bioma tem uma ESCADA ▼ (amarela no mapa)",
    "que leva a masmorras com chefes e loot raro.",
    "Pise na ESCADA ▲ para voltar ao overworld.",
  ];
  lines.forEach((l, i) => ctx.fillText(l, x + 20, y + 92 + i * 22));
}

const mapCache: WeakMap<GameState, ImageData> = new WeakMap();
function drawWorldMap(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  ctx.fillStyle = "rgba(0,0,0,0.94)"; ctx.fillRect(0, 0, w, h);
  drawTabs(ctx, g, w / 2 - 300, 10, 600, "map");
  ctx.fillStyle = "#f0e0a0"; ctx.font = "bold 22px monospace"; ctx.textAlign = "center";
  ctx.fillText("ASTERION — Mapa Múndi", w / 2, 68);
  ctx.font = "12px monospace"; ctx.fillStyle = "#c8a878";
  ctx.fillText("M ou Esc para fechar  •  amarelo = capital / escada  •  descoberto sem névoa", w / 2, 86);

  const margin = 70;
  const mapW = Math.min(w - margin * 2 - 260, h - margin * 2);
  const mapH = mapW;
  const mx = (w - mapW) / 2 - 100;
  const my = margin + 10;

  ctx.fillStyle = "#000"; ctx.fillRect(mx - 4, my - 4, mapW + 8, mapH + 8);
  ctx.strokeStyle = "#f0c040"; ctx.strokeRect(mx - 4, my - 4, mapW + 8, mapH + 8);

  let img = mapCache.get(g);
  if (!img || img.width !== mapW || img.height !== mapH) {
    img = ctx.createImageData(mapW, mapH);
    const sz = g.world.size;
    for (let py = 0; py < mapH; py++) {
      for (let px = 0; px < mapW; px++) {
        const wx = Math.floor((px / mapW) * sz);
        const wy = Math.floor((py / mapH) * sz);
        const t = g.world.get(wx, wy);
        let col = [90, 90, 90];
        if (t.kind === 1) col = [30, 60, 110];
        else if (t.kind === 2) col = [130, 130, 140];
        else if (t.kind === 3) col = [210, 170, 90];
        else if (t.kind === 4) col = [40, 90, 50];
        else if (t.kind === 5) col = [240, 220, 120];
        else if (t.kind === 6) col = [240, 210, 60];
        else {
          const b = BIOMES.find(bb => bb.id === t.biome);
          if (b) {
            const c = b.color;
            col = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
          }
        }
        const idx = (py * mapW + px) * 4;
        img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
      }
    }
    mapCache.set(g, img);
  }
  ctx.putImageData(img, mx, my);

  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mapW, mapH); ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const sz = g.world.size;
  const cellPx = mapW / 30;
  for (const c of g.world.cities) {
    if (g.discovered.has(c.biome)) continue;
    const cx = mx + (c.x / TILE / sz) * mapW;
    const cy = my + (c.y / TILE / sz) * mapH;
    ctx.beginPath(); ctx.arc(cx, cy, cellPx * 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.textAlign = "center"; ctx.font = "10px monospace";
  for (const c of g.world.cities) {
    const cx = mx + (c.x / TILE / g.world.size) * mapW;
    const cy = my + (c.y / TILE / g.world.size) * mapH;
    const known = g.discovered.has(c.biome);
    ctx.fillStyle = known ? "#f0c040" : "#666";
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.stroke();
    if (known) {
      ctx.fillStyle = "#fff";
      ctx.fillText(c.name, cx, cy - 5);
    }
  }

  const pulse = 0.5 + Math.sin(g.time * 4) * 0.5;
  for (const s of g.world.stairs) {
    if (!g.discovered.has(s.biome)) continue;
    const cx = mx + (s.x / TILE / g.world.size) * mapW;
    const cy = my + (s.y / TILE / g.world.size) * mapH;
    ctx.save();
    ctx.globalAlpha = 0.3 + pulse * 0.4;
    ctx.fillStyle = "#f0d040";
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff060";
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  const pxm = mx + (g.player.pos.x / TILE / g.world.size) * mapW;
  const pym = my + (g.player.pos.y / TILE / g.world.size) * mapH;
  ctx.fillStyle = "#00ff90";
  ctx.beginPath(); ctx.arc(pxm, pym, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;

  const lx = mx + mapW + 20, ly = my;
  ctx.textAlign = "left"; ctx.font = "bold 14px monospace"; ctx.fillStyle = "#fff";
  ctx.fillText(`Biomas (${BIOMES.length})`, lx, ly + 12);
  ctx.font = "10px monospace";
  BIOMES.forEach((b, i) => {
    const row = ly + 28 + i * 12;
    const known = g.discovered.has(b.id);
    ctx.fillStyle = b.color;
    ctx.fillRect(lx, row - 8, 10, 10);
    ctx.strokeStyle = "#000"; ctx.strokeRect(lx, row - 8, 10, 10);
    ctx.fillStyle = known ? "#fff" : "#666";
    ctx.fillText(`${String(i + 1).padStart(2, "0")}. ${known ? b.name : "???"} (Lv ${b.danger})`, lx + 16, row);
  });
}
