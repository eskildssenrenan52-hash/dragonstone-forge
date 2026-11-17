export const TILE = 48;
export const FIXED_WORLD_SIZE = 320; // 320x320 handcrafted fixed continent (15,360 x 15,360 px)

export type Vec = { x: number; y: number };

// Tile kinds:
// 0  grass / ground
// 1  water (blocking)
// 2  rock / mountain (blocking)
// 3  sand / shore
// 4  tree (blocking)
// 5  city / outpost emblem
// 6  stair down (enter cave / deeper floor)
// 7  stair up (return to previous floor / overworld)
// 8  torch / brazier (walkable light source)
// 9  cracked secret wall (blocking / secret room marker)
// 10 iron gate (walkable doorway)
// 11 steel / stone pillar (blocking)
// 12 chest (walkable trigger)
// 13 city cobblestone floor
// 14 city / building stone wall (blocking)
// 15 grand dragon fountain (blocking, animated light + water)
// 16 grand dungeon golden stair (enters 100-floor Dungeon of Asterion)
// 17 paved stone road (overworld highway)
// 18 wooden / stone bridge over water (walkable)
// 19 dragonstone forge anvil & furnace (blocking landmark in Central City)
// 20 alchemist / merchant stall (blocking landmark in Central City)
export type TileKind =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export type WorldTile = { kind: TileKind; biome: number };

export type CaveTheme = {
  label: string;
  floor: string;
  wall: string;
  accent: string;
  monsters: string[];
  boss: string;
};

export type Biome = {
  id: number;
  name: string;
  color: string;
  accent: string;
  danger: number; // 1..30
  monsters: string[];
  boss: string;
  caveTheme: CaveTheme;
};

export type City = {
  name: string;
  x: number;
  y: number;
  biome: number;
  tx: number;
  ty: number;
};

export type Stair = {
  x: number;
  y: number;
  biome: number;
  kind: "down" | "up" | "grand";
};

export type Landmark = {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  kind: "forge" | "alchemy" | "fountain" | "grand_stair" | "tavern" | "barracks" | "outpost";
  color: string;
};

export interface PlayMap {
  readonly size: number;
  readonly seed: number;
  isBlocked(x: number, y: number): boolean;
  get(x: number, y: number): WorldTile;
  readonly stairs: Stair[];
  readonly isCave: boolean;
  readonly biomeId: number;
  readonly spawn: Vec;
  readonly torches?: Array<{ x: number; y: number }>;
}

export type Rarity = "comum" | "incomum" | "raro" | "épico" | "lendário";
export type ItemQuality = "comum" | "bom" | "excelente" | "perfeito" | "obra-prima" | "lendario" | "divino";
export type Enchant =
  | "fogo" | "gelo" | "veneno" | "luz" | "sombra" | "raio"
  | "sangramento" | "vampirismo" | "critico" | "velocidade" | "mana" | "hp";

export type Item = {
  id: string;
  name: string;
  kind: "weapon" | "armor" | "potion" | "material";
  rarity: Rarity;
  power: number;
  icon: string;
  color: string;
  quality?: ItemQuality;
  enchant?: Enchant;
  gems?: string[];
  slots?: number;
  evolution?: number;
  isPickaxe?: boolean;
  pickaxeTier?: number;
};

export type ExtItem = Item;

export type PlayerClass = "melee" | "magic" | "paladin" | "necro" | "archer";
export type Profession =
  | "ferreiro" | "alquimista" | "joalheiro" | "engenheiro"
  | "encantador" | "carpinteiro" | "cozinheiro" | "tecelao";

export type Skill = {
  id: string;
  name: string;
  cost: number;
  cd: number;
  cur: number;
  desc: string;
  key: string;
};

export type ActorAction = "idle" | "walk" | "attack" | "hurt" | "ko";
export type FacingDir = "down" | "up" | "left" | "right";

export type Minion = {
  id: number;
  pos: Vec;
  vel: Vec;
  target: number | null;
  hp: number;
  maxHp: number;
  life: number;
  kind: "skeleton";
  attackCd: number;
  walkCycle: number;
  attackAnim: number;
  facingDir: FacingDir;
};

export type EnemyBehavior = "chaser" | "charger" | "kiter" | "flanker" | "titan";

export type Enemy = {
  id: number;
  pos: Vec;
  vel: Vec;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  level: number;
  name: string;
  biome: number;
  radius: number;
  color: string;
  isBoss: boolean;
  behavior: EnemyBehavior;
  attackCd: number;
  hitFlash: number;
  action: ActorAction;
  actionTimer: number;
  walkCycle: number;
  facing: Vec;
  facingDir: FacingDir;
  // Windup / telegraph / dash state
  windup: number;
  windupMax: number;
  telegraphKind: "charge" | "slam" | "shot" | null;
  telegraphTarget: Vec | null;
  dashTimer: number;
  dashVel: Vec;
  koTimer: number;
  squashX: number;
  squashY: number;
  strafeSign: number;
};

export type FloatingText = {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
};

export type Loot = {
  pos: Vec;
  item: Item;
  life: number;
  bobOffset: number;
};

export type Projectile = {
  pos: Vec;
  vel: Vec;
  life: number;
  maxLife: number;
  damage: number;
  from: "player" | "enemy";
  kind: "blade" | "arrow" | "arcane" | "fireball" | "necro" | "holy" | "enemy_orb" | "enemy_bolt";
  color: string;
  radius: number;
  aoeRadius?: number;
};

export type SlashArc = {
  x: number;
  y: number;
  angle: number;
  arc: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  heavy?: boolean;
};

export type Shockwave = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
};

export type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow: boolean;
  gravity: number;
};

export type OreKind =
  | "pedra" | "cobre" | "ferro_enferrujado" | "madeira_antiga" | "resina"
  | "cristal_verde" | "quartzo" | "ouro" | "arenito" | "obsidiana_negra"
  | "vidro_vulcanico" | "gelo_eterno" | "safira" | "cristal_congelado" | "prata"
  | "diamante_azul" | "mithril" | "titanio" | "adamantita" | "lava_solidificada"
  | "rubi_flamejante" | "ebano" | "cristal_sombrio" | "onix" | "alma_corrompida"
  | "minerio_abissal" | "estelarium" | "cristal_meteorico";

export type VeinKind = "normal" | "runner" | "exploder" | "teleporter" | "summoner";

export type Vein = {
  id: number;
  pos: Vec;
  ore: OreKind;
  hp: number;
  maxHp: number;
  remaining: number;
  kind: VeinKind;
  vel?: Vec;
  cooldown: number;
  life: number;
  hitFlash: number;
  biome: number;
};

export type EventKind = "meteor" | "bloodMoon" | "earthquake";

export type ActiveEvent = {
  kind: EventKind;
  life: number;
  totalLife: number;
  data?: { meteorCd?: number };
};

export type PanelId = "none" | "inventory" | "stats" | "help" | "map" | "mining" | "crafting";

export type InputState = {
  keys: Set<string>;
  justPressed: Set<string>;
  mouse: { x: number; y: number; down: boolean; downOnce: boolean };
};

export type PlayerState = {
  cls: PlayerClass;
  pos: Vec;
  vel: Vec;
  speed: number;
  hp: number;
  maxHp: number;
  ghostHp: number; // delayed damage drain bar
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  xpNext: number;
  attr: { str: number; agi: number; int: number; vit: number };
  attrPoints: number;
  gold: number;
  facing: Vec;
  facingDir: FacingDir;
  action: ActorAction;
  actionTimer: number;
  walkCycle: number;
  squashX: number;
  squashY: number;
  attackCd: number;
  invuln: number;
  hitFlash: number;
  dashTime: number;
  dashVel: Vec;
  inventory: Item[];
  equipped: { weapon?: Item; armor?: Item; pickaxe?: Item };
  miningLevel: number;
  miningXp: number;
  miningXpNext: number;
  professions: Record<Profession, { level: number; xp: number; xpNext: number }>;
  materials: Record<string, number>;
  recipesKnown: Set<string>;
  minions: Minion[];
  skills: Skill[];
  atk(): number;
  def(): number;
  gainXp(amount: number, log: (m: string, c?: string) => void): void;
  gainMiningXp(amount: number, log: (m: string, c?: string) => void): void;
  gainProfessionXp(prof: Profession, amount: number, log: (m: string, c?: string) => void): void;
};

export type FloorSnapshot = {
  enemies: Enemy[];
  loot: Loot[];
  projectiles: Projectile[];
  spawnTimer: number;
  bossTimer: number;
};

export type DefeatSnapshot = {
  level: number;
  kills: number;
  bossKills: number;
  goldLost: number;
  regionName: string;
  discoveredCount: number;
};

export type GameState = {
  world: import("./fixedWorld").FixedWorld;
  activeMap: PlayMap;
  activeCaveBiome: number | null;
  activeFloor: number; // 1 = overworld, 2..4 = cave
  activeGrandFloor: number; // 0 = not in grand dungeon, 1..100 = floor
  caves: Map<string, PlayMap>;
  grandFloors: Map<number, PlayMap>;
  snapshots: Map<string, FloorSnapshot>;
  player: PlayerState;
  enemies: Enemy[];
  loot: Loot[];
  projectiles: Projectile[];
  slashArcs: SlashArc[];
  shockwaves: Shockwave[];
  particles: Particle[];
  particleHead: number;
  floaters: FloatingText[];
  camera: Vec;
  trauma: number;
  hitstop: number;
  time: number;
  paused: boolean;
  panel: PanelId;
  log: Array<{ text: string; color: string; life: number }>;
  kills: number;
  bossKills: number;
  discovered: Set<number>;
  spawnTimer: number;
  bossTimer: number;
  stairCd: number;
  veins: Vein[];
  oreRespawn: number;
  activeEvent: ActiveEvent | null;
  eventCd: number;
  meteors: Array<{ x: number; y: number; vx: number; vy: number; life: number; targetY: number }>;
  craftingTab: Profession;
  autoFire: boolean;
  defeatSnapshot: DefeatSnapshot | null;
};
