import { sfx } from "./audio";
import { BIOMES, CLASS_INFO, makeItem, PROFESSION_LIST, rollRarity } from "./biomes";
import { initEvents, tickEvents } from "./events";
import {
  difficultyMultiplier,
  enemyNameForFloor,
  FixedCaveFloor,
  FixedGrandDungeonFloor,
  FixedWorld,
  GRAND_MAX_FLOOR,
} from "./fixedWorld";
import {
  _pendingMonsterSpawns,
  makePickaxe,
  seedFixedWorldVeins,
  spawnVeinNear,
  tryMineAt,
  updateVeins,
} from "./mining";
import {
  TILE,
  type Enemy,
  type EnemyBehavior,
  type FacingDir,
  type GameState,
  type InputState,
  type Item,
  type Particle,
  type PlayerClass,
  type PlayerState,
  type Profession,
  type Skill,
} from "./types";

let enemySeq = 0;
let minionSeq = 0;

const PARTICLE_POOL_SIZE = 512;

function createParticlePool(): Particle[] {
  const arr: Particle[] = new Array(PARTICLE_POOL_SIZE);
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    arr[i] = {
      active: false, x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1, size: 3, color: "#fff", glow: false, gravity: 0,
    };
  }
  return arr;
}

export function spawnParticle(
  g: GameState,
  x: number,
  y: number,
  vx: number,
  vy: number,
  color: string,
  life = 0.35,
  size = 3,
  glow = true,
  gravity = 0,
) {
  const pt = g.particles[g.particleHead];
  g.particleHead = (g.particleHead + 1) % g.particles.length;
  pt.active = true;
  pt.x = x;
  pt.y = y;
  pt.vx = vx;
  pt.vy = vy;
  pt.life = life;
  pt.maxLife = life;
  pt.size = size;
  pt.color = color;
  pt.glow = glow;
  pt.gravity = gravity;
}

export function spawnBurst(
  g: GameState,
  x: number,
  y: number,
  count: number,
  color: string,
  speed = 110,
  size = 3.5,
  gravity = 120,
) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const sp = speed * (0.45 + Math.random() * 0.8);
    spawnParticle(
      g,
      x,
      y,
      Math.cos(a) * sp,
      Math.sin(a) * sp - 20,
      color,
      0.28 + Math.random() * 0.25,
      size * (0.7 + Math.random() * 0.6),
      true,
      gravity,
    );
  }
}

export function computeDamage(rawAttack: number, targetDefense: number): number {
  return Math.max(1, Math.round(rawAttack - targetDefense * 0.65));
}

export function dirFromVec(dx: number, dy: number): FacingDir {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "down" : "up";
}

function classSkills(cls: PlayerClass): Skill[] {
  if (cls === "melee") {
    return [
      { id: "cleave", name: "Corte Amplo",    cost: 10, cd: 2.0, cur: 0, desc: "Arco pesado em cone frontal", key: "1" },
      { id: "shield", name: "Guarda de Ferro",cost: 12, cd: 6.0, cur: 0, desc: "Escudo invulnerável por 1.8s", key: "2" },
      { id: "slash",  name: "Redemoinho",     cost: 15, cd: 4.0, cur: 0, desc: "Onda giratória 360°", key: "3" },
      { id: "dash",   name: "Investida",      cost: 5,  cd: 1.8, cur: 0, desc: "Avanço explosivo com impacto", key: "4" },
    ];
  }
  if (cls === "magic") {
    return [
      { id: "bolt",     name: "Raio Arcano",   cost: 10, cd: 1.5, cur: 0, desc: "Rajada tripla veloz", key: "1" },
      { id: "fireball", name: "Bola de Fogo",  cost: 22, cd: 4.0, cur: 0, desc: "Explosão ígnea em área", key: "2" },
      { id: "heal",     name: "Cura Arcana",   cost: 15, cd: 5.0, cur: 0, desc: "Restaura vitalidade", key: "3" },
      { id: "dash",     name: "Piscar",        cost: 8,  cd: 2.2, cur: 0, desc: "Teleporte instantâneo", key: "4" },
    ];
  }
  if (cls === "paladin") {
    return [
      { id: "holy",   name: "Golpe Sagrado", cost: 12, cd: 2.5, cur: 0, desc: "Onda divina que cura ao acertar", key: "1" },
      { id: "shield", name: "Égide Divina",  cost: 14, cd: 6.0, cur: 0, desc: "Proteção sagrada por 2s", key: "2" },
      { id: "heal",   name: "Luz Curativa",  cost: 16, cd: 5.0, cur: 0, desc: "Restaura HP elevado", key: "3" },
      { id: "dash",   name: "Investida",     cost: 6,  cd: 2.0, cur: 0, desc: "Avanço de vanguarda", key: "4" },
    ];
  }
  if (cls === "necro") {
    return [
      { id: "drain",  name: "Dreno de Vida",    cost: 14, cd: 2.5, cur: 0, desc: "Suga vida ao redor", key: "1" },
      { id: "summon", name: "Invocar Esqueleto",cost: 22, cd: 5.0, cur: 0, desc: "Ergue guardião aliado", key: "2" },
      { id: "bolt",   name: "Seta Sombria",     cost: 12, cd: 1.8, cur: 0, desc: "Lança feixe necrótico", key: "3" },
      { id: "dash",   name: "Passo Espectral",  cost: 6,  cd: 2.0, cur: 0, desc: "Desliza pelas sombras", key: "4" },
    ];
  }
  return [
    { id: "volley", name: "Chuva de Flechas", cost: 14, cd: 2.5, cur: 0, desc: "Leque de 5 flechas perfurantes", key: "1" },
    { id: "evade",  name: "Salto Tático",     cost: 8,  cd: 2.2, cur: 0, desc: "Recuo veloz para trás", key: "2" },
    { id: "heal",   name: "Erva Curativa",    cost: 14, cd: 5.0, cur: 0, desc: "Restaura HP em campo", key: "3" },
    { id: "dash",   name: "Disparo Veloz",    cost: 6,  cd: 2.0, cur: 0, desc: "Avanço ágil", key: "4" },
  ];
}

export function createPlayer(cls: PlayerClass = "melee"): PlayerState {
  const info = CLASS_INFO[cls];
  const profs = {} as Record<Profession, { level: number; xp: number; xpNext: number }>;
  for (const pr of PROFESSION_LIST) {
    profs[pr] = { level: 1, xp: 0, xpNext: 60 };
  }

  return {
    cls,
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    speed: 3.4,
    hp: info.base.hp,
    maxHp: info.base.hp,
    ghostHp: info.base.hp,
    mp: info.base.mp,
    maxMp: info.base.mp,
    level: 1,
    xp: 0,
    xpNext: 1000,
    attr: { str: info.base.str, agi: info.base.agi, int: info.base.int, vit: info.base.vit },
    attrPoints: 0,
    gold: 25,
    facing: { x: 0, y: -1 },
    facingDir: "up",
    action: "idle",
    actionTimer: 0,
    walkCycle: 0,
    squashX: 1,
    squashY: 1,
    attackCd: 0,
    invuln: 0,
    hitFlash: 0,
    dashTime: 0,
    dashVel: { x: 0, y: 0 },
    inventory: [
      { id: "starter_pot", name: "Poção Menor", kind: "potion", rarity: "comum", power: 45, icon: "🧪", color: "#c8c8c8" },
    ],
    equipped: {
      pickaxe: makePickaxe(1),
    },
    miningLevel: 1,
    miningXp: 0,
    miningXpNext: 40,
    professions: profs,
    materials: { pedra: 3, cobre: 2, madeira_antiga: 2, resina: 1 },
    recipesKnown: new Set(),
    minions: [],
    skills: classSkills(cls),
    atk() {
      const wpn = this.equipped.weapon?.power ?? 0;
      const stat = this.cls === "magic" || this.cls === "necro"
        ? this.attr.int * 2.1
        : this.cls === "archer"
          ? this.attr.agi * 1.9 + this.attr.str * 0.4
          : this.attr.str * 2.0;
      return Math.floor(stat + wpn + this.level * 2);
    },
    def() {
      const arm = this.equipped.armor?.power ?? 0;
      return Math.floor(this.attr.vit * 1.4 + arm);
    },
    gainXp(amount: number, log) {
      this.xp += amount;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.attrPoints += 5;
        this.xpNext = Math.floor(this.xpNext * 1.35 + 400);
        this.maxHp += 15;
        this.hp = this.maxHp;
        this.ghostHp = this.maxHp;
        this.maxMp += 5;
        this.mp = this.maxMp;
        sfx.playLevelUp();
        log(`Subiu para o nível ${this.level}! +5 pontos de atributo.`, "#f4c85b");
      }
    },
    gainMiningXp(amount: number, log) {
      this.miningXp += amount;
      while (this.miningXp >= this.miningXpNext && this.miningLevel < 999) {
        this.miningXp -= this.miningXpNext;
        this.miningLevel++;
        this.miningXpNext = Math.floor(this.miningXpNext * 1.12 + 12);
        log(`Mineração subiu para nível ${this.miningLevel}!`, "#8fcfff");
      }
    },
    gainProfessionXp(prof, amount, log) {
      const pr = this.professions[prof];
      pr.xp += amount;
      while (pr.xp >= pr.xpNext && pr.level < 999) {
        pr.xp -= pr.xpNext;
        pr.level++;
        pr.xpNext = Math.floor(pr.xpNext * 1.15 + 20);
        log(`${prof.toUpperCase()} subiu para nível ${pr.level}!`, "#f4c85b");
      }
    },
  };
}

let cachedWorld: FixedWorld | null = null;
export function getSharedFixedWorld(): FixedWorld {
  if (!cachedWorld) {
    cachedWorld = new FixedWorld();
  }
  return cachedWorld;
}

export function newGame(cls: PlayerClass = "melee"): GameState {
  const world = getSharedFixedWorld();
  const player = createPlayer(cls);
  player.pos.x = world.spawn.x;
  player.pos.y = world.spawn.y;

  const g: GameState = {
    world,
    activeMap: world,
    activeCaveBiome: null,
    activeFloor: 1,
    activeGrandFloor: 0,
    caves: new Map(),
    grandFloors: new Map(),
    snapshots: new Map(),
    player,
    enemies: [],
    loot: [],
    projectiles: [],
    slashArcs: [],
    shockwaves: [],
    particles: createParticlePool(),
    particleHead: 0,
    floaters: [],
    camera: { x: player.pos.x, y: player.pos.y },
    trauma: 0,
    hitstop: 0,
    time: 0,
    paused: false,
    panel: "none",
    log: [
      { text: "Bem-vindo à Cidade Central de Asterion.", color: "#f4c85b", life: 12 },
      { text: "Explore o mundo fixo: Forja [B], Mineração [N], Mapa [M], Escada Dourada ao norte.", color: "#e8d8b8", life: 12 },
    ],
    kills: 0,
    bossKills: 0,
    discovered: new Set([1]),
    spawnTimer: 1.5,
    bossTimer: 35,
    stairCd: 0,
    veins: [],
    oreRespawn: 0,
    activeEvent: null,
    eventCd: 110,
    meteors: [],
    craftingTab: "ferreiro",
    autoFire: false,
    defeatSnapshot: null,
  };

  seedFixedWorldVeins(g);
  initEvents(g);
  return g;
}

export function logMsg(g: GameState, text: string, color = "#f3e6c8") {
  g.log.unshift({ text, color, life: 8 });
  if (g.log.length > 7) g.log.pop();
}

function inGrand(g: GameState): boolean {
  return g.activeGrandFloor > 0;
}

function floorKey(g: GameState): string {
  if (inGrand(g)) return `grand:${g.activeGrandFloor}`;
  return g.activeCaveBiome ? `${g.activeCaveBiome}:${g.activeFloor}` : "overworld";
}

function collides(g: GameState, x: number, y: number, r = 14): boolean {
  const pts = [
    [x - r, y - r],
    [x + r, y - r],
    [x - r, y + r],
    [x + r, y + r],
  ];
  for (const [px, py] of pts) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (g.activeMap.isBlocked(tx, ty)) return true;
  }
  return false;
}

function moveEntity(g: GameState, pos: { x: number; y: number }, dx: number, dy: number, r = 14) {
  const nx = pos.x + dx;
  if (!collides(g, nx, pos.y, r)) pos.x = nx;
  const ny = pos.y + dy;
  if (!collides(g, pos.x, ny, r)) pos.y = ny;
}

function pickBehavior(name: string, isBoss: boolean): EnemyBehavior {
  if (isBoss) return "titan";
  const n = name.toLowerCase();
  if (n.includes("mago") || n.includes("brux") || n.includes("arqueiro") || n.includes("necro") || n.includes("espectro") || n.includes("elemental") || n.includes("alquim")) {
    return "kiter";
  }
  if (n.includes("lobo") || n.includes("javali") || n.includes("onça") || n.includes("urso") || n.includes("cavaleiro") || n.includes("berserker")) {
    return "charger";
  }
  if (n.includes("aranha") || n.includes("assassino") || n.includes("bandido") || n.includes("salteador") || n.includes("pirata")) {
    return "flanker";
  }
  return "chaser";
}

function spawnEnemyNear(g: GameState, cx: number, cy: number, boss = false, exactSpot = false) {
  const isGrand = inGrand(g);
  const inCave = !!g.activeCaveBiome;
  const tries = exactSpot ? 1 : 24;

  for (let i = 0; i < tries; i++) {
    const ang = (i / Math.max(1, tries)) * Math.PI * 2 + Math.random() * 0.5;
    const dist = exactSpot ? 28 : isGrand ? 240 + Math.random() * 200 : inCave ? 220 + Math.random() * 220 : 340 + Math.random() * 340;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    const maxCoord = g.activeMap.size * TILE;
    if (x < 64 || y < 64 || x > maxCoord - 64 || y > maxCoord - 64) continue;
    if (collides(g, x, y, 14)) continue;

    // Never spawn inside Asterion Central City safe zone!
    if (!inCave && !isGrand) {
      const distCity = Math.hypot(x - g.world.spawn.x, y - g.world.spawn.y);
      if (distCity < TILE * 22) continue;
    }

    if (isGrand) {
      const floor = g.activeGrandFloor;
      const mul = difficultyMultiplier(floor);
      const level = Math.max(1, Math.floor(1 + floor * 1.3 + (boss ? 8 : 0)));
      const name = enemyNameForFloor(floor, boss, i + g.enemies.length);
      const maxHp = Math.floor((boss ? 360 : 42) * mul * 2.5);
      const accents = ["#c8a060", "#8090a0", "#a08040", "#708098", "#b06040"];
      g.enemies.push({
        id: ++enemySeq,
        pos: { x, y }, vel: { x: 0, y: 0 },
        hp: maxHp, maxHp,
        atk: Math.floor((boss ? 18 : 9) * mul * 2.5),
        def: Math.floor((boss ? 7 : 3) * mul * 2),
        speed: boss ? 1.8 : 2.1,
        level, name, biome: 0,
        radius: boss ? 26 : 15,
        color: boss ? "#f04060" : accents[floor % accents.length],
        isBoss: boss,
        behavior: pickBehavior(name, boss),
        attackCd: 0.6,
        hitFlash: 0,
        action: "idle",
        actionTimer: 0,
        walkCycle: 0,
        facing: { x: -1, y: 0 },
        facingDir: "left",
        windup: 0,
        windupMax: 0.45,
        telegraphKind: null,
        telegraphTarget: null,
        dashTimer: 0,
        dashVel: { x: 0, y: 0 },
        koTimer: 0,
        squashX: 1,
        squashY: 1,
        strafeSign: enemySeq % 2 === 0 ? 1 : -1,
      });
      if (boss) logMsg(g, `${name} surgiu no ${floor}º andar!`, "#ff5868");
      return;
    }

    const biomeId = inCave ? g.activeCaveBiome! : g.activeMap.get(Math.floor(x / TILE), Math.floor(y / TILE)).biome || 1;
    const b = BIOMES.find(bb => bb.id === biomeId) ?? BIOMES[0];
    const dangerBoost = inCave ? 3 : 0;
    const level = Math.max(1, b.danger + dangerBoost + (boss ? 5 : 0));
    const pool = inCave ? b.caveTheme.monsters : b.monsters;
    const name = boss ? (inCave ? b.caveTheme.boss : b.boss) : pool[enemySeq % pool.length];
    const maxHp = boss ? 320 + level * 70 : 40 + level * 20;
    const accent = inCave ? b.caveTheme.accent : b.color;

    g.enemies.push({
      id: ++enemySeq,
      pos: { x, y }, vel: { x: 0, y: 0 },
      hp: maxHp, maxHp,
      atk: (boss ? 14 : 7) + level * 2.5,
      def: Math.floor(level * 1.4),
      speed: boss ? 1.75 : 2.05,
      level, name, biome: biomeId,
      radius: boss ? 25 : 15,
      color: boss ? "#f04060" : accent,
      isBoss: boss,
      behavior: pickBehavior(name, boss),
      attackCd: 0.5,
      hitFlash: 0,
      action: "idle",
      actionTimer: 0,
      walkCycle: 0,
      facing: { x: -1, y: 0 },
      facingDir: "left",
      windup: 0,
      windupMax: 0.45,
      telegraphKind: null,
      telegraphTarget: null,
      dashTimer: 0,
      dashVel: { x: 0, y: 0 },
      koTimer: 0,
      squashX: 1,
      squashY: 1,
      strafeSign: enemySeq % 2 === 0 ? 1 : -1,
    });
    if (boss) logMsg(g, `${name} apareceu em ${b.name}!`, "#ff5868");
    return;
  }
}

function dropLoot(g: GameState, e: Enemy) {
  const p = g.player;
  const mult = g.activeEvent?.kind === "bloodMoon" ? 3 : 1;
  const gold = Math.floor((e.level * (e.isBoss ? 24 : 5) + Math.random() * e.level * 5) * mult);
  p.gold += gold;
  g.floaters.push({
    x: e.pos.x, y: e.pos.y - 16, text: `+${gold}g`, color: "#f4c85b",
    life: 1.2, maxLife: 1.2, vy: -32, scale: 1,
  });
  p.gainXp(e.isBoss ? e.level * 55 : e.level * 15, (m, c) => logMsg(g, m, c));

  const chance = e.isBoss ? 1 : inGrand(g) ? 0.55 : g.activeCaveBiome ? 0.45 : 0.35;
  if (Math.random() < chance) {
    const kinds: Array<Item["kind"]> = ["weapon", "armor", "potion", "material"];
    const kind = e.isBoss ? (Math.random() < 0.5 ? "weapon" : "armor") : kinds[Math.floor(Math.random() * kinds.length)];
    const luck = (e.isBoss ? 25 : 0) + (g.activeCaveBiome ? 10 : 0) + (inGrand(g) ? Math.min(50, g.activeGrandFloor) : 0);
    const rarity = rollRarity(luck);
    const tier = Math.max(1, Math.floor(e.level / 3) + 1 + (inGrand(g) ? Math.floor(g.activeGrandFloor / 8) : 0));
    const it = makeItem(kind, tier, rarity);
    g.loot.push({ pos: { x: e.pos.x, y: e.pos.y }, item: it, life: 40, bobOffset: Math.random() * 6 });
  }
}

function damageEnemy(g: GameState, e: Enemy, dmg: number, heavy = false) {
  if (e.koTimer > 0) return;
  const real = computeDamage(dmg, e.def);
  e.hp -= real;
  e.hitFlash = 0.14;
  e.action = "hurt";
  e.actionTimer = 0.16;
  e.squashX = 1.26;
  e.squashY = 0.76;

  // Knockback away from player
  const kx = e.pos.x - g.player.pos.x;
  const ky = e.pos.y - g.player.pos.y;
  const kd = Math.hypot(kx, ky) || 1;
  moveEntity(g, e.pos, (kx / kd) * (heavy ? 18 : 9), (ky / kd) * (heavy ? 18 : 9), e.radius);

  sfx.playHit(heavy);
  if (heavy) {
    g.hitstop = 0.045;
    g.trauma = Math.min(1, g.trauma + 0.22);
  } else {
    g.trauma = Math.min(1, g.trauma + 0.08);
  }

  spawnBurst(g, e.pos.x, e.pos.y - 4, heavy ? 12 : 6, heavy ? "#fff080" : "#ff6868", heavy ? 140 : 95);
  g.floaters.push({
    x: e.pos.x + (Math.random() - 0.5) * 10,
    y: e.pos.y - e.radius - 6,
    text: `${real}`,
    color: heavy ? "#fff080" : "#ffffff",
    life: 0.75,
    maxLife: 0.75,
    vy: -48,
    scale: heavy ? 1.28 : 1.0,
  });

  if (e.hp <= 0) {
    e.hp = 0;
    e.koTimer = 0.34; // KO topple / dissolve transition
    e.action = "ko";
    e.telegraphKind = null;
    g.hitstop = 0.055;
    g.trauma = Math.min(1, g.trauma + (e.isBoss ? 0.55 : 0.2));
    sfx.playKill();
    spawnBurst(g, e.pos.x, e.pos.y, e.isBoss ? 28 : 14, e.color, 160, 4);
    g.kills++;
    if (e.isBoss) {
      g.bossKills++;
      g.shockwaves.push({ x: e.pos.x, y: e.pos.y, radius: 12, maxRadius: 140, color: "#f4c85b", life: 0.5, maxLife: 0.5 });
      logMsg(g, `Chefe derrotado: ${e.name}!`, "#f4c85b");
    }
    dropLoot(g, e);
  }
}

function damagePlayer(g: GameState, dmg: number) {
  const p = g.player;
  if (p.invuln > 0) return;
  const real = computeDamage(dmg, p.def());
  p.hp -= real;
  p.invuln = 0.55;
  p.hitFlash = 0.22;
  p.action = "hurt";
  p.actionTimer = 0.2;
  p.squashX = 1.24;
  p.squashY = 0.78;
  g.hitstop = 0.04;
  g.trauma = Math.min(1, g.trauma + 0.32);
  sfx.playPlayerHurt();
  spawnBurst(g, p.pos.x, p.pos.y, 10, "#ff4858", 120);
  g.floaters.push({
    x: p.pos.x, y: p.pos.y - 22, text: `-${real}`, color: "#ff5060",
    life: 0.9, maxLife: 0.9, vy: -36, scale: 1.15,
  });

  if (p.hp <= 0) {
    p.hp = 0;
    const goldLost = Math.floor(p.gold * 0.25);
    const curBiome = BIOMES.find(b => b.id === (g.activeCaveBiome ?? g.activeMap.get(Math.floor(p.pos.x / TILE), Math.floor(p.pos.y / TILE)).biome))?.name ?? "Asterion";
    g.defeatSnapshot = {
      level: p.level,
      kills: g.kills,
      bossKills: g.bossKills,
      goldLost,
      regionName: inGrand(g) ? `Masmorra Andar ${g.activeGrandFloor}` : curBiome,
      discoveredCount: g.discovered.size,
    };
  }
}

export function resurrectInCity(g: GameState) {
  const p = g.player;
  const lost = g.defeatSnapshot?.goldLost ?? Math.floor(p.gold * 0.25);
  p.gold = Math.max(0, p.gold - lost);
  p.hp = p.maxHp;
  p.ghostHp = p.maxHp;
  p.mp = p.maxMp;
  p.invuln = 1.2;
  g.defeatSnapshot = null;

  snapshotFloor(g);
  g.activeMap = g.world;
  g.activeCaveBiome = null;
  g.activeFloor = 1;
  g.activeGrandFloor = 0;
  restoreFloor(g, "overworld");
  p.pos.x = g.world.spawn.x;
  p.pos.y = g.world.spawn.y;
  g.camera.x = p.pos.x;
  g.camera.y = p.pos.y;
  g.stairCd = 1.4;
  logMsg(g, `Ressuscitado na Cidade Central de Asterion (-${lost}g).`, "#ff8060");
}

function useSkill(g: GameState, idx: number) {
  const p = g.player;
  const sk = p.skills[idx];
  if (!sk || sk.cur > 0 || p.mp < sk.cost) return;
  p.mp -= sk.cost;
  sk.cur = sk.cd || 2.5;
  p.action = "attack";
  p.actionTimer = 0.26;
  p.squashX = 1.22;
  p.squashY = 0.82;

  const fl = Math.hypot(p.facing.x, p.facing.y) || 1;
  const fx = p.facing.x / fl;
  const fy = p.facing.y / fl;
  const ang = Math.atan2(fy, fx);

  if (sk.id === "slash") {
    sfx.playHeavySwing();
    g.slashArcs.push({ x: p.pos.x, y: p.pos.y, angle: ang, arc: Math.PI * 1.9, radius: 74, color: "#f4c85b", life: 0.26, maxLife: 0.26, heavy: true });
    g.shockwaves.push({ x: p.pos.x, y: p.pos.y, radius: 14, maxRadius: 76, color: "#f4c85b", life: 0.25, maxLife: 0.25 });
    for (const e of [...g.enemies]) {
      if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < 82) {
        damageEnemy(g, e, p.atk() * 1.8, true);
      }
    }
  } else if (sk.id === "cleave") {
    sfx.playHeavySwing();
    g.slashArcs.push({ x: p.pos.x, y: p.pos.y, angle: ang, arc: Math.PI * 0.85, radius: 80, color: "#ff9050", life: 0.24, maxLife: 0.24, heavy: true });
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - p.pos.x;
      const dy = e.pos.y - p.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 88 && (dx * fx + dy * fy) / (d || 1) > 0.25) {
        damageEnemy(g, e, p.atk() * 1.9, true);
      }
    }
  } else if (sk.id === "shield") {
    sfx.playCast();
    p.invuln = 2.0;
    g.shockwaves.push({ x: p.pos.x, y: p.pos.y, radius: 10, maxRadius: 48, color: "#fff090", life: 0.35, maxLife: 0.35 });
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 24, text: "ESCUDO!", color: "#fff090", life: 1, maxLife: 1, vy: -24, scale: 1.1 });
  } else if (sk.id === "bolt") {
    sfx.playCast();
    for (let i = -1; i <= 1; i++) {
      const a = ang + i * 0.16;
      g.projectiles.push({
        pos: { x: p.pos.x, y: p.pos.y },
        vel: { x: Math.cos(a) * 11, y: Math.sin(a) * 11 },
        life: 1.1, maxLife: 1.1,
        damage: Math.floor(p.atk() * 1.35 + p.attr.int * 1.5),
        from: "player",
        kind: p.cls === "necro" ? "necro" : "arcane",
        color: p.cls === "necro" ? "#d678ff" : "#60d8ff",
        radius: 6,
      });
    }
  } else if (sk.id === "fireball") {
    sfx.playCast();
    g.projectiles.push({
      pos: { x: p.pos.x, y: p.pos.y },
      vel: { x: fx * 8.5, y: fy * 8.5 },
      life: 1.1, maxLife: 1.1,
      damage: Math.floor(p.atk() * 2.2 + p.attr.int * 2.5),
      from: "player",
      kind: "fireball",
      color: "#ff6828",
      radius: 9,
      aoeRadius: 88,
    });
  } else if (sk.id === "holy") {
    sfx.playHeavySwing();
    g.slashArcs.push({ x: p.pos.x, y: p.pos.y, angle: ang, arc: Math.PI * 0.9, radius: 72, color: "#fff090", life: 0.24, maxLife: 0.24, heavy: true });
    let hit = false;
    for (const e of [...g.enemies]) {
      if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < 78) {
        damageEnemy(g, e, p.atk() * 1.7 + p.attr.int, true);
        hit = true;
      }
    }
    if (hit) {
      const heal = 18 + p.attr.int * 2;
      p.hp = Math.min(p.maxHp, p.hp + heal);
      g.floaters.push({ x: p.pos.x, y: p.pos.y - 20, text: `+${heal}`, color: "#60ff90", life: 1, maxLife: 1, vy: -30, scale: 1 });
    }
  } else if (sk.id === "drain") {
    sfx.playCast();
    g.shockwaves.push({ x: p.pos.x, y: p.pos.y, radius: 12, maxRadius: 96, color: "#c050ff", life: 0.35, maxLife: 0.35 });
    let drained = 0;
    for (const e of [...g.enemies]) {
      if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < 100) {
        damageEnemy(g, e, p.atk() + p.attr.int * 2, true);
        drained += 8 + p.attr.int;
      }
    }
    if (drained > 0) {
      p.hp = Math.min(p.maxHp, p.hp + drained);
      g.floaters.push({ x: p.pos.x, y: p.pos.y - 20, text: `+${drained}`, color: "#e070ff", life: 1, maxLife: 1, vy: -30, scale: 1.1 });
    }
  } else if (sk.id === "summon") {
    sfx.playCast();
    if (p.minions.length >= 4) p.minions.shift();
    p.minions.push({
      id: ++minionSeq,
      pos: { x: p.pos.x + fx * 28, y: p.pos.y + fy * 28 },
      vel: { x: 0, y: 0 },
      target: null,
      hp: 55 + p.attr.int * 5,
      maxHp: 55 + p.attr.int * 5,
      life: 28,
      kind: "skeleton",
      attackCd: 0,
      walkCycle: 0,
      attackAnim: 0,
      facingDir: p.facingDir,
    });
    spawnBurst(g, p.pos.x + fx * 28, p.pos.y + fy * 28, 12, "#c878ff", 90);
    logMsg(g, "Esqueleto erguido!", "#c878ff");
  } else if (sk.id === "volley") {
    sfx.playBow();
    for (let i = -2; i <= 2; i++) {
      const a = ang + i * 0.14;
      g.projectiles.push({
        pos: { x: p.pos.x, y: p.pos.y },
        vel: { x: Math.cos(a) * 13, y: Math.sin(a) * 13 },
        life: 0.9, maxLife: 0.9,
        damage: Math.floor(p.atk() * 1.05 + p.attr.agi * 0.8),
        from: "player",
        kind: "arrow",
        color: "#b8f070",
        radius: 5,
      });
    }
  } else if (sk.id === "evade") {
    sfx.playSlash();
    p.dashTime = 0.16;
    p.dashVel = { x: -fx * 560, y: -fy * 560 };
    p.invuln = 0.4;
    spawnBurst(g, p.pos.x, p.pos.y, 8, "#a8f090", 80);
  } else if (sk.id === "heal") {
    sfx.playCast();
    const amt = Math.round(p.maxHp * 0.35 + p.attr.int * 2);
    p.hp = Math.min(p.maxHp, p.hp + amt);
    spawnBurst(g, p.pos.x, p.pos.y, 12, "#60ff90", 85);
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 20, text: `+${amt}`, color: "#60ff90", life: 1, maxLife: 1, vy: -30, scale: 1.1 });
  } else if (sk.id === "dash") {
    sfx.playHeavySwing();
    p.dashTime = 0.18;
    p.dashVel = { x: fx * 640, y: fy * 640 };
    p.invuln = 0.35;
    spawnBurst(g, p.pos.x, p.pos.y, 10, "#f4c85b", 100);
  }
}

function basicAttack(g: GameState) {
  const p = g.player;
  if (p.attackCd > 0) return;

  const fl = Math.hypot(p.facing.x, p.facing.y) || 1;
  const fx = p.facing.x / fl;
  const fy = p.facing.y / fl;
  const ang = Math.atan2(fy, fx);

  p.action = "attack";
  p.actionTimer = 0.22;
  p.squashX = 1.18;
  p.squashY = 0.84;

  if (p.cls === "melee" || p.cls === "paladin") {
    p.attackCd = 0.24;
    sfx.playSlash();
    const col = p.cls === "paladin" ? "#fff090" : "#e8f2ff";
    g.slashArcs.push({ x: p.pos.x, y: p.pos.y, angle: ang, arc: Math.PI * 0.72, radius: 58, color: col, life: 0.18, maxLife: 0.18 });
    // Direct melee cleave hit + short shock blade
    for (const e of [...g.enemies]) {
      const dx = e.pos.x - p.pos.x;
      const dy = e.pos.y - p.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 66 && (dx * fx + dy * fy) / (d || 1) > 0.1) {
        damageEnemy(g, e, p.atk(), false);
      }
    }
    return;
  }

  if (p.cls === "archer") {
    p.attackCd = 0.22;
    sfx.playBow();
    g.projectiles.push({
      pos: { x: p.pos.x + fx * 12, y: p.pos.y + fy * 12 },
      vel: { x: fx * 13, y: fy * 13 },
      life: 0.95, maxLife: 0.95,
      damage: p.atk(),
      from: "player",
      kind: "arrow",
      color: "#d4ff78",
      radius: 5,
    });
    return;
  }

  if (p.cls === "necro") {
    p.attackCd = 0.30;
    sfx.playCast();
    p.hp = Math.min(p.maxHp, p.hp + 1);
    g.projectiles.push({
      pos: { x: p.pos.x + fx * 12, y: p.pos.y + fy * 12 },
      vel: { x: fx * 9, y: fy * 9 },
      life: 1.0, maxLife: 1.0,
      damage: p.atk(),
      from: "player",
      kind: "necro",
      color: "#d678ff",
      radius: 6,
    });
    return;
  }

  // magic
  p.attackCd = 0.28;
  sfx.playCast();
  g.projectiles.push({
    pos: { x: p.pos.x + fx * 12, y: p.pos.y + fy * 12 },
    vel: { x: fx * 10, y: fy * 10 },
    life: 0.95, maxLife: 0.95,
    damage: p.atk(),
    from: "player",
    kind: "arcane",
    color: "#60d8ff",
    radius: 6,
  });
}

function snapshotFloor(g: GameState) {
  g.snapshots.set(floorKey(g), {
    enemies: g.enemies,
    loot: g.loot,
    projectiles: g.projectiles,
    spawnTimer: g.spawnTimer,
    bossTimer: g.bossTimer,
  });
}

function restoreFloor(g: GameState, key: string) {
  const snap = g.snapshots.get(key);
  if (snap) {
    g.enemies = snap.enemies;
    g.loot = snap.loot;
    g.projectiles = snap.projectiles;
    g.spawnTimer = snap.spawnTimer;
    g.bossTimer = snap.bossTimer;
  } else {
    g.enemies = [];
    g.loot = [];
    g.projectiles = [];
    g.spawnTimer = 1.0;
    g.bossTimer = 22;
  }
}

function getOrCreateCave(g: GameState, biomeId: number, floor: number): FixedCaveFloor {
  const key = `${biomeId}:${floor}`;
  let cave = g.caves.get(key) as FixedCaveFloor | undefined;
  if (!cave) {
    cave = new FixedCaveFloor(biomeId, floor);
    g.caves.set(key, cave);
  }
  return cave;
}

function descendCave(g: GameState, biomeId: number) {
  snapshotFloor(g);
  const nextFloor = g.activeFloor === 1 ? 2 : g.activeFloor + 1;
  if (nextFloor > 4) return;
  const cave = getOrCreateCave(g, biomeId, nextFloor);
  g.activeMap = cave;
  g.activeCaveBiome = biomeId;
  g.activeFloor = nextFloor;
  g.player.pos.x = cave.spawn.x;
  g.player.pos.y = cave.spawn.y;
  g.camera.x = g.player.pos.x;
  g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  sfx.playStair();
  const b = BIOMES.find(bb => bb.id === biomeId);
  if (b) {
    logMsg(g, `Desceu para: ${b.caveTheme.label} (${nextFloor}º andar).`, "#f4c85b");
  }
}

function ascendCave(g: GameState) {
  if (!g.activeCaveBiome) return;
  snapshotFloor(g);
  const biomeId = g.activeCaveBiome;
  const prevFloor = g.activeFloor - 1;
  if (prevFloor <= 1) {
    g.activeMap = g.world;
    g.activeCaveBiome = null;
    g.activeFloor = 1;
    const stair = g.world.stairs.find(s => s.biome === biomeId);
    g.player.pos.x = stair ? stair.x : g.world.spawn.x;
    g.player.pos.y = stair ? stair.y + TILE : g.world.spawn.y;
    g.camera.x = g.player.pos.x;
    g.camera.y = g.player.pos.y;
    restoreFloor(g, "overworld");
    g.stairCd = 1.4;
    sfx.playStair();
    logMsg(g, "Retornou à superfície de Asterion.", "#8fcfff");
    return;
  }
  const cave = getOrCreateCave(g, biomeId, prevFloor);
  g.activeMap = cave;
  g.activeFloor = prevFloor;
  const down = cave.stairs.find(s => s.kind === "down");
  g.player.pos.x = down ? down.x : cave.spawn.x;
  g.player.pos.y = down ? down.y : cave.spawn.y;
  g.camera.x = g.player.pos.x;
  g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  sfx.playStair();
}

function getOrCreateGrandFloor(g: GameState, floor: number): FixedGrandDungeonFloor {
  let f = g.grandFloors.get(floor) as FixedGrandDungeonFloor | undefined;
  if (!f) {
    f = new FixedGrandDungeonFloor(floor);
    g.grandFloors.set(floor, f);
  }
  return f;
}

function descendGrand(g: GameState) {
  snapshotFloor(g);
  const next = g.activeGrandFloor === 0 ? 1 : g.activeGrandFloor + 1;
  if (next > GRAND_MAX_FLOOR) return;
  const floor = getOrCreateGrandFloor(g, next);
  g.activeMap = floor;
  g.activeGrandFloor = next;
  g.activeCaveBiome = null;
  g.activeFloor = 1;
  g.player.pos.x = floor.spawn.x;
  g.player.pos.y = floor.spawn.y;
  g.camera.x = g.player.pos.x;
  g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  sfx.playStair();
  logMsg(g, `Entrou no ${next}º andar da Masmorra de Asterion.`, "#f4c85b");
}

function ascendGrand(g: GameState) {
  if (g.activeGrandFloor <= 0) return;
  snapshotFloor(g);
  const prev = g.activeGrandFloor - 1;
  if (prev <= 0) {
    g.activeMap = g.world;
    g.activeGrandFloor = 0;
    g.player.pos.x = g.world.grandStair.x;
    g.player.pos.y = g.world.grandStair.y + TILE * 1.5;
    g.camera.x = g.player.pos.x;
    g.camera.y = g.player.pos.y;
    restoreFloor(g, "overworld");
    g.stairCd = 1.4;
    sfx.playStair();
    logMsg(g, "Voltou à Cidade Central de Asterion.", "#8fcfff");
    return;
  }
  const floor = getOrCreateGrandFloor(g, prev);
  g.activeMap = floor;
  g.activeGrandFloor = prev;
  const down = floor.stairs.find(s => s.kind === "down");
  g.player.pos.x = down ? down.x : floor.spawn.x;
  g.player.pos.y = down ? down.y : floor.spawn.y;
  g.camera.x = g.player.pos.x;
  g.camera.y = g.player.pos.y;
  restoreFloor(g, floorKey(g));
  g.stairCd = 1.4;
  sfx.playStair();
}

function openChestAt(g: GameState, tx: number, ty: number) {
  if (!inGrand(g)) return;
  const map = g.activeMap as FixedGrandDungeonFloor;
  const ch = map.chests.find(c => c.x === tx && c.y === ty && !c.opened);
  if (!ch) return;
  ch.opened = true;
  map.tiles[map.idx(tx, ty)].kind = 0;
  const floor = g.activeGrandFloor;
  const gold = Math.floor(65 * floor * (ch.secret ? 2.5 : 1));
  g.player.gold += gold;
  sfx.playLevelUp();
  spawnBurst(g, tx * TILE + TILE / 2, ty * TILE + TILE / 2, 18, ch.secret ? "#d678ff" : "#f4c85b", 120);
  g.floaters.push({ x: tx * TILE + TILE / 2, y: ty * TILE, text: `+${gold}g`, color: "#f4c85b", life: 1.6, maxLife: 1.6, vy: -30, scale: 1.2 });
  logMsg(g, ch.secret ? `Baú Secreto aberto! +${gold}g` : `Baú aberto! +${gold}g`, "#f4c85b");

  const rewards = ch.secret ? 3 : 2;
  for (let i = 0; i < rewards; i++) {
    const kind = i === 0 ? (Math.random() < 0.5 ? "weapon" : "armor") : "potion";
    const rarity = rollRarity((ch.secret ? 30 : 12) + Math.min(45, floor));
    const tier = Math.max(1, Math.floor(floor / 5) + 1);
    const it = makeItem(kind, tier, rarity);
    const ang = (i / rewards) * Math.PI * 2;
    g.loot.push({
      pos: { x: tx * TILE + TILE / 2 + Math.cos(ang) * 26, y: ty * TILE + TILE / 2 + Math.sin(ang) * 26 },
      item: it, life: 90, bobOffset: i,
    });
  }
}

// ============================================================================
// Main Simulation Step
// ============================================================================
export function updateGame(g: GameState, rawDt: number, input: InputState, canvasW: number, canvasH: number) {
  const dt = Math.min(0.05, rawDt);
  g.time += dt;
  g.trauma = Math.max(0, g.trauma - dt * 1.9);

  if (g.paused || g.defeatSnapshot || g.panel !== "none") {
    input.justPressed.clear();
    input.mouse.downOnce = false;
    return;
  }

  // Hitstop freezes physics briefly on heavy impacts while particles/shake tick
  if (g.hitstop > 0) {
    g.hitstop = Math.max(0, g.hitstop - dt);
    updateVfxOnly(g, dt);
    input.justPressed.clear();
    input.mouse.downOnce = false;
    return;
  }

  g.stairCd = Math.max(0, g.stairCd - dt);
  const p = g.player;

  // Elastic squash/stretch spring back to (1,1)
  p.squashX += (1 - p.squashX) * Math.min(1, dt * 16);
  p.squashY += (1 - p.squashY) * Math.min(1, dt * 16);
  p.ghostHp += (p.hp - p.ghostHp) * Math.min(1, dt * 4.5);

  // Movement input
  let mx = 0;
  let my = 0;
  if (input.keys.has("w") || input.keys.has("arrowup")) my -= 1;
  if (input.keys.has("s") || input.keys.has("arrowdown")) my += 1;
  if (input.keys.has("a") || input.keys.has("arrowleft")) mx -= 1;
  if (input.keys.has("d") || input.keys.has("arrowright")) mx += 1;

  p.actionTimer = Math.max(0, p.actionTimer - dt);

  if (p.dashTime > 0) {
    p.dashTime = Math.max(0, p.dashTime - dt);
    moveEntity(g, p.pos, p.dashVel.x * dt, p.dashVel.y * dt, 13);
    if (Math.random() < 0.7) {
      spawnParticle(g, p.pos.x, p.pos.y + 4, 0, 0, "#f4c85b", 0.2, 4, true, 0);
    }
  } else if (mx !== 0 || my !== 0) {
    const l = Math.hypot(mx, my);
    const sprint = input.keys.has("shift") ? 1.42 : 1;
    const spd = p.speed * sprint * 60 * dt;
    const vx = (mx / l) * spd;
    const vy = (my / l) * spd;
    moveEntity(g, p.pos, vx, vy, 13);
    p.walkCycle += (Math.hypot(vx, vy) / TILE) * 1.3;
    if (p.actionTimer <= 0) {
      p.action = "walk";
    }
    if (!input.mouse.down) {
      p.facing = { x: mx / l, y: my / l };
      p.facingDir = dirFromVec(p.facing.x, p.facing.y);
    }
  } else if (p.actionTimer <= 0) {
    p.action = "idle";
  }

  // Pointer aim
  const worldMouseX = input.mouse.x - canvasW / 2 + g.camera.x;
  const worldMouseY = input.mouse.y - canvasH / 2 + g.camera.y;
  const adx = worldMouseX - p.pos.x;
  const ady = worldMouseY - p.pos.y;
  const al = Math.hypot(adx, ady);
  if (al > 8 && (input.mouse.down || input.mouse.downOnce || g.autoFire)) {
    p.facing = { x: adx / al, y: ady / al };
    p.facingDir = dirFromVec(p.facing.x, p.facing.y);
  }

  // Attack / Mine
  if (input.mouse.downOnce) {
    const mined = tryMineAt(g, worldMouseX, worldMouseY);
    if (!mined) basicAttack(g);
  } else if (input.mouse.down || g.autoFire) {
    const mined = tryMineAt(g, worldMouseX, worldMouseY);
    if (!mined) basicAttack(g);
  }

  // Skills 1..4 (edge-triggered)
  for (let i = 0; i < 4; i++) {
    if (input.justPressed.has(String(i + 1))) {
      useSkill(g, i);
    }
  }

  // Cooldowns & regen
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.hitFlash = Math.max(0, p.hitFlash - dt);
  p.mp = Math.min(p.maxMp, p.mp + dt * (2.6 + p.attr.int * 0.25));
  p.hp = Math.min(p.maxHp, p.hp + dt * (0.6 + p.attr.vit * 0.12));
  for (const s of p.skills) s.cur = Math.max(0, s.cur - dt);

  // Region discovery
  if (!g.activeCaveBiome && !inGrand(g)) {
    const t = g.activeMap.get(Math.floor(p.pos.x / TILE), Math.floor(p.pos.y / TILE));
    if (t.biome > 0 && !g.discovered.has(t.biome)) {
      g.discovered.add(t.biome);
      const b = BIOMES.find(bb => bb.id === t.biome);
      if (b) {
        sfx.playPickup();
        logMsg(g, `Nova região descoberta: ${b.name}!`, "#5ea8ff");
      }
    }
  }

  // Staircase transitions
  if (g.stairCd <= 0) {
    const t = g.activeMap.get(Math.floor(p.pos.x / TILE), Math.floor(p.pos.y / TILE));
    if (t.kind === 16 && !inGrand(g)) {
      descendGrand(g);
    } else if (inGrand(g) && t.kind === 6) {
      descendGrand(g);
    } else if (inGrand(g) && t.kind === 7) {
      ascendGrand(g);
    } else if (t.kind === 6) {
      const biome = g.activeCaveBiome ?? t.biome;
      if (g.activeFloor < 4 && biome > 0) descendCave(g, biome);
    } else if (t.kind === 7 && g.activeCaveBiome) {
      ascendCave(g);
    }
  }

  // Chest interaction
  if (inGrand(g)) {
    const tx = Math.floor(p.pos.x / TILE);
    const ty = Math.floor(p.pos.y / TILE);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (g.activeMap.get(tx + ox, ty + oy).kind === 12) {
          if (Math.hypot((tx + ox + 0.5) * TILE - p.pos.x, (ty + oy + 0.5) * TILE - p.pos.y) < 42) {
            openChestAt(g, tx + ox, ty + oy);
          }
        }
      }
    }
  }

  // Mining & Events
  updateVeins(g, dt);
  tickEvents(g, dt);
  if (_pendingMonsterSpawns.length > 0) {
    for (const req of _pendingMonsterSpawns.splice(0)) {
      for (let i = 0; i < req.count; i++) spawnEnemyNear(g, req.x, req.y, false, true);
    }
  }

  // Spawns (respecting safe Asterion Central City)
  const inCity = !g.activeCaveBiome && !inGrand(g);
  const inSafeZone = inCity && Math.hypot(p.pos.x - g.world.spawn.x, p.pos.y - g.world.spawn.y) < TILE * 22;
  const enemyCap = inGrand(g) ? 14 : g.activeCaveBiome ? 11 : 16;

  g.spawnTimer -= dt;
  if (!inSafeZone && g.spawnTimer <= 0 && g.enemies.filter(e => !e.isBoss && e.koTimer <= 0).length < enemyCap) {
    spawnEnemyNear(g, p.pos.x, p.pos.y, false);
    g.spawnTimer = inGrand(g) ? 1.0 : g.activeCaveBiome ? 1.3 : 1.8;
  }

  g.bossTimer -= dt;
  if (!inSafeZone && g.bossTimer <= 0) {
    if (g.enemies.filter(e => e.isBoss && e.koTimer <= 0).length < 1) {
      spawnEnemyNear(g, p.pos.x, p.pos.y, true);
    }
    g.bossTimer = inGrand(g) ? 55 : 85;
  }

  // Enemy AI (4 distinct policies + attack token limit + telegraphs + KO fade)
  let activeWindups = g.enemies.filter(e => e.windup > 0).length;
  const maxConcurrentAttackers = 4;

  for (const e of [...g.enemies]) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.attackCd = Math.max(0, e.attackCd - dt);
    e.actionTimer = Math.max(0, e.actionTimer - dt);
    e.squashX += (1 - e.squashX) * Math.min(1, dt * 14);
    e.squashY += (1 - e.squashY) * Math.min(1, dt * 14);

    if (e.koTimer > 0) {
      e.koTimer -= dt;
      if (e.koTimer <= 0) {
        g.enemies = g.enemies.filter(x => x !== e);
      }
      continue;
    }

    const dx = p.pos.x - e.pos.x;
    const dy = p.pos.y - e.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    const sight = e.isBoss ? 340 : 250;

    if (d > 1050 && !e.isBoss) {
      g.enemies = g.enemies.filter(x => x !== e);
      continue;
    }

    // Active charge dash
    if (e.dashTimer > 0) {
      e.dashTimer -= dt;
      moveEntity(g, e.pos, e.dashVel.x * dt, e.dashVel.y * dt, e.radius);
      if (d < e.radius + 16 && e.attackCd <= 0) {
        e.attackCd = 0.85;
        damagePlayer(g, e.atk * 1.25);
      }
      continue;
    }

    // Windup telegraph countdown
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        e.action = "attack";
        e.actionTimer = 0.28;
        if (e.telegraphKind === "charge" && e.telegraphTarget) {
          const tx = e.telegraphTarget.x - e.pos.x;
          const ty = e.telegraphTarget.y - e.pos.y;
          const td = Math.hypot(tx, ty) || 1;
          e.dashTimer = 0.28;
          e.dashVel = { x: (tx / td) * 340, y: (ty / td) * 340 };
          e.attackCd = 1.6;
        } else if (e.telegraphKind === "shot") {
          g.projectiles.push({
            pos: { x: e.pos.x, y: e.pos.y },
            vel: { x: (dx / d) * 6.5, y: (dy / d) * 6.5 },
            life: 1.8, maxLife: 1.8,
            damage: e.atk,
            from: "enemy",
            kind: "enemy_orb",
            color: "#ff5078",
            radius: 6,
          });
          e.attackCd = 1.5;
        } else if (e.telegraphKind === "slam") {
          g.shockwaves.push({ x: e.pos.x, y: e.pos.y, radius: 10, maxRadius: 82, color: "#ff4858", life: 0.35, maxLife: 0.35 });
          if (d < 84) damagePlayer(g, e.atk * 1.35);
          e.attackCd = 2.0;
        }
        e.telegraphKind = null;
        e.telegraphTarget = null;
      }
      continue;
    }

    if (d < sight) {
      e.facing = { x: dx / d, y: dy / d };
      e.facingDir = dirFromVec(e.facing.x, e.facing.y);
      const spd = e.speed * 60 * dt;

      if (e.behavior === "kiter") {
        // Maintain 140..200 px distance, fire telegraphed bolts
        if (d < 115) {
          moveEntity(g, e.pos, -(dx / d) * spd * 0.85, -(dy / d) * spd * 0.85, e.radius);
          e.walkCycle += spd / TILE;
          e.action = "walk";
        } else if (d > 195) {
          moveEntity(g, e.pos, (dx / d) * spd, (dy / d) * spd, e.radius);
          e.walkCycle += spd / TILE;
          e.action = "walk";
        } else if (e.attackCd <= 0 && activeWindups < maxConcurrentAttackers) {
          e.windup = 0.45;
          e.windupMax = 0.45;
          e.telegraphKind = "shot";
          e.telegraphTarget = { x: p.pos.x, y: p.pos.y };
          activeWindups++;
        } else if (e.actionTimer <= 0) {
          e.action = "idle";
        }
      } else if (e.behavior === "charger") {
        if (d > 115) {
          moveEntity(g, e.pos, (dx / d) * spd * 1.05, (dy / d) * spd * 1.05, e.radius);
          e.walkCycle += spd / TILE;
          e.action = "walk";
        } else if (e.attackCd <= 0 && activeWindups < maxConcurrentAttackers) {
          e.windup = 0.48;
          e.windupMax = 0.48;
          e.telegraphKind = "charge";
          e.telegraphTarget = { x: p.pos.x, y: p.pos.y };
          activeWindups++;
        } else if (d < e.radius + 16 && e.attackCd <= 0) {
          e.attackCd = 0.9;
          e.action = "attack";
          e.actionTimer = 0.25;
          damagePlayer(g, e.atk);
        }
      } else if (e.behavior === "flanker") {
        // Circle around player then lunge
        const perpX = (-dy / d) * e.strafeSign;
        const perpY = (dx / d) * e.strafeSign;
        const mixX = (dx / d) * 0.68 + perpX * 0.65;
        const mixY = (dy / d) * 0.68 + perpY * 0.65;
        moveEntity(g, e.pos, mixX * spd, mixY * spd, e.radius);
        e.walkCycle += spd / TILE;
        e.action = "walk";
        if (d < e.radius + 18 && e.attackCd <= 0) {
          e.attackCd = 0.85;
          e.action = "attack";
          e.actionTimer = 0.25;
          damagePlayer(g, e.atk);
        }
      } else if (e.behavior === "titan") {
        if (d > 54) {
          moveEntity(g, e.pos, (dx / d) * spd, (dy / d) * spd, e.radius);
          e.walkCycle += spd / TILE;
          e.action = "walk";
        } else if (e.attackCd <= 0 && activeWindups < maxConcurrentAttackers) {
          e.windup = 0.62;
          e.windupMax = 0.62;
          e.telegraphKind = "slam";
          e.telegraphTarget = { x: e.pos.x, y: e.pos.y };
          activeWindups++;
        }
      } else {
        // chaser
        if (d > e.radius + 14) {
          moveEntity(g, e.pos, (dx / d) * spd, (dy / d) * spd, e.radius);
          e.walkCycle += spd / TILE;
          if (e.actionTimer <= 0) e.action = "walk";
        }
        if (d < e.radius + 18 && e.attackCd <= 0) {
          e.attackCd = 0.9;
          e.action = "attack";
          e.actionTimer = 0.25;
          damagePlayer(g, e.atk);
        }
      }
    } else if (e.actionTimer <= 0) {
      e.action = "idle";
    }
  }

  // Necromancer skeleton minions
  for (const m of [...p.minions]) {
    m.life -= dt;
    m.attackCd = Math.max(0, m.attackCd - dt);
    m.attackAnim = Math.max(0, m.attackAnim - dt);
    if (m.life <= 0 || m.hp <= 0) {
      p.minions = p.minions.filter(x => x !== m);
      continue;
    }
    let best: Enemy | null = null;
    let bestD = 360;
    for (const e of g.enemies) {
      if (e.koTimer > 0) continue;
      const d = Math.hypot(e.pos.x - m.pos.x, e.pos.y - m.pos.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      const dx = best.pos.x - m.pos.x;
      const dy = best.pos.y - m.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 24) {
        moveEntity(g, m.pos, (dx / d) * 140 * dt, (dy / d) * 140 * dt, 10);
        m.walkCycle += dt * 3;
      }
      if (d < 32 && m.attackCd <= 0) {
        m.attackCd = 0.7;
        m.attackAnim = 0.25;
        damageEnemy(g, best, Math.floor(8 + p.attr.int * 1.4 + p.level));
      }
    } else {
      const dx = p.pos.x - m.pos.x;
      const dy = p.pos.y - m.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 56) {
        moveEntity(g, m.pos, (dx / d) * 115 * dt, (dy / d) * 115 * dt, 10);
        m.walkCycle += dt * 2.5;
      }
    }
  }

  // Projectiles
  for (const pr of [...g.projectiles]) {
    pr.pos.x += pr.vel.x * 60 * dt;
    pr.pos.y += pr.vel.y * 60 * dt;
    pr.life -= dt;

    if (Math.random() < 0.65) {
      spawnParticle(g, pr.pos.x, pr.pos.y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, pr.color, 0.18, 2.5, true, 0);
    }

    if (pr.life <= 0 || collides(g, pr.pos.x, pr.pos.y, 4)) {
      if (pr.aoeRadius) {
        g.shockwaves.push({ x: pr.pos.x, y: pr.pos.y, radius: 10, maxRadius: pr.aoeRadius, color: pr.color, life: 0.32, maxLife: 0.32 });
        spawnBurst(g, pr.pos.x, pr.pos.y, 14, pr.color, 150);
      }
      g.projectiles = g.projectiles.filter(x => x !== pr);
      continue;
    }

    if (pr.from === "player") {
      let hit = false;
      for (const e of [...g.enemies]) {
        if (e.koTimer > 0) continue;
        if (Math.hypot(e.pos.x - pr.pos.x, e.pos.y - pr.pos.y) < e.radius + pr.radius) {
          if (pr.aoeRadius) {
            for (const ae of [...g.enemies]) {
              if (ae.koTimer <= 0 && Math.hypot(ae.pos.x - pr.pos.x, ae.pos.y - pr.pos.y) < pr.aoeRadius) {
                damageEnemy(g, ae, pr.damage, true);
              }
            }
            g.shockwaves.push({ x: pr.pos.x, y: pr.pos.y, radius: 10, maxRadius: pr.aoeRadius, color: pr.color, life: 0.32, maxLife: 0.32 });
          } else {
            damageEnemy(g, e, pr.damage, false);
          }
          hit = true;
          break;
        }
      }
      if (hit) g.projectiles = g.projectiles.filter(x => x !== pr);
    } else {
      if (Math.hypot(p.pos.x - pr.pos.x, p.pos.y - pr.pos.y) < 14 + pr.radius) {
        damagePlayer(g, pr.damage);
        g.projectiles = g.projectiles.filter(x => x !== pr);
      }
    }
  }

  // Loot pickup
  for (const l of [...g.loot]) {
    l.life -= dt;
    if (Math.hypot(l.pos.x - p.pos.x, l.pos.y - p.pos.y) < 30) {
      if (p.inventory.length < 32) {
        p.inventory.push(l.item);
        g.loot = g.loot.filter(x => x !== l);
        sfx.playPickup();
        logMsg(g, `Coletou ${l.item.name}`, l.item.color);
      }
    } else if (l.life <= 0) {
      g.loot = g.loot.filter(x => x !== l);
    }
  }

  updateVfxOnly(g, dt);

  for (const lg of g.log) lg.life -= dt;
  g.log = g.log.filter(l => l.life > 0);

  // Smooth camera follow
  g.camera.x += (p.pos.x - g.camera.x) * Math.min(1, dt * 8);
  g.camera.y += (p.pos.y - g.camera.y) * Math.min(1, dt * 8);

  input.justPressed.clear();
  input.mouse.downOnce = false;
}

function updateVfxOnly(g: GameState, dt: number) {
  for (const s of g.slashArcs) s.life -= dt;
  g.slashArcs = g.slashArcs.filter(s => s.life > 0);

  for (const w of g.shockwaves) {
    w.life -= dt;
    const t = 1 - Math.max(0, w.life) / w.maxLife;
    w.radius = 10 + (w.maxRadius - 10) * t;
  }
  g.shockwaves = g.shockwaves.filter(w => w.life > 0);

  for (const pt of g.particles) {
    if (!pt.active) continue;
    pt.life -= dt;
    if (pt.life <= 0) {
      pt.active = false;
      continue;
    }
    pt.vy += pt.gravity * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }

  for (const f of g.floaters) {
    f.life -= dt;
    f.y += f.vy * dt;
    f.vy *= 0.94;
  }
  g.floaters = g.floaters.filter(f => f.life > 0);
}

export function useInventoryItem(g: GameState, idx: number) {
  const p = g.player;
  const it = p.inventory[idx];
  if (!it) return;
  sfx.playClick();
  if (it.kind === "potion") {
    p.hp = Math.min(p.maxHp, p.hp + it.power);
    g.floaters.push({ x: p.pos.x, y: p.pos.y - 18, text: `+${it.power}`, color: "#60ff80", life: 1, maxLife: 1, vy: -30, scale: 1.1 });
    p.inventory.splice(idx, 1);
    logMsg(g, `Usou ${it.name} (+${it.power} HP)`, "#60ff80");
  } else if (it.isPickaxe) {
    const cur = p.equipped.pickaxe;
    p.equipped.pickaxe = it;
    p.inventory.splice(idx, 1);
    if (cur) p.inventory.push(cur);
    logMsg(g, `Equipou ${it.name}`, it.color);
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
    logMsg(g, `Vendeu ${it.name} por ${val}g`, "#f4c85b");
  }
}

export function sellInventoryItem(g: GameState, idx: number) {
  const p = g.player;
  const it = p.inventory[idx];
  if (!it) return;
  const val = Math.max(5, it.power * 2);
  p.gold += val;
  p.inventory.splice(idx, 1);
  sfx.playPickup();
  logMsg(g, `Vendeu ${it.name} por ${val}g`, "#f4c85b");
}

export function allocAttr(g: GameState, k: "str" | "agi" | "int" | "vit") {
  const p = g.player;
  if (p.attrPoints <= 0) return;
  p.attr[k]++;
  p.attrPoints--;
  if (k === "vit") {
    p.maxHp += 6;
    p.hp = Math.min(p.maxHp, p.hp + 6);
  }
  if (k === "int") {
    p.maxMp += 4;
    p.mp = Math.min(p.maxMp, p.mp + 4);
  }
  sfx.playClick();
}

// ============================================================================
// Save / Load Serialization
// ============================================================================
const SAVE_KEY = "dragonstone_forge_fixed_v1";

export function serializeGameSave(g: GameState): string {
  return JSON.stringify({
    player: {
      cls: g.player.cls,
      pos: g.player.pos,
      hp: g.player.hp,
      maxHp: g.player.maxHp,
      mp: g.player.mp,
      maxMp: g.player.maxMp,
      level: g.player.level,
      xp: g.player.xp,
      xpNext: g.player.xpNext,
      attr: g.player.attr,
      attrPoints: g.player.attrPoints,
      gold: g.player.gold,
      inventory: g.player.inventory,
      equipped: g.player.equipped,
      miningLevel: g.player.miningLevel,
      miningXp: g.player.miningXp,
      miningXpNext: g.player.miningXpNext,
      professions: g.player.professions,
      materials: g.player.materials,
      recipesKnown: Array.from(g.player.recipesKnown),
    },
    kills: g.kills,
    bossKills: g.bossKills,
    discovered: Array.from(g.discovered),
  });
}

export function saveGame(g: GameState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SAVE_KEY, serializeGameSave(g));
}

export function hasSave(): boolean {
  if (typeof localStorage === "undefined") return false;
  return !!localStorage.getItem(SAVE_KEY);
}

export function loadGame(): GameState | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const cls = (data.player?.cls as PlayerClass) ?? "melee";
    const g = newGame(cls);
    const savedP = data.player ?? {};
    Object.assign(g.player, {
      ...savedP,
      recipesKnown: new Set(savedP.recipesKnown ?? []),
    });
    g.player.ghostHp = g.player.hp;
    g.player.skills = classSkills(g.player.cls);
    g.kills = data.kills ?? 0;
    g.bossKills = data.bossKills ?? 0;
    g.discovered = new Set(data.discovered ?? [1]);
    g.camera = { x: g.player.pos.x, y: g.player.pos.y };
    return g;
  } catch {
    return null;
  }
}

export function wipeSave() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}
