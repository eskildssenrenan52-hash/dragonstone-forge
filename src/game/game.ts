import {
  BIOMES, World, CaveFloor, TILE, Player, type Enemy, type FloatingText, type Loot, type Projectile,
  type PlayMap, makeItem, rollRarity, RARITY_COLOR, CLASS_INFO, type PlayerClass,
} from "./engine";

import { GrandDungeonFloor, GRAND_MAX_FLOOR, difficultyMultiplier, enemyNameForFloor } from "./grandDungeon";
import { updateVeins, tryMineAt, makePickaxe, _pendingMonsterSpawns } from "./mining";
import { tickEvents, dropMultiplier } from "./events";


export type Input = {
  keys: Set<string>;
  mouse: { x: number; y: number; down: boolean; downOnce: boolean };
};

// Snapshot of per-floor mutable state (enemies etc.), so returning to a floor restores it
type FloorSnapshot = {
  enemies: Enemy[];
  loot: Loot[];
  projectiles: Projectile[];
  spawnTimer: number;
  bossTimer: number;
};

export type GameState = {
  world: World;                          // always the overworld
  activeMap: PlayMap;                    // current playable map (world or a sub-floor)
  activeCaveBiome: number | null;        // biomeId if on biome caves floors 2+
  activeFloor: number;                   // 1 = overworld, 2/3/4 = biome sub-floors
  activeGrandFloor: number;              // 0 = not in grand dungeon, 1..100
  grandFloors: Map<number, GrandDungeonFloor>;
  caves: Map<string, CaveFloor>;
  snapshots: Map<string, FloorSnapshot>;
  player: Player;
  enemies: Enemy[];
  loot: Loot[];
  projectiles: Projectile[];
  floaters: FloatingText[];
  camera: { x: number; y: number };
  time: number;
  paused: boolean;
  panel: "none" | "inventory" | "stats" | "help" | "map" | "mining" | "crafting";
  log: { text: string; color: string; life: number }[];
  kills: number;
  bossKills: number;
  discovered: Set<number>;
  spawnTimer: number;
  bossTimer: number;
  stairCd: number;
  // Mining
  veins: import("./mining").Vein[];
  oreRespawn: number;
  // Events
  activeEvent: import("./events").ActiveEvent | null;
  eventCd: number;
  meteorTimer: number;
  meteors: { x: number; y: number; vx: number; vy: number; life: number }[];
  // Crafting UI
  craftingTab: string; // profession id currently focused in crafting panel
  autoFire: boolean; // right-joystick / auto-fire on mobile
};


let enemySeq = 0;

function floorKey(g: GameState): string {
  if (g.activeGrandFloor > 0) return `g${g.activeGrandFloor}`;
  return g.activeCaveBiome ? `f${g.activeFloor}:b${g.activeCaveBiome}` : "overworld";
}

function inGrand(g: GameState) { return g.activeGrandFloor > 0; }


export function newGame(seed = Math.floor(Math.random() * 99999), cls: PlayerClass = "melee"): GameState {
  const world = new World(seed);
  const player = new Player();
  player.cls = cls;
  const b = CLASS_INFO[cls].base;
  player.attr = { str: b.str, agi: b.agi, int: b.int, vit: b.vit };
  player.maxHp = b.hp; player.hp = b.hp; player.maxMp = b.mp; player.mp = b.mp;
  player.skills = classSkills(cls);

  player.pos = { x: world.spawn.x, y: world.spawn.y };
  player.equipped.weapon = makeItem("weapon", 1, "comum");
  player.equipped.armor = makeItem("armor", 1, "comum");
  player.equipped.pickaxe = makePickaxe(1);
  player.materials["pedra"] = 5;
  player.materials["madeira_antiga"] = 3;
  player.recipesKnown = new Set(["espada_ferro","pocao_menor","arco_longo","manto_iniciado","cajado_carvalho","bomba_ferro","runa_fogo","banquete_forca","peito_ferro","gema_safira"]);
  player.inventory.push(makeItem("potion", 1, "comum"), makeItem("potion", 1, "comum"));

  return {
    world,
    activeMap: world,
    activeCaveBiome: null,
    activeFloor: 1,
    activeGrandFloor: 0,
    grandFloors: new Map(),
    caves: new Map(),
    snapshots: new Map(),
    player,
    enemies: [], loot: [], projectiles: [], floaters: [],
    camera: { x: player.pos.x, y: player.pos.y },
    time: 0, paused: false, panel: "none",
    log: [
      { text: "Bem-vindo à Cidade Central de Asterion.", color: "#f0e0a0", life: 12 },
      { text: "WASD move, mouse ataca, 1-4 habilidades. B = crafting, N = mineração. Escada dourada ao norte → Masmorra de 100 andares.", color: "#fff", life: 12 },
    ],
    kills: 0, bossKills: 0,
    discovered: new Set([1]),
    spawnTimer: 0, bossTimer: 30,
    stairCd: 0,
    veins: [], oreRespawn: 0,
    activeEvent: null, eventCd: 90 + Math.random() * 120,
    meteorTimer: 0, meteors: [],
    craftingTab: "ferreiro",
    autoFire: false,
  };
}


export function logMsg(g: GameState, text: string, color = "#fff") {
  g.log.unshift({ text, color, life: 6 });
  if (g.log.length > 8) g.log.pop();
}

function tileAt(g: GameState, wx: number, wy: number) {
  return g.activeMap.get(Math.floor(wx / TILE), Math.floor(wy / TILE));
}

function collides(g: GameState, x: number, y: number, r = 12) {
  const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
  for (const [px, py] of pts) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (g.activeMap.isBlocked(tx, ty)) return true;
  }
  return false;
}

function moveEntity(g: GameState, pos: { x: number; y: number }, dx: number, dy: number, r = 12) {
  const nx = pos.x + dx;
  if (!collides(g, nx, pos.y, r)) pos.x = nx;
  const ny = pos.y + dy;
  if (!collides(g, pos.x, ny, r)) pos.y = ny;
}

function currentBiomeForEnemies(g: GameState): number {
  if (g.activeCaveBiome) return g.activeCaveBiome;
  const t = tileAt(g, g.player.pos.x, g.player.pos.y);
  return t.biome || 1;
}

function spawnEnemyNear(g: GameState, cx: number, cy: number, boss = false) {
  const isGrand = inGrand(g);
  const inCave = !!g.activeCaveBiome;
  const tries = 30;
  for (let i = 0; i < tries; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = isGrand ? 220 + Math.random() * 260 : inCave ? 200 + Math.random() * 240 : 300 + Math.random() * 400;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    const maxCoord = g.activeMap.size * TILE;
    if (x < 32 || y < 32 || x > maxCoord - 32 || y > maxCoord - 32) continue;
    if (collides(g, x, y, 12)) continue;

    if (isGrand) {
      // Grand Dungeon: scale by floor with 1.2x per floor
      const floor = g.activeGrandFloor;
      const mul = difficultyMultiplier(floor);
      const level = Math.max(1, Math.floor(1 + floor * 1.3 + (boss ? 8 : 0)));
      const name = enemyNameForFloor(floor, boss);
      const baseHp = boss ? 380 : 26;
      const baseAtk = boss ? 16 : 8;
      const baseDef = boss ? 6 : 3;
      const maxHp = Math.floor(baseHp * mul * 4);
      const accents = ["#c8a060", "#8090a0", "#a08040", "#607080", "#b06040"];
      const en: Enemy = {
        id: ++enemySeq,
        pos: { x, y }, vel: { x: 0, y: 0 },
        hp: maxHp, maxHp,
        atk: Math.floor(baseAtk * mul * 4),
        def: Math.floor(baseDef * mul * 4),
        speed: boss ? 1.7 : 1.9 + Math.random() * 0.5,
        level, name, biome: 0,
        radius: boss ? 24 : 12,
        color: boss ? "#f04060" : accents[floor % accents.length],
        isBoss: boss, attackCd: 0, hitFlash: 0,
      };
      g.enemies.push(en);
      if (boss) logMsg(g, `${name} surge no ${floor}º andar da Masmorra!`, "#f04060");
      return;
    }

    let biomeId: number;
    if (inCave) biomeId = g.activeCaveBiome!;
    else biomeId = g.activeMap.get(Math.floor(x / TILE), Math.floor(y / TILE)).biome;
    const b = BIOMES.find(bb => bb.id === biomeId) || BIOMES[0];
    const dangerBoost = inCave ? 3 : 0;
    const level = Math.max(1, b.danger + dangerBoost + Math.floor(Math.random() * 3) - 1 + (boss ? 5 : 0));
    const monsterName = inCave
      ? (boss ? b.caveTheme.boss : b.caveTheme.monsters[Math.floor(Math.random() * b.caveTheme.monsters.length)])
      : (boss ? b.boss : b.monsters[Math.floor(Math.random() * b.monsters.length)]);
    const maxHp = (boss ? 300 + level * 60 : 20 + level * 12) * 4;
    const accent = inCave ? b.caveTheme.accent : b.accent;
    const en: Enemy = {
      id: ++enemySeq,
      pos: { x, y }, vel: { x: 0, y: 0 },
      hp: maxHp, maxHp,
      atk: ((boss ? 12 : 6) + level * 2) * 4,
      def: Math.floor(level * 1.2) * 4,
      speed: boss ? 1.6 : 1.9 + Math.random() * 0.4,
      level, name: monsterName, biome: biomeId,
      radius: boss ? 22 : 12,
      color: boss ? "#f04060" : accent,
      isBoss: boss, attackCd: 0, hitFlash: 0,
    };
    g.enemies.push(en);
    if (boss) {
      const label = inCave ? b.caveTheme.label : b.name;
      logMsg(g, `${monsterName} apareceu em ${label}!`, "#f04060");
    }
    return;
  }
}

function dropLoot(g: GameState, e: Enemy) {
  const p = g.player;
  const gold = Math.floor(e.level * (e.isBoss ? 20 : 3) + Math.random() * e.level * 4);
  p.gold += gold;
  g.floaters.push({ x: e.pos.x, y: e.pos.y - 10, text: `+${gold}g`, color: "#f0c060", life: 1.2, vy: -30 });
  p.gainXp(e.isBoss ? e.level * 50 : e.level * 12, (m, c) => logMsg(g, m, c));
  const chance = e.isBoss ? 1 : (inGrand(g) ? 0.6 : g.activeCaveBiome ? 0.5 : 0.35);
  if (Math.random() < chance) {
    const kinds: Array<"weapon" | "armor" | "potion" | "material"> = ["weapon", "armor", "potion", "material"];
    const kind = e.isBoss ? (Math.random() < 0.5 ? "weapon" : "armor") : kinds[Math.floor(Math.random() * kinds.length)];
    const luck = (e.isBoss ? 20 : 0) + (g.activeCaveBiome ? 8 : 0) + (inGrand(g) ? Math.min(45, g.activeGrandFloor) : 0);
    const rarity = rollRarity(luck);
    const tier = Math.max(1, Math.floor(e.level / 3) + 1 + (inGrand(g) ? Math.floor(g.activeGrandFloor / 8) : 0));
    const it = makeItem(kind, tier, rarity);
    g.loot.push({ pos: { x: e.pos.x, y: e.pos.y }, item: it, life: 30 });
  }
}

function damageEnemy(g: GameState, e: Enemy, dmg: number) {
  const real = Math.max(1, dmg - e.def);
  e.hp -= real;
  e.hitFlash = 0.15;
  g.floaters.push({ x: e.pos.x, y: e.pos.y - 8, text: `${real}`, color: "#ffe0e0", life: 0.8, vy: -40 });
  if (e.hp <= 0) {
    g.enemies = g.enemies.filter(x => x !== e);
    g.kills++;
    if (e.isBoss) { g.bossKills++; logMsg(g, `Chefe derrotado: ${e.name}`, "#f0b040"); }
    dropLoot(g, e);
  }
}

function respawnInCity(g: GameState) {
  // Always sends the player back to the central city plaza.
  snapshotFloor(g);
  g.activeMap = g.world;
  g.activeCaveBiome = null;
  g.activeFloor = 1;
  g.activeGrandFloor = 0;
  restoreFloor(g, "overworld");
  g.player.pos.x = g.world.spawn.x;
  g.player.pos.y = g.world.spawn.y;
  g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
  g.stairCd = 1.5;
}

function damagePlayer(g: GameState, dmg: number) {
  const p = g.player;
  if (p.invuln > 0) return;
  const real = Math.max(1, dmg - p.def());
  p.hp -= real;
  p.invuln = 0.4;
  p.hitFlash = 0.2;
  g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: `${real}`, color: "#ff6060", life: 0.8, vy: -30 });
  if (p.hp <= 0) {
    p.hp = Math.floor(p.maxHp * 0.5);
    p.gold = Math.floor(p.gold * 0.75);
    respawnInCity(g);
    logMsg(g, "Você caiu. Ressuscitado na Cidade Central de Asterion (perdeu 25% do ouro).", "#ff6060");
  }
}

function classSkills(cls: import("./engine").PlayerClass): import("./engine").Skill[] {
  if (cls === "melee") return [
    { id: "cleave", name: "Corte Amplo", cost: 10, cd: 0, cur: 0, desc: "Golpe em cone", key: "1" },
    { id: "shield", name: "Guarda de Ferro", cost: 12, cd: 0, cur: 0, desc: "Invulnerável 1.5s", key: "2" },
    { id: "slash",  name: "Golpe Giratório", cost: 15, cd: 0, cur: 0, desc: "Dano em área ao redor", key: "3" },
    { id: "dash",   name: "Investida", cost: 5, cd: 0, cur: 0, desc: "Impulso na direção", key: "4" },
  ];
  if (cls === "magic") return [
    { id: "bolt",     name: "Raio Arcano", cost: 12, cd: 0, cur: 0, desc: "Projétil rápido", key: "1" },
    { id: "fireball", name: "Bola de Fogo", cost: 22, cd: 0, cur: 0, desc: "Explosão em área", key: "2" },
    { id: "heal",     name: "Cura Menor", cost: 15, cd: 0, cur: 0, desc: "Restaura HP", key: "3" },
    { id: "dash",     name: "Piscar", cost: 8, cd: 0, cur: 0, desc: "Teleporte curto", key: "4" },
  ];
  if (cls === "paladin") return [
    { id: "smite", name: "Golpe Sagrado", cost: 18, cd: 0, cur: 0, desc: "Dano sagrado + cura", key: "1" },
    { id: "heal",  name: "Bênção", cost: 15, cd: 0, cur: 0, desc: "Restaura HP", key: "2" },
    { id: "slash", name: "Golpe Giratório", cost: 10, cd: 0, cur: 0, desc: "Dano em área", key: "3" },
    { id: "dash",  name: "Avanço Sagrado", cost: 5, cd: 0, cur: 0, desc: "Impulso na direção", key: "4" },
  ];
  if (cls === "necro") return [
    { id: "drain",  name: "Dreno de Vida", cost: 12, cd: 0, cur: 0, desc: "Projétil que cura", key: "1" },
    { id: "summon", name: "Invocar Esqueleto", cost: 25, cd: 0, cur: 0, desc: "Invoca aliado 20s", key: "2" },
    { id: "bolt",   name: "Raio Sombrio", cost: 10, cd: 0, cur: 0, desc: "Projétil arcano", key: "3" },
    { id: "heal",   name: "Sangria Reversa", cost: 18, cd: 0, cur: 0, desc: "Restaura HP", key: "4" },
  ];
  // archer
  return [
    { id: "quickshot", name: "Tiro Rápido", cost: 6, cd: 0, cur: 0, desc: "Flecha veloz longa", key: "1" },
    { id: "rain",      name: "Chuva de Flechas", cost: 20, cd: 0, cur: 0, desc: "Flechas em área", key: "2" },
    { id: "dash",      name: "Salto Ágil", cost: 5, cd: 0, cur: 0, desc: "Impulso ágil", key: "3" },
    { id: "heal",      name: "Bandagem", cost: 12, cd: 0, cur: 0, desc: "Restaura HP", key: "4" },
  ];
}

function useSkill(g: GameState, id: string) {
  const p = g.player;
  const s = p.skills.find(x => x.id === id);
  if (!s || s.cur > 0 || p.mp < s.cost) return;
  p.mp -= s.cost;
  const len = Math.hypot(p.facing.x, p.facing.y) || 1;
  const fx = p.facing.x / len, fy = p.facing.y / len;
  if (id === "slash") {
    s.cd = 0.6; s.cur = s.cd;
    const r = 90;
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - p.pos.x, dy = e.pos.y - p.pos.y;
      if (dx * dx + dy * dy < r * r) damageEnemy(g, e, p.atk() * 1.4);
    }
  } else if (id === "cleave") {
    s.cd = 0.8; s.cur = s.cd;
    const r = 110;
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - p.pos.x, dy = e.pos.y - p.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < r) {
        const dot = (dx / d) * fx + (dy / d) * fy;
        if (dot > 0.2) damageEnemy(g, e, p.atk() * 1.8);
      }
    }
  } else if (id === "shield") {
    s.cd = 8; s.cur = s.cd;
    p.invuln = 1.5;
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: "Guarda!", color: "#a0c0ff", life: 1, vy: -30 });
  } else if (id === "bolt") {
    s.cd = 0.4; s.cur = s.cd;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 8, y: fy * 8 },
      life: 1.2, damage: Math.floor(p.atk() * 1.6 + p.attr.int * 2), from: "player",
    });
  } else if (id === "fireball") {
    s.cd = 1.6; s.cur = s.cd;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 6, y: fy * 6 },
      life: 1.4, damage: Math.floor(p.atk() * 2.2 + p.attr.int * 4), from: "player",
    });
    // pseudo-AoE: hit enemies close to trajectory next tick already handled by projectile collide;
    // emulate AoE by damaging near landing point too
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - (p.pos.x + fx * 200), dy = e.pos.y - (p.pos.y + fy * 200);
      if (dx * dx + dy * dy < 90 * 90) damageEnemy(g, e, p.atk() * 1.2);
    }
  } else if (id === "heal") {
    s.cd = 4; s.cur = s.cd;
    const amt = 30 + p.attr.int * 3;
    p.hp = Math.min(p.maxHp, p.hp + amt);
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: `+${amt}`, color: "#60ff80", life: 1, vy: -30 });
  } else if (id === "dash") {
    s.cd = 1.5; s.cur = s.cd;
    for (let i = 0; i < 8; i++) moveEntity(g, p.pos, fx * 8, fy * 8);
    p.invuln = 0.3;
  } else if (id === "smite") {
    s.cd = 0.9; s.cur = s.cd;
    let hit = false;
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - p.pos.x, dy = e.pos.y - p.pos.y;
      if (dx * dx + dy * dy < 70 * 70) { damageEnemy(g, e, p.atk() * 2.0); hit = true; }
    }
    if (hit) { p.hp = Math.min(p.maxHp, p.hp + 12 + p.attr.int); g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: "Sagrado!", color: "#fff080", life: 1, vy: -30 }); }
  } else if (id === "drain") {
    s.cd = 0.5; s.cur = s.cd;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 7, y: fy * 7 },
      life: 1.4, damage: Math.floor(p.atk() * 1.3 + p.attr.int * 2), from: "player",
    });
    // Heal a small tick per cast
    p.hp = Math.min(p.maxHp, p.hp + 4 + Math.floor(p.attr.int * 0.4));
  } else if (id === "summon") {
    s.cd = 8; s.cur = s.cd;
    const hp = 40 + p.attr.int * 5 + p.level * 4;
    p.minions.push({
      pos: { x: p.pos.x + fx * 24, y: p.pos.y + fy * 24 }, vel: { x: 0, y: 0 },
      target: null, hp, maxHp: hp, life: 22, kind: "skeleton", attackCd: 0,
    });
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: "Esqueleto!", color: "#c060ff", life: 1, vy: -30 });
  } else if (id === "quickshot") {
    s.cd = 0.2; s.cur = s.cd;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 14, y: fy * 14 },
      life: 1.8, damage: Math.floor(p.atk() * 1.5 + p.attr.agi * 2), from: "player",
    });
  } else if (id === "rain") {
    s.cd = 2.5; s.cur = s.cd;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      g.projectiles.push({
        pos: { x: p.pos.x, y: p.pos.y }, vel: { x: Math.cos(ang) * 8, y: Math.sin(ang) * 8 },
        life: 1.2, damage: Math.floor(p.atk() * 1.1 + p.attr.agi), from: "player",
      });
    }
  }
}

function basicAttack(g: GameState) {
  const p = g.player;
  if (p.attackCd > 0) return;
  const len = Math.hypot(p.facing.x, p.facing.y) || 1;
  const fx = p.facing.x / len, fy = p.facing.y / len;
  if (p.cls === "archer") {
    p.attackCd = 0.18;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 12, y: fy * 12 },
      life: 1.4, damage: p.atk() + Math.floor(p.attr.agi * 0.6), from: "player",
    });
    return;
  }
  if (p.cls === "necro") {
    p.attackCd = 0.35;
    // dark bolt; on hit heals a bit — approximated by small heal per shot fired
    p.hp = Math.min(p.maxHp, p.hp + 1);
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 8, y: fy * 8 },
      life: 1, damage: p.atk() + Math.floor(p.attr.int * 0.6), from: "player",
    });
    return;
  }
  if (p.cls === "magic") {
    p.attackCd = 0.32;
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y }, vel: { x: fx * 9, y: fy * 9 },
      life: 0.8, damage: p.atk() + Math.floor(p.attr.int * 0.5), from: "player",
    });
    return;
  }
  // melee / paladin: default
  p.attackCd = 0.25;
  g.projectiles.push({
    pos: { x: p.pos.x, y: p.pos.y },
    vel: { x: fx * 10, y: fy * 10 },
    life: 0.5, damage: p.atk(), from: "player",
  });
}

// -------- Floor transitions --------
function snapshotFloor(g: GameState) {
  g.snapshots.set(floorKey(g), {
    enemies: g.enemies, loot: g.loot, projectiles: g.projectiles,
    spawnTimer: g.spawnTimer, bossTimer: g.bossTimer,
  });
}
function restoreFloor(g: GameState, key: string) {
  const snap = g.snapshots.get(key);
  if (snap) {
    g.enemies = snap.enemies; g.loot = snap.loot; g.projectiles = snap.projectiles;
    g.spawnTimer = snap.spawnTimer; g.bossTimer = snap.bossTimer;
  } else {
    g.enemies = []; g.loot = []; g.projectiles = [];
    g.spawnTimer = 0; g.bossTimer = 20;
  }
}

function getOrCreateFloor(g: GameState, biomeId: number, floor: number): CaveFloor {
  const key = `${biomeId}:${floor}`;
  let cave = g.caves.get(key);
  if (!cave) {
    cave = new CaveFloor(biomeId, g.world.seed * 31 + biomeId * 977 + floor * 104729, floor);
    g.caves.set(key, cave);
  }
  return cave;
}

// Descend: overworld -> 2, or floor N (2/3) -> N+1
function descend(g: GameState, biomeId: number) {
  snapshotFloor(g);
  const nextFloor = g.activeFloor === 1 ? 2 : g.activeFloor + 1;
  if (nextFloor > 4) return;
  const cave = getOrCreateFloor(g, biomeId, nextFloor);
  g.activeMap = cave;
  g.activeCaveBiome = biomeId;
  g.activeFloor = nextFloor;
  g.player.pos.x = cave.spawn.x;
  g.player.pos.y = cave.spawn.y;
  g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.2;
  const b = BIOMES.find(bb => bb.id === biomeId);
  if (b) {
    const label = nextFloor === 2 ? `${b.caveTheme.label} (2º andar)`
      : nextFloor === 3 ? `Masmorra Profunda (3º andar)`
      : `Santuário de ${b.name} (4º andar)`;
    logMsg(g, `Desceu para: ${label} de ${b.name}.`, "#f0c040");
  }
}

// Ascend: floor N -> N-1, floor 2 -> overworld
function ascend(g: GameState) {
  if (!g.activeCaveBiome) return;
  snapshotFloor(g);
  const biomeId = g.activeCaveBiome;
  const prevFloor = g.activeFloor - 1;
  if (prevFloor <= 1) {
    g.activeMap = g.world;
    g.activeCaveBiome = null;
    g.activeFloor = 1;
    const stair = g.world.stairs.find(s => s.biome === biomeId);
    if (stair) { g.player.pos.x = stair.x; g.player.pos.y = stair.y; }
    else { g.player.pos.x = g.world.spawn.x; g.player.pos.y = g.world.spawn.y; }
    g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
    restoreFloor(g, "overworld");
    g.stairCd = 1.2;
    logMsg(g, "Voltou ao overworld.", "#8fcfff");
    return;
  }
  const cave = getOrCreateFloor(g, biomeId, prevFloor);
  g.activeMap = cave;
  g.activeFloor = prevFloor;
  // land on stair-down of the previous floor if present, else its spawn
  const downStair = cave.stairs.find(s => s.kind === "down");
  if (downStair) { g.player.pos.x = downStair.x; g.player.pos.y = downStair.y; }
  else { g.player.pos.x = cave.spawn.x; g.player.pos.y = cave.spawn.y; }
  g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.2;
  logMsg(g, `Subiu para o ${prevFloor}º andar.`, "#8fcfff");
}

// -------- Grand Dungeon of Asterion (100 floors) --------
function getOrCreateGrandFloor(g: GameState, floor: number): GrandDungeonFloor {
  let f = g.grandFloors.get(floor);
  if (!f) {
    f = new GrandDungeonFloor(floor, g.world.seed * 7919 + floor * 15485863);
    g.grandFloors.set(floor, f);
  }
  return f;
}

// Enter grand dungeon from city (or go deeper)
function descendGrand(g: GameState) {
  snapshotFloor(g);
  const nextFloor = g.activeGrandFloor === 0 ? 1 : g.activeGrandFloor + 1;
  if (nextFloor > GRAND_MAX_FLOOR) {
    logMsg(g, "Você já está no fundo da Masmorra de Asterion.", "#f0c040");
    return;
  }
  const floor = getOrCreateGrandFloor(g, nextFloor);
  g.activeMap = floor;
  g.activeGrandFloor = nextFloor;
  g.activeCaveBiome = null;
  g.activeFloor = 1;
  g.player.pos.x = floor.spawn.x;
  g.player.pos.y = floor.spawn.y;
  g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  const mul = difficultyMultiplier(nextFloor).toFixed(2);
  logMsg(g, `Desceu para o ${nextFloor}º andar da Masmorra de Asterion. Dificuldade x${mul}.`, "#f0b040");
  if (nextFloor === GRAND_MAX_FLOOR) logMsg(g, "Você chegou ao 100º andar. A Câmara Final.", "#ff8060");
}

// Ascend grand: N -> N-1 or 1 -> city
function ascendGrand(g: GameState) {
  if (g.activeGrandFloor <= 0) return;
  snapshotFloor(g);
  const prev = g.activeGrandFloor - 1;
  if (prev <= 0) {
    // back to central city
    g.activeMap = g.world;
    g.activeGrandFloor = 0;
    // return to the grand stair spot in the city
    if (g.world.grandStair) {
      g.player.pos.x = g.world.grandStair.x;
      g.player.pos.y = g.world.grandStair.y + TILE * 2;
    } else {
      g.player.pos.x = g.world.spawn.x;
      g.player.pos.y = g.world.spawn.y;
    }
    g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
    restoreFloor(g, "overworld");
    g.stairCd = 1.4;
    logMsg(g, "Voltou à Cidade Central de Asterion.", "#8fcfff");
    return;
  }
  const floor = getOrCreateGrandFloor(g, prev);
  g.activeMap = floor;
  g.activeGrandFloor = prev;
  const down = floor.stairs.find(s => s.kind === "down");
  if (down) { g.player.pos.x = down.x; g.player.pos.y = down.y; }
  else { g.player.pos.x = floor.spawn.x; g.player.pos.y = floor.spawn.y; }
  g.camera.x = g.player.pos.x; g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  logMsg(g, `Subiu para o ${prev}º andar da Masmorra.`, "#8fcfff");
}

function openChestAt(g: GameState, tx: number, ty: number) {
  if (!inGrand(g)) return;
  const map = g.activeMap as GrandDungeonFloor;
  const ch = map.chests.find(c => c.x === tx && c.y === ty && !c.opened);
  if (!ch) return;
  ch.opened = true;
  // Convert the tile to walkable
  map.tiles[map.idx(tx, ty)].kind = 0;
  const p = g.player;
  const floor = g.activeGrandFloor;
  const bonus = ch.secret ? 25 : 10;
  const rewards = ch.secret ? 4 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2);
  const gold = Math.floor(50 * floor * (ch.secret ? 2.5 : 1) + Math.random() * 100 * floor);
  p.gold += gold;
  g.floaters.push({ x: tx * TILE + TILE / 2, y: ty * TILE, text: `+${gold}g`, color: "#f0c060", life: 2, vy: -30 });
  logMsg(g, ch.secret ? `Baú SECRETO aberto! +${gold} ouro, ${rewards} itens.` : `Baú aberto! +${gold} ouro, ${rewards} itens.`, ch.secret ? "#c25ef0" : "#f0c040");
  for (let i = 0; i < rewards; i++) {
    const kinds: Array<"weapon" | "armor" | "potion" | "material"> = ["weapon", "armor", "potion", "material"];
    const kind = i === 0 && ch.secret ? (Math.random() < 0.5 ? "weapon" : "armor") : kinds[Math.floor(Math.random() * kinds.length)];
    const rarity = rollRarity(bonus + Math.min(50, floor));
    const tier = Math.max(1, Math.floor(floor / 6) + 1 + (ch.secret ? 2 : 0));
    const it = makeItem(kind, tier, rarity);
    const ang = (i / rewards) * Math.PI * 2;
    g.loot.push({
      pos: { x: tx * TILE + TILE / 2 + Math.cos(ang) * 24, y: ty * TILE + TILE / 2 + Math.sin(ang) * 24 },
      item: it, life: 90,
    });
  }
}

export function update(g: GameState, dt: number, input: Input, canvasW: number, canvasH: number) {
  if (g.paused) return;
  g.time += dt;
  g.stairCd = Math.max(0, g.stairCd - dt);
  const p = g.player;

  let mx = 0, my = 0;
  if (input.keys.has("w") || input.keys.has("arrowup")) my -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) my += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) mx -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) mx += 1;
  const running = input.keys.has("shift");
  const spd = p.speed * (running ? 1.5 : 1) * 60 * dt;
  if (mx || my) {
    const l = Math.hypot(mx, my);
    moveEntity(g, p.pos, (mx / l) * spd, (my / l) * spd);
  }

  const worldMx = input.mouse.x + g.camera.x - canvasW / 2;
  const worldMy = input.mouse.y + g.camera.y - canvasH / 2;
  p.facing.x = worldMx - p.pos.x;
  p.facing.y = worldMy - p.pos.y;

  if (input.mouse.down) {
    // Try mining first (only consumes click if a vein is close)
    if (!tryMineAt(g, worldMx, worldMy)) basicAttack(g);
  }
  if (input.keys.has("1")) useSkill(g, "slash");
  if (input.keys.has("2")) useSkill(g, "bolt");
  if (input.keys.has("3")) useSkill(g, "heal");
  if (input.keys.has("4")) useSkill(g, "dash");

  // Mining veins + world events
  updateVeins(g, dt);
  tickEvents(g, dt);
  // Consume deferred vein-summoner spawns
  while (_pendingMonsterSpawns.length) {
    const sp = _pendingMonsterSpawns.shift()!;
    for (let i = 0; i < sp.count; i++) spawnEnemyNear(g, sp.x, sp.y, false);
  }
  // Blood moon multiplies dropped gold on the fly (loot handled elsewhere)
  void dropMultiplier;


  p.attackCd = Math.max(0, p.attackCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.mp = Math.min(p.maxMp, p.mp + dt * (2 + p.attr.int * 0.2));
  p.hp = Math.min(p.maxHp, p.hp + dt * (0.5 + p.attr.vit * 0.1));
  for (const s of p.skills) s.cur = Math.max(0, s.cur - dt);

  // discovered biome (overworld)
  if (!g.activeCaveBiome) {
    const t = tileAt(g, p.pos.x, p.pos.y);
    if (!g.discovered.has(t.biome) && t.biome > 0) {
      g.discovered.add(t.biome);
      const b = BIOMES.find(bb => bb.id === t.biome);
      if (b) logMsg(g, `Nova região descoberta: ${b.name}`, "#5ea8ff");
    }
  }

  // staircase check
  if (g.stairCd <= 0) {
    const t = tileAt(g, p.pos.x, p.pos.y);
    if (t.kind === 16) {
      if (!inGrand(g)) descendGrand(g);
    } else if (inGrand(g) && t.kind === 6) {
      descendGrand(g);
    } else if (inGrand(g) && t.kind === 7) {
      ascendGrand(g);
    } else if (t.kind === 6) {
      const biome = g.activeCaveBiome ?? t.biome;
      if (g.activeFloor < 4) descend(g, biome);
    } else if (t.kind === 7 && g.activeCaveBiome) {
      ascend(g);
    }
  }

  // chest interaction (grand dungeon)
  if (inGrand(g)) {
    const tx = Math.floor(p.pos.x / TILE), ty = Math.floor(p.pos.y / TILE);
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const cx = tx + ox, cy = ty + oy;
      const tt = g.activeMap.get(cx, cy);
      if (tt.kind === 12) {
        const dx = (cx + 0.5) * TILE - p.pos.x, dy = (cy + 0.5) * TILE - p.pos.y;
        if (dx * dx + dy * dy < 40 * 40) openChestAt(g, cx, cy);
      }
    }
  }

  // spawns (no spawns in central city safe zone)
  const inCity = !g.activeCaveBiome && !inGrand(g);
  const distFromSpawn = inCity ? Math.hypot(p.pos.x - g.world.spawn.x, p.pos.y - g.world.spawn.y) : Infinity;
  const inSafeZone = inCity && distFromSpawn < TILE * 22;
  const enemyCap = inGrand(g) ? 16 : g.activeCaveBiome ? 12 : 18;
  g.spawnTimer -= dt;
  if (!inSafeZone && g.spawnTimer <= 0 && g.enemies.filter(e => !e.isBoss).length < enemyCap) {
    spawnEnemyNear(g, p.pos.x, p.pos.y, false);
    g.spawnTimer = inGrand(g) ? 0.6 + Math.random() * 0.8 : g.activeCaveBiome ? 0.8 + Math.random() * 1.0 : 1.2 + Math.random() * 1.5;
  }
  g.bossTimer -= dt;
  if (!inSafeZone && g.bossTimer <= 0) {
    if (g.enemies.filter(e => e.isBoss).length < 2) spawnEnemyNear(g, p.pos.x, p.pos.y, true);
    g.bossTimer = inGrand(g) ? 45 + Math.random() * 30 : g.activeCaveBiome ? 60 + Math.random() * 30 : 90 + Math.random() * 60;
  }

  // enemies AI
  for (const e of g.enemies) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackCd = Math.max(0, e.attackCd - dt);
    const dx = p.pos.x - e.pos.x, dy = p.pos.y - e.pos.y;
    const d = Math.hypot(dx, dy);
    const sight = e.isBoss ? 280 : 180;
    if (d < sight) {
      const s = e.speed * 60 * dt;
      if (d > 22) moveEntity(g, e.pos, (dx / d) * s, (dy / d) * s, e.radius);
      if (d < 30 && e.attackCd <= 0) {
        e.attackCd = 0.8;
        damagePlayer(g, e.atk);
      }
    } else if (d > 900 && !e.isBoss) {
      g.enemies = g.enemies.filter(x => x !== e);
    }
  }

  // minions (necromancer skeletons)
  if (p.minions.length) {
    for (const m of [...p.minions]) {
      m.life -= dt;
      m.attackCd = Math.max(0, m.attackCd - dt);
      if (m.life <= 0 || m.hp <= 0) { p.minions = p.minions.filter(x => x !== m); continue; }
      // Find nearest enemy
      let best: Enemy | null = null; let bestD = 340;
      for (const e of g.enemies) {
        const dx = e.pos.x - m.pos.x, dy = e.pos.y - m.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) {
        const dx = best.pos.x - m.pos.x, dy = best.pos.y - m.pos.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 20) moveEntity(g, m.pos, (dx / d) * 130 * dt, (dy / d) * 130 * dt, 8);
        if (d < 26 && m.attackCd <= 0) {
          m.attackCd = 0.7;
          damageEnemy(g, best, Math.floor(6 + p.attr.int * 1.2 + p.level));
        }
      } else {
        // follow player
        const dx = p.pos.x - m.pos.x, dy = p.pos.y - m.pos.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 60) moveEntity(g, m.pos, (dx / d) * 100 * dt, (dy / d) * 100 * dt, 8);
      }
    }
  }


  // projectiles
  for (const pr of [...g.projectiles]) {
    pr.pos.x += pr.vel.x * 60 * dt;
    pr.pos.y += pr.vel.y * 60 * dt;
    pr.life -= dt;
    if (pr.life <= 0 || collides(g, pr.pos.x, pr.pos.y, 3)) {
      g.projectiles = g.projectiles.filter(x => x !== pr);
      continue;
    }
    if (pr.from === "player") {
      for (const e of g.enemies) {
        const dd = Math.hypot(e.pos.x - pr.pos.x, e.pos.y - pr.pos.y);
        if (dd < e.radius + 4) {
          damageEnemy(g, e, pr.damage);
          g.projectiles = g.projectiles.filter(x => x !== pr);
          break;
        }
      }
    }
  }

  for (const f of [...g.floaters]) {
    f.life -= dt; f.y += f.vy * dt;
    if (f.life <= 0) g.floaters = g.floaters.filter(x => x !== f);
  }
  for (const l of [...g.loot]) {
    l.life -= dt;
    const dd = Math.hypot(l.pos.x - p.pos.x, l.pos.y - p.pos.y);
    if (dd < 24) {
      if (p.inventory.length < 32) {
        p.inventory.push(l.item);
        g.loot = g.loot.filter(x => x !== l);
        logMsg(g, `Coletou ${l.item.name}`, l.item.color);
      }
    } else if (l.life <= 0) g.loot = g.loot.filter(x => x !== l);
  }
  for (const lg of g.log) lg.life -= dt;
  g.log = g.log.filter(l => l.life > 0);

  g.camera.x += (p.pos.x - g.camera.x) * Math.min(1, dt * 6);
  g.camera.y += (p.pos.y - g.camera.y) * Math.min(1, dt * 6);
  
}

export function useInventoryItem(g: GameState, idx: number) {
  const p = g.player;
  const it = p.inventory[idx];
  if (!it) return;
  if (it.kind === "potion") {
    p.hp = Math.min(p.maxHp, p.hp + it.power);
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 8, text: `+${it.power}`, color: "#60ff80", life: 1, vy: -30 });
    p.inventory.splice(idx, 1);
  } else if (it.kind === "weapon") {
    const cur = p.equipped.weapon;
    p.equipped.weapon = it;
    p.inventory.splice(idx, 1);
    if (cur) p.inventory.push(cur);
    logMsg(g, `Equipou ${it.name}`, it.color);
  } else if (it.kind === "armor") {
    const cur = p.equipped.armor;
    p.equipped.armor = it;
    p.inventory.splice(idx, 1);
    if (cur) p.inventory.push(cur);
    logMsg(g, `Equipou ${it.name}`, it.color);
  } else {
    const val = it.power * 2;
    p.gold += val;
    p.inventory.splice(idx, 1);
    logMsg(g, `Vendeu ${it.name} por ${val}g`, "#f0c060");
  }
}

export function allocAttr(g: GameState, k: "str" | "agi" | "int" | "vit") {
  const p = g.player;
  if (p.attrPoints <= 0) return;
  p.attr[k]++;
  p.attrPoints--;
  if (k === "vit") p.maxHp += 5;
  if (k === "int") p.maxMp += 3;
}

// ---- save / load ----
const SAVE_KEY = "eternal_realms_save_v2";
export function save(g: GameState) {
  const data = {
    seed: g.world.seed,
    player: {
      pos: g.player.pos, hp: g.player.hp, maxHp: g.player.maxHp, mp: g.player.mp, maxMp: g.player.maxMp,
      level: g.player.level, xp: g.player.xp, xpNext: g.player.xpNext,
      attr: g.player.attr, attrPoints: g.player.attrPoints, gold: g.player.gold,
      inventory: g.player.inventory, equipped: g.player.equipped,
    },
    kills: g.kills, bossKills: g.bossKills, discovered: Array.from(g.discovered),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const g = newGame(data.seed);
    Object.assign(g.player, data.player);
    if (!g.player.minions) g.player.minions = [];
    if (!g.player.materials) g.player.materials = {};
    if (!g.player.recipesKnown) g.player.recipesKnown = new Set();
    g.player.skills = classSkills(g.player.cls);
    g.kills = data.kills; g.bossKills = data.bossKills;
    g.discovered = new Set(data.discovered);
    g.camera = { x: g.player.pos.x, y: g.player.pos.y };
    return g;
  } catch { return null; }
}
export function wipeSave() { localStorage.removeItem(SAVE_KEY); }
export { BIOMES, RARITY_COLOR };
