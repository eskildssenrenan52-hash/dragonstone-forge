import { sfx } from "./audio";
import { FIXED_BIOME_ANCHORS } from "./fixedWorld";
import {
  TILE,
  type GameState,
  type Item,
  type OreKind,
  type Vein,
  type VeinKind,
} from "./types";

export type Ore = {
  id: OreKind;
  name: string;
  color: string;
  hp: number;
  level: number;
  xp: number;
  gold: number;
  respawnSec: number;
  gem?: boolean;
  rare?: boolean;
};

export const ORES: Record<OreKind, Ore> = {
  pedra:              { id: "pedra",              name: "Pedra",              color: "#a0a0a8", hp: 50,    level: 1,   xp: 3,   gold: 1,   respawnSec: 40 },
  cobre:              { id: "cobre",              name: "Cobre",              color: "#c67848", hp: 90,    level: 5,   xp: 6,   gold: 3,   respawnSec: 55 },
  ferro_enferrujado:  { id: "ferro_enferrujado",  name: "Ferro Enferrujado",  color: "#8a6a4a", hp: 180,   level: 15,  xp: 10,  gold: 6,   respawnSec: 80 },
  madeira_antiga:     { id: "madeira_antiga",     name: "Madeira Antiga",     color: "#7a4e2d", hp: 60,    level: 3,   xp: 4,   gold: 2,   respawnSec: 45 },
  resina:             { id: "resina",             name: "Resina",             color: "#e0a040", hp: 45,    level: 8,   xp: 5,   gold: 3,   respawnSec: 60 },
  cristal_verde:      { id: "cristal_verde",      name: "Cristal Verde",      color: "#60d080", hp: 220,   level: 22,  xp: 14,  gold: 12,  respawnSec: 110, gem: true },
  quartzo:            { id: "quartzo",            name: "Quartzo",            color: "#e0d8d0", hp: 100,   level: 6,   xp: 7,   gold: 4,   respawnSec: 60 },
  ouro:               { id: "ouro",               name: "Ouro",               color: "#f0c040", hp: 500,   level: 45,  xp: 40,  gold: 60,  respawnSec: 150 },
  arenito:            { id: "arenito",            name: "Arenito",            color: "#d8b880", hp: 70,    level: 4,   xp: 4,   gold: 2,   respawnSec: 50 },
  obsidiana_negra:    { id: "obsidiana_negra",    name: "Obsidiana Negra",    color: "#524264", hp: 700,   level: 60,  xp: 55,  gold: 90,  respawnSec: 180 },
  vidro_vulcanico:    { id: "vidro_vulcanico",    name: "Vidro Vulcânico",    color: "#8e4a98", hp: 320,   level: 35,  xp: 25,  gold: 30,  respawnSec: 130 },
  gelo_eterno:        { id: "gelo_eterno",        name: "Gelo Eterno",        color: "#c0e8f8", hp: 260,   level: 30,  xp: 20,  gold: 20,  respawnSec: 120 },
  safira:             { id: "safira",             name: "Safira",             color: "#4080ff", hp: 600,   level: 55,  xp: 70,  gold: 130, respawnSec: 180, gem: true },
  cristal_congelado:  { id: "cristal_congelado",  name: "Cristal Congelado",  color: "#a0e0f0", hp: 380,   level: 40,  xp: 30,  gold: 45,  respawnSec: 150, gem: true },
  prata:              { id: "prata",              name: "Prata",              color: "#d8d8e8", hp: 350,   level: 32,  xp: 26,  gold: 40,  respawnSec: 140 },
  diamante_azul:      { id: "diamante_azul",      name: "Diamante Azul",      color: "#80c0ff", hp: 1400,  level: 110, xp: 220, gold: 480, respawnSec: 260, gem: true, rare: true },
  mithril:            { id: "mithril",            name: "Mithril",            color: "#c8e0ff", hp: 1200,  level: 90,  xp: 180, gold: 260, respawnSec: 240 },
  titanio:            { id: "titanio",            name: "Titânio",            color: "#a0a8b8", hp: 2200,  level: 120, xp: 320, gold: 380, respawnSec: 280 },
  adamantita:         { id: "adamantita",         name: "Adamantita",         color: "#ff4060", hp: 4000,  level: 150, xp: 520, gold: 720, respawnSec: 340, rare: true },
  lava_solidificada:  { id: "lava_solidificada",  name: "Lava Solidificada",  color: "#d84818", hp: 500,   level: 50,  xp: 45,  gold: 55,  respawnSec: 170 },
  rubi_flamejante:    { id: "rubi_flamejante",    name: "Rubi Flamejante",    color: "#ff5040", hp: 900,   level: 80,  xp: 120, gold: 220, respawnSec: 220, gem: true, rare: true },
  ebano:              { id: "ebano",              name: "Ébano",              color: "#523846", hp: 800,   level: 70,  xp: 90,  gold: 140, respawnSec: 200 },
  cristal_sombrio:    { id: "cristal_sombrio",    name: "Cristal Sombrio",    color: "#8d56ec", hp: 1400,  level: 100, xp: 220, gold: 340, respawnSec: 260, gem: true, rare: true },
  onix:               { id: "onix",               name: "Ônix",               color: "#36364c", hp: 1000,  level: 85,  xp: 150, gold: 240, respawnSec: 240, gem: true },
  alma_corrompida:    { id: "alma_corrompida",    name: "Alma Corrompida",    color: "#7b48db", hp: 1800,  level: 130, xp: 340, gold: 560, respawnSec: 300, rare: true },
  minerio_abissal:    { id: "minerio_abissal",    name: "Minério Abissal",    color: "#a838c8", hp: 5000,  level: 170, xp: 720, gold: 980, respawnSec: 380, rare: true },
  estelarium:         { id: "estelarium",         name: "Estelarium",         color: "#e0e0ff", hp: 300,   level: 1,   xp: 90,  gold: 200, respawnSec: 9999, rare: true },
  cristal_meteorico:  { id: "cristal_meteorico",  name: "Cristal Meteórico",  color: "#a0c0ff", hp: 600,   level: 1,   xp: 220, gold: 450, respawnSec: 9999, rare: true, gem: true },
};

export const BIOME_ORES: Record<number, OreKind[]> = {
  1:  ["pedra", "madeira_antiga", "cobre", "resina"],
  2:  ["pedra", "madeira_antiga", "cobre", "ferro_enferrujado", "resina", "cristal_verde"],
  8:  ["pedra", "madeira_antiga", "cobre", "cristal_verde", "resina"],
  25: ["pedra", "madeira_antiga", "cristal_verde", "resina"],
  3:  ["arenito", "quartzo", "ouro", "obsidiana_negra", "vidro_vulcanico"],
  23: ["arenito", "quartzo", "obsidiana_negra"],
  31: ["arenito", "quartzo", "prata"],
  6:  ["pedra", "gelo_eterno", "cristal_congelado", "prata"],
  7:  ["gelo_eterno", "safira", "cristal_congelado", "diamante_azul", "prata"],
  24: ["gelo_eterno", "cristal_congelado", "diamante_azul"],
  10: ["lava_solidificada", "obsidiana_negra", "rubi_flamejante", "mithril", "titanio", "adamantita"],
  19: ["lava_solidificada", "obsidiana_negra", "rubi_flamejante"],
  40: ["mithril", "titanio", "adamantita", "rubi_flamejante", "lava_solidificada"],
  4:  ["pedra", "cobre", "ferro_enferrujado", "mithril", "titanio", "prata"],
  13: ["quartzo", "safira", "cristal_congelado", "diamante_azul", "cristal_sombrio"],
  18: ["pedra", "ferro_enferrujado", "mithril", "onix", "ebano"],
  22: ["ebano", "cristal_sombrio", "onix", "alma_corrompida"],
  27: ["cristal_sombrio", "onix", "alma_corrompida", "minerio_abissal"],
  28: ["cristal_sombrio", "onix", "alma_corrompida", "minerio_abissal"],
  38: ["ebano", "alma_corrompida", "minerio_abissal"],
  39: ["ebano", "cristal_sombrio", "onix"],
};

function biomeOres(biome: number): OreKind[] {
  return BIOME_ORES[biome] ?? ["pedra", "cobre", "quartzo", "ferro_enferrujado"];
}

let veinSeq = 0;
export const _pendingMonsterSpawns: { x: number; y: number; count: number }[] = [];

export function miningStats(level: number) {
  const t = Math.min(1, level / 999);
  return {
    speed:        0.10 + t * 0.90,
    crit:         0.02 + t * 0.28,
    doubleChance: 0.05 + t * 0.35,
    tripleChance: 0.01 + t * 0.20,
    gemChance:    0.02 + t * 0.18,
    rareChance:   0.005 + t * 0.12,
    mapChance:    0.002 + t * 0.08,
    chestChance:  0.005 + t * 0.10,
  };
}

export const PICKAXE_TIERS: {
  tier: number;
  name: string;
  power: number;
  color: string;
  miningLevel: number;
}[] = [
  { tier: 1,  name: "Picareta de Madeira",    power: 4,   color: "#9a744e", miningLevel: 1 },
  { tier: 2,  name: "Picareta de Pedra",      power: 8,   color: "#9a9aa6", miningLevel: 10 },
  { tier: 3,  name: "Picareta de Ferro",      power: 14,  color: "#c8cdd8", miningLevel: 25 },
  { tier: 4,  name: "Picareta de Aço",        power: 22,  color: "#9cb0c4", miningLevel: 45 },
  { tier: 5,  name: "Picareta de Mithril",    power: 34,  color: "#c8e0ff", miningLevel: 70 },
  { tier: 6,  name: "Picareta de Titânio",    power: 52,  color: "#a8b2c4", miningLevel: 110 },
  { tier: 7,  name: "Picareta de Adamantita", power: 80,  color: "#ff4868", miningLevel: 160 },
  { tier: 8,  name: "Picareta Lendária",      power: 130, color: "#f0b040", miningLevel: 240 },
  { tier: 9,  name: "Picareta Divina",        power: 210, color: "#fff080", miningLevel: 400 },
  { tier: 10, name: "Picareta do Criador",    power: 340, color: "#ffffff", miningLevel: 700 },
];

let pickSeq = 0;
export function makePickaxe(tier: number): Item {
  const t = PICKAXE_TIERS.find(p => p.tier === tier) ?? PICKAXE_TIERS[0];
  pickSeq++;
  return {
    id: `pick_${pickSeq}`,
    name: t.name,
    kind: "weapon",
    rarity: "raro",
    power: t.power,
    icon: "⛏",
    color: t.color,
    isPickaxe: true,
    pickaxeTier: t.tier,
  };
}

// Seed initial fixed mineral deposits around each biome's quarry fields outside Asterion's walls
export function seedFixedWorldVeins(g: GameState) {
  g.veins = [];
  for (const anchor of FIXED_BIOME_ANCHORS) {
    const ores = biomeOres(anchor.biome);
    // Fixed quarry offsets relative to each biome anchor
    const offsets: Array<[number, number]> =
      anchor.biome === 1
        ? [[-22, -6], [-23, 8], [22, -5], [22, 9], [-8, -22], [10, 22]]
        : [[-6, -5], [7, -6], [-7, 6], [6, 7]];
    offsets.forEach(([ox, oy], idx) => {
      const tx = anchor.tx + ox;
      const ty = anchor.ty + oy;
      if (!g.world.inBounds(tx, ty) || g.world.isBlocked(tx, ty)) return;
      const ore = ores[idx % ores.length];
      const meta = ORES[ore];
      g.veins.push({
        id: ++veinSeq,
        pos: { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 },
        ore,
        hp: meta.hp,
        maxHp: meta.hp,
        remaining: meta.rare ? 2 : 4,
        kind: "normal",
        cooldown: 0,
        life: 999999,
        hitFlash: 0,
        biome: anchor.biome,
      });
    });
  }
}

function biomeAt(g: GameState, wx: number, wy: number): number {
  if (g.activeCaveBiome) return g.activeCaveBiome;
  const t = g.activeMap.get(Math.floor(wx / TILE), Math.floor(wy / TILE));
  return t.biome || 1;
}

export function spawnVeinNear(
  g: GameState,
  cx: number,
  cy: number,
  forceOre?: OreKind,
  forceKind?: VeinKind,
) {
  const maxCoord = g.activeMap.size * TILE;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 160 + Math.random() * 240;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    if (x < 48 || y < 48 || x > maxCoord - 48 || y > maxCoord - 48) continue;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (g.activeMap.isBlocked(tx, ty)) continue;
    const t = g.activeMap.get(tx, ty);
    if (t.kind === 13 || t.kind === 10 || t.kind === 16 || t.kind === 5 || t.kind === 6 || t.kind === 7) continue;

    const biome = biomeAt(g, x, y);
    const pool = biomeOres(biome);
    const ore = forceOre ?? pool[Math.floor(Math.random() * pool.length)];
    const meta = ORES[ore];
    const kind: VeinKind = forceKind ?? (meta.rare ? "teleporter" : "normal");

    g.veins.push({
      id: ++veinSeq,
      pos: { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 },
      ore,
      hp: meta.hp,
      maxHp: meta.hp,
      remaining: meta.rare ? 2 : 3 + Math.floor(Math.random() * 2),
      kind,
      cooldown: 0,
      life: 240,
      hitFlash: 0,
      biome,
    });
    return;
  }
}

export function giveOre(g: GameState, ore: OreKind, count: number) {
  g.player.materials[ore] = (g.player.materials[ore] ?? 0) + count;
}

export function tryMineAt(g: GameState, wx: number, wy: number): boolean {
  if (!g.veins || g.veins.length === 0) return false;
  const p = g.player;
  const pick = p.equipped.pickaxe;
  const tier = pick?.pickaxeTier ?? 0;

  let best: Vein | null = null;
  let bestD = Infinity;
  for (const v of g.veins) {
    const dc = Math.hypot(v.pos.x - wx, v.pos.y - wy);
    if (dc > 44) continue;
    const dp = Math.hypot(v.pos.x - p.pos.x, v.pos.y - p.pos.y);
    if (dp > 96) continue;
    if (dp < bestD) {
      bestD = dp;
      best = v;
    }
  }
  if (!best) return false;
  if (p.attackCd > 0) return true;

  const meta = ORES[best.ore];
  if (tier === 0 && meta.level > 5) {
    g.floaters.push({
      x: best.pos.x, y: best.pos.y - 16, text: "Requer Picareta", color: "#ff8060",
      life: 1.0, maxLife: 1.0, vy: -24, scale: 1,
    });
    p.attackCd = 0.35;
    return true;
  }

  const stats = miningStats(p.miningLevel);
  const baseDmg = 10 + tier * 8 + Math.floor(p.attr.str * 0.9);
  const speedMult = 0.7 + stats.speed * 0.45;
  let dmg = Math.floor(baseDmg * speedMult);
  const isCrit = Math.random() < stats.crit;
  if (isCrit) dmg *= 3;

  best.hp -= dmg;
  best.hitFlash = 0.2;
  p.attackCd = Math.max(0.18, 0.48 - stats.speed * 0.25);
  p.action = "attack";
  p.actionTimer = 0.22;
  p.squashX = 1.18;
  p.squashY = 0.85;
  sfx.playPickaxe();

  // Hit sparks
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 50 + Math.random() * 90;
    const pt = g.particles[g.particleHead];
    g.particleHead = (g.particleHead + 1) % g.particles.length;
    pt.active = true;
    pt.x = best.pos.x;
    pt.y = best.pos.y - 4;
    pt.vx = Math.cos(a) * sp;
    pt.vy = Math.sin(a) * sp - 35;
    pt.life = 0.35;
    pt.maxLife = 0.35;
    pt.size = 3;
    pt.color = isCrit ? "#fff080" : meta.color;
    pt.glow = true;
    pt.gravity = 160;
  }

  if (best.kind === "runner") {
    const dx = best.pos.x - p.pos.x;
    const dy = best.pos.y - p.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    best.vel = { x: (dx / d) * 65, y: (dy / d) * 65 };
    best.cooldown = 1.5;
  }

  if (best.hp <= 0) breakVein(g, best);
  return true;
}

function breakVein(g: GameState, v: Vein) {
  const p = g.player;
  const meta = ORES[v.ore];
  const stats = miningStats(p.miningLevel);
  const bloodBonus = g.activeEvent?.kind === "bloodMoon" ? 3 : 1;
  let drops = 1;
  if (Math.random() < stats.tripleChance) drops = 3;
  else if (Math.random() < stats.doubleChance) drops = 2;
  drops *= bloodBonus;

  giveOre(g, v.ore, drops);
  p.gainMiningXp(meta.xp * drops, (m, c) => g.log.unshift({ text: m, color: c ?? "#fff", life: 6 }));
  sfx.playOreBreak();
  g.trauma = Math.min(1, g.trauma + 0.16);
  g.hitstop = 0.035;

  g.floaters.push({
    x: v.pos.x, y: v.pos.y - 12, text: `+${drops} ${meta.name}`,
    color: meta.color, life: 1.4, maxLife: 1.4, vy: -34, scale: 1.1,
  });

  if (Math.random() < stats.gemChance) {
    giveOre(g, meta.gem ? v.ore : "cristal_verde", 1);
    g.floaters.push({
      x: v.pos.x, y: v.pos.y - 26, text: "+1 Gema!",
      color: "#a0f0ff", life: 1.2, maxLife: 1.2, vy: -30, scale: 1,
    });
  }

  v.remaining -= 1;
  if (v.remaining <= 0) {
    if (v.kind === "exploder") {
      for (const e of [...g.enemies]) {
        if (Math.hypot(e.pos.x - v.pos.x, e.pos.y - v.pos.y) < 110) {
          e.hp -= 65;
          e.hitFlash = 0.18;
        }
      }
      g.shockwaves.push({ x: v.pos.x, y: v.pos.y, radius: 10, maxRadius: 110, color: "#ff8040", life: 0.4, maxLife: 0.4 });
    }
    if (v.kind === "summoner") {
      _pendingMonsterSpawns.push({ x: v.pos.x, y: v.pos.y, count: 2 });
    }
    if (v.kind === "teleporter") {
      spawnVeinNear(g, p.pos.x, p.pos.y, v.ore, "teleporter");
    }
    g.veins = g.veins.filter(x => x !== v);
    g.oreRespawn = Math.min(g.oreRespawn, meta.respawnSec * 0.5);
    return;
  }
  v.hp = v.maxHp;
}

export function updateVeins(g: GameState, dt: number) {
  if (!g.veins) return;
  const p = g.player;
  for (const v of g.veins) {
    v.hitFlash = Math.max(0, v.hitFlash - dt);
    if (v.life < 900000) v.life -= dt;
    v.cooldown = Math.max(0, v.cooldown - dt);

    if (v.kind === "runner" && v.vel && v.cooldown > 0) {
      const nx = v.pos.x + v.vel.x * dt;
      const ny = v.pos.y + v.vel.y * dt;
      const tx = Math.floor(nx / TILE);
      const ty = Math.floor(ny / TILE);
      if (!g.activeMap.isBlocked(tx, ty)) {
        v.pos.x = nx;
        v.pos.y = ny;
      } else {
        v.cooldown = 0;
      }
    }
  }
  g.veins = g.veins.filter(v => v.life > 0);
  g.oreRespawn -= dt;
  const targetVeins = 120;
  if (g.veins.length < targetVeins && g.oreRespawn <= 0) {
    spawnVeinNear(g, p.pos.x, p.pos.y);
    g.oreRespawn = 6;
  }
}
