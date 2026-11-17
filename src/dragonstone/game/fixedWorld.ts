import { BIOMES, CITY_NAMES } from "./biomes";
import {
  FIXED_WORLD_SIZE,
  TILE,
  type City,
  type Landmark,
  type PlayMap,
  type Stair,
  type TileKind,
  type WorldTile,
} from "./types";

export const GRAND_MAX_FLOOR = 100;
export const DIFFICULTY_PER_FLOOR = 1.2;

export const GRAND_ENEMIES: { pool: string[]; boss: string }[] = [
  { pool: ["Rato de Cripta", "Servo Enferrujado", "Aprendiz Sombrio", "Morcego Fétido"],           boss: "Guarda da Entrada" },
  { pool: ["Esqueleto Rachado", "Ladino do Portão", "Kobold de Ferro", "Aranha do Corredor"],       boss: "Executor Enferrujado" },
  { pool: ["Cavaleiro Caído", "Zumbi Blindado", "Sombra Menor", "Golem de Escombros"],              boss: "Carcereiro de Aço" },
  { pool: ["Espectro do Calabouço", "Bruxo das Grades", "Trol das Câmaras", "Duelista Ossuário"],   boss: "Duque de Ferro" },
  { pool: ["Necromante Menor", "Homúnculo de Cobre", "Verme das Paredes", "Aranha de Obsidiana"],   boss: "Mestre das Chaves" },
  { pool: ["Golem de Bronze", "Elemental do Portão", "Servo do Vazio", "Assombração de Ferro"],     boss: "Alquimista Trancado" },
  { pool: ["Vampiro do Corredor", "Cavaleiro Espectral", "Berserker Rachado", "Sacerdote Sombrio"], boss: "Baronesa da Cinza" },
  { pool: ["Golem de Aço", "Wyvern do Poço", "Xamã Corrompido", "Anão Amaldiçoado"],                boss: "Guardião Colossal" },
  { pool: ["Demônio Menor", "Titã de Ferro", "Necromante Ancião", "Serva do Abismo"],               boss: "Herald do Abismo" },
  { pool: ["Arauto Sombrio", "Cavaleiro do Vazio", "Elemental Primal", "Aberrante Antigo"],         boss: "Senhor do Fim" },
];

export function enemyNameForFloor(floor: number, boss: boolean, indexHint = 0): string {
  const t = Math.min(9, Math.floor((floor - 1) / 10));
  const tier = GRAND_ENEMIES[t];
  const suffix = floor <= 20 ? "" : floor <= 50 ? " Ancião" : floor <= 80 ? " Colossal" : " Cósmico";
  if (boss) return `${tier.boss}${suffix}`;
  const name = tier.pool[indexHint % tier.pool.length];
  return `${name}${suffix}`;
}

export function difficultyMultiplier(floor: number): number {
  return Math.pow(DIFFICULTY_PER_FLOOR, Math.max(0, floor - 1));
}

// Deterministic coordinate hash (strictly pure math, no RNG state)
export function coordHash(x: number, y: number, salt = 0): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// Handcrafted fixed geographical placement of all 40 biomes on the 320x320 continent.
// Biome 1 (Planícies de Aurora + Central City of Asterion) sits at the heart (160, 160).
// Inner ring: gentle early regions; Middle ring: mid-tier biomes; Outer ring: endgame realms.
export const FIXED_BIOME_ANCHORS: Array<{ biome: number; tx: number; ty: number }> = [
  // Heart & Inner Ring (Danger 1..7)
  { biome: 1,  tx: 160, ty: 160 }, // Planícies de Aurora (Asterion Central)
  { biome: 16, tx: 122, ty: 155 }, // Campos Dourados (Oeste)
  { biome: 2,  tx: 198, ty: 152 }, // Floresta Esmeralda (Leste)
  { biome: 15, tx: 160, ty: 118 }, // Vale dos Ventos (Norte)
  { biome: 11, tx: 158, ty: 204 }, // Costa Tempestuosa (Sul)
  { biome: 31, tx: 124, ty: 192 }, // Deserto de Sal (Sudoeste)
  { biome: 3,  tx: 88,  ty: 175 }, // Deserto Escarlate (Oeste)
  { biome: 4,  tx: 196, ty: 116 }, // Montanhas de Ferro (Nordeste)
  { biome: 8,  tx: 206, ty: 194 }, // Selva Tropical (Sudeste)

  // Middle Ring (Danger 8..18)
  { biome: 12, tx: 160, ty: 244 }, // Arquipélago das Marés (Mar Sul)
  { biome: 5,  tx: 236, ty: 222 }, // Pântano Sombrio (Sudeste)
  { biome: 13, tx: 238, ty: 148 }, // Cavernas de Cristal (Leste)
  { biome: 36, tx: 234, ty: 184 }, // Planalto Fúngico (Leste)
  { biome: 23, tx: 86,  ty: 214 }, // Cânion Rubro (Sudoeste)
  { biome: 6,  tx: 120, ty: 114 }, // Tundra Boreal (Noroeste)
  { biome: 17, tx: 86,  ty: 132 }, // Ruínas Imperiais (Oeste)
  { biome: 20, tx: 242, ty: 112 }, // Bosque Luminescente (Nordeste)
  { biome: 33, tx: 116, ty: 234 }, // Cemitério Fúnebre (Sul-Oeste)
  { biome: 7,  tx: 158, ty: 78  }, // Cordilheira Glacial (Norte)
  { biome: 9,  tx: 270, ty: 168 }, // Floresta Carmesim (Extremo Leste)
  { biome: 25, tx: 274, ty: 204 }, // Jardim Ancestral (Leste)
  { biome: 34, tx: 198, ty: 78  }, // Ilhas Flutuantes (Norte-Leste)
  { biome: 18, tx: 238, ty: 76  }, // Reino Subterrâneo (Nordeste)
  { biome: 14, tx: 118, ty: 76  }, // Penhascos Celestiais (Noroeste)
  { biome: 26, tx: 52,  ty: 164 }, // Cidade Perdida (Oeste)
  { biome: 19, tx: 54,  ty: 204 }, // Mar de Cinzas (Sudoeste)
  { biome: 37, tx: 274, ty: 130 }, // Ruínas Cristalinas (Leste)

  // Outer Ring / High Danger (Danger 18..30)
  { biome: 10, tx: 52,  ty: 242 }, // Vulcões de Obsidiana (Sudoeste)
  { biome: 21, tx: 204, ty: 256 }, // Ilha das Tempestades (Sudeste)
  { biome: 35, tx: 274, ty: 88  }, // Grutas de Mercúrio (Nordeste)
  { biome: 22, tx: 52,  ty: 122 }, // Fortaleza Abandonada (Noroeste)
  { biome: 39, tx: 276, ty: 242 }, // Bosque Espectral (Sudeste)
  { biome: 24, tx: 158, ty: 42  }, // Picos Celestes (Extremo Norte)
  { biome: 32, tx: 82,  ty: 82  }, // Terras Radioativas (Noroeste)
  { biome: 38, tx: 90,  ty: 266 }, // Vastidão Voraz (Sul)
  { biome: 27, tx: 46,  ty: 76  }, // Abismo Infinito (Noroeste Extremo)
  { biome: 28, tx: 242, ty: 268 }, // Reino das Sombras (Sudeste Extremo)
  { biome: 29, tx: 212, ty: 44  }, // Plano Astral (Nordeste Extremo)
  { biome: 40, tx: 46,  ty: 272 }, // Núcleo do Mundo (Sudoeste Extremo)
  { biome: 30, tx: 112, ty: 42  }, // Trono dos Criadores (Norte Celestial)
];

const FOREST_BIOMES = new Set([2, 8, 9, 20, 25, 39]);
const ROCK_BIOMES = new Set([4, 7, 10, 14, 18, 22, 24, 27, 37, 40]);
const SAND_BIOMES = new Set([3, 19, 23, 31]);
const WATERY_BIOMES = new Set([5, 11, 12, 21, 34]);

export class FixedWorld implements PlayMap {
  readonly size = FIXED_WORLD_SIZE;
  readonly seed = 2026; // Fixed canonical identifier
  readonly tiles: WorldTile[];
  readonly cities: City[] = [];
  readonly stairs: Stair[] = [];
  readonly landmarks: Landmark[] = [];
  readonly torches: Array<{ x: number; y: number }> = [];
  readonly spawn: { x: number; y: number };
  readonly isCave = false;
  readonly biomeId = 0;
  grandStair: { x: number; y: number } = { x: 160 * TILE + TILE / 2, y: 152 * TILE + TILE / 2 };
  centralCity = { x: 160, y: 160, radius: 18 };

  constructor() {
    this.tiles = new Array(this.size * this.size);
    this.buildContinent();
    this.buildRiversAndBridges();
    this.buildRegionalOutpostsAndRoads();
    this.buildCentralCityAsterion();
    this.spawn = { x: 160 * TILE + TILE / 2, y: 164 * TILE + TILE / 2 };
  }

  idx(x: number, y: number): number {
    return y * this.size + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  get(x: number, y: number): WorldTile {
    if (!this.inBounds(x, y)) return { kind: 1, biome: 0 };
    return this.tiles[this.idx(x, y)];
  }

  isBlocked(x: number, y: number): boolean {
    const t = this.get(x, y).kind;
    return (
      t === 1 || t === 2 || t === 4 || t === 9 ||
      t === 11 || t === 14 || t === 15 || t === 19 || t === 20
    );
  }

  private setKind(x: number, y: number, kind: TileKind, biome?: number) {
    if (!this.inBounds(x, y)) return;
    const t = this.tiles[this.idx(x, y)];
    t.kind = kind;
    if (biome !== undefined) t.biome = biome;
  }

  private continentShape(x: number, y: number): number {
    const nx = (x / this.size) * 2 - 1;
    const ny = (y / this.size) * 2 - 1;
    const radial = 1 - Math.hypot(nx, ny);
    // Deterministic harmonic coastline bays & peninsulas
    const wave =
      Math.sin(x * 0.045) * 0.06 +
      Math.cos(y * 0.042) * 0.06 +
      Math.sin((x + y) * 0.028) * 0.05;
    return radial + wave + 0.06;
  }

  private buildContinent() {
    const s = this.size;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const land = this.continentShape(x, y);
        // Smooth deterministic organic border between fixed biome regions
        const wx = x + Math.sin(y * 0.08) * 6 + Math.cos(x * 0.05) * 4;
        const wy = y + Math.cos(x * 0.08) * 6 + Math.sin(y * 0.05) * 4;

        let bestD = Infinity;
        let biome = 1;
        for (const anchor of FIXED_BIOME_ANCHORS) {
          const dx = anchor.tx - wx;
          const dy = anchor.ty - wy;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            biome = anchor.biome;
          }
        }

        if (land < 0.04) {
          this.tiles[y * s + x] = { kind: 1, biome: 0 };
          continue;
        }

        let kind: TileKind = 0;
        const h = coordHash(x, y, 77);
        const cluster = Math.sin(x * 0.22) * Math.cos(y * 0.22);

        if (land < 0.085) {
          kind = 3; // fixed sandy shoreline
        } else if (SAND_BIOMES.has(biome)) {
          kind = 3;
          if (biome === 23 && cluster > 0.55 && h > 0.55) kind = 2; // canyon ridges
        } else if (ROCK_BIOMES.has(biome)) {
          if (cluster > 0.36 && h > 0.42) kind = 2;
        } else if (FOREST_BIOMES.has(biome)) {
          if (cluster > 0.22 && h > 0.45) kind = 4;
        } else if (WATERY_BIOMES.has(biome)) {
          if (cluster > 0.42 && h > 0.48) kind = 1;
          else if (h > 0.88) kind = 3;
        } else {
          // Scenic groves & boulders in plains/other regions
          if (cluster > 0.65 && h > 0.65) kind = 4;
          else if (cluster < -0.72 && h > 0.72) kind = 2;
        }

        this.tiles[y * s + x] = { kind, biome };
      }
    }
  }

  private buildRiversAndBridges() {
    // Fixed Aurora River flowing smoothly from the northern mountains (y=48)
    // curving east of Asterion (x~185) down to the southern coast (y=268)
    for (let y = 48; y <= 268; y++) {
      const rx = Math.round(186 + Math.sin(y * 0.055) * 8);
      for (let w = -1; w <= 1; w++) {
        const tx = rx + w;
        if (!this.inBounds(tx, y)) continue;
        // Keep central city safe
        if (Math.abs(tx - 160) <= 20 && Math.abs(y - 160) <= 20) continue;
        const t = this.tiles[this.idx(tx, y)];
        if (t.kind !== 5 && t.kind !== 6) {
          t.kind = 1;
        }
      }
    }

    // Western Silver Stream curving past x~130
    for (let y = 80; y <= 230; y++) {
      const rx = Math.round(132 + Math.cos(y * 0.06) * 6);
      for (let w = 0; w <= 1; w++) {
        const tx = rx + w;
        if (!this.inBounds(tx, y)) continue;
        if (Math.abs(tx - 160) <= 20 && Math.abs(y - 160) <= 20) continue;
        this.tiles[this.idx(tx, y)].kind = 1;
      }
    }
  }

  private carveRoad(x0: number, y0: number, x1: number, y1: number) {
    let x = x0;
    let y = y0;
    while (x !== x1 || y !== y1) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (!this.inBounds(nx, ny)) continue;
          const t = this.tiles[this.idx(nx, ny)];
          if (t.kind === 5 || t.kind === 6 || t.kind === 16 || t.kind === 15) continue;
          if (t.kind === 1) {
            t.kind = 18; // Handcrafted bridge over river/water!
          } else {
            t.kind = 17; // Paved road
          }
        }
      }
      if (Math.abs(x1 - x) >= Math.abs(y1 - y)) {
        x += Math.sign(x1 - x);
      } else {
        y += Math.sign(y1 - y);
      }
    }
  }

  private buildRegionalOutpostsAndRoads() {
    for (const anchor of FIXED_BIOME_ANCHORS) {
      const cx = anchor.tx;
      const cy = anchor.ty;
      const cityName = CITY_NAMES[anchor.biome] ?? `Região ${anchor.biome}`;

      this.cities.push({
        name: cityName,
        x: cx * TILE + TILE / 2,
        y: cy * TILE + TILE / 2,
        biome: anchor.biome,
        tx: cx,
        ty: cy,
      });

      if (anchor.biome === 1) continue; // Asterion is built separately with full citadel

      // Clear a neat 7x7 outpost plaza
      for (let yy = -3; yy <= 3; yy++) {
        for (let xx = -3; xx <= 3; xx++) {
          const tx = cx + xx;
          const ty = cy + yy;
          if (!this.inBounds(tx, ty)) continue;
          const isBorder = Math.abs(xx) === 3 && Math.abs(yy) === 3;
          if (isBorder) {
            this.setKind(tx, ty, 8, anchor.biome); // corner torches
            this.torches.push({ x: tx, y: ty });
          } else {
            this.setKind(tx, ty, 13, anchor.biome); // stone outpost plaza
          }
        }
      }
      this.setKind(cx, cy, 5, anchor.biome); // City banner monument

      // Fixed staircase 5 tiles east (or west if near right edge) with a clean path
      const stairX = cx + (cx > this.size - 16 ? -5 : 5);
      const stairY = cy;
      for (let xx = Math.min(cx, stairX) - 1; xx <= Math.max(cx, stairX) + 1; xx++) {
        for (let yy = -1; yy <= 1; yy++) {
          if (xx === cx && yy === 0) continue;
          this.setKind(xx, stairY + yy, 17, anchor.biome);
        }
      }
      this.setKind(stairX, stairY, 6, anchor.biome);
      this.stairs.push({
        x: stairX * TILE + TILE / 2,
        y: stairY * TILE + TILE / 2,
        biome: anchor.biome,
        kind: "down",
      });

      this.landmarks.push({
        id: `outpost_${anchor.biome}`,
        name: cityName,
        subtitle: BIOMES.find(b => b.id === anchor.biome)?.name ?? "",
        x: cx * TILE + TILE / 2,
        y: cy * TILE + TILE / 2,
        kind: "outpost",
        color: BIOMES.find(b => b.id === anchor.biome)?.color ?? "#f0c040",
      });
    }

    // Connect Central City gates to nearby regional hubs along fixed highway routes
    const gateN = { x: 160, y: 141 };
    const gateS = { x: 160, y: 179 };
    const gateW = { x: 141, y: 160 };
    const gateE = { x: 179, y: 160 };

    const routes: Array<[number, number, number, number]> = [
      // North Spine
      [gateN.x, gateN.y, 160, 118],
      [160, 118, 158, 78],
      [158, 78, 158, 42],
      [160, 118, 120, 114],
      [120, 114, 118, 76],
      [118, 76, 112, 42],
      [160, 118, 196, 116],
      [196, 116, 198, 78],
      [198, 78, 212, 44],
      // South Spine
      [gateS.x, gateS.y, 158, 204],
      [158, 204, 160, 244],
      [158, 204, 124, 192],
      [124, 192, 116, 234],
      [116, 234, 90, 266],
      [158, 204, 206, 194],
      [206, 194, 204, 256],
      // West Spine
      [gateW.x, gateW.y, 122, 155],
      [122, 155, 88, 175],
      [88, 175, 52, 164],
      [88, 175, 86, 214],
      [86, 214, 54, 204],
      [54, 204, 52, 242],
      [52, 242, 46, 272],
      [122, 155, 86, 132],
      [86, 132, 52, 122],
      [86, 132, 82, 82],
      [82, 82, 46, 76],
      // East Spine
      [gateE.x, gateE.y, 198, 152],
      [198, 152, 238, 148],
      [238, 148, 270, 168],
      [238, 148, 274, 130],
      [238, 148, 242, 112],
      [242, 112, 238, 76],
      [242, 112, 274, 88],
      [198, 152, 234, 184],
      [234, 184, 274, 204],
      [234, 184, 236, 222],
      [236, 222, 276, 242],
      [236, 222, 242, 268],
      [124, 192, 86, 214],
    ];

    for (const [x0, y0, x1, y1] of routes) {
      this.carveRoad(x0, y0, x1, y1);
    }
  }

  private buildCentralCityAsterion() {
    const cx = 160;
    const cy = 160;
    const R = 18;
    this.centralCity = { x: cx, y: cy, radius: R };

    // Paved outer approaches outside gates
    for (let d = R + 1; d <= R + 6; d++) {
      for (let w = -1; w <= 1; w++) {
        this.setKind(cx + w, cy - d, 17, 1);
        this.setKind(cx + w, cy + d, 17, 1);
        this.setKind(cx - d, cy + w, 17, 1);
        this.setKind(cx + d, cy + w, 17, 1);
      }
    }

    // Outer fortified curtain wall & interior cobblestone plaza
    for (let yy = -R; yy <= R; yy++) {
      for (let xx = -R; xx <= R; xx++) {
        const tx = cx + xx;
        const ty = cy + yy;
        const cheb = Math.max(Math.abs(xx), Math.abs(yy));
        if (cheb === R) {
          this.setKind(tx, ty, 14, 1);
        } else {
          this.setKind(tx, ty, 13, 1);
        }
      }
    }

    // 4 Wide 3-tile Gateways (N, S, E, W) flanked by guard torches
    for (let w = -1; w <= 1; w++) {
      this.setKind(cx + w, cy - R, 10, 1);
      this.setKind(cx + w, cy + R, 10, 1);
      this.setKind(cx - R, cy + w, 10, 1);
      this.setKind(cx + R, cy + w, 10, 1);
    }

    // Corner Bastion Towers (Steel/Stone Pillars)
    for (const [dx, dy] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
      this.setKind(cx + dx, cy + dy, 11, 1);
    }
    // Gatehouse flanking pillars
    for (const [dx, dy] of [
      [-2, -R], [2, -R], [-2, R], [2, R],
      [-R, -2], [-R, 2], [R, -2], [R, 2],
    ]) {
      this.setKind(cx + dx, cy + dy, 11, 1);
    }

    // Perimeter & Avenue Torches
    for (let i = -R + 3; i <= R - 3; i += 4) {
      if (Math.abs(i) <= 2) continue;
      const pts: Array<[number, number]> = [
        [cx + i, cy - R + 1],
        [cx + i, cy + R - 1],
        [cx - R + 1, cy + i],
        [cx + R - 1, cy + i],
      ];
      for (const [tx, ty] of pts) {
        this.setKind(tx, ty, 8, 1);
        this.torches.push({ x: tx, y: ty });
      }
    }

    // Grand Central Dragon Fountain (at 160, 160)
    this.setKind(cx, cy, 15, 1);
    for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      this.setKind(cx + dx, cy + dy, 8, 1);
      this.torches.push({ x: cx + dx, y: cy + dy });
    }
    this.landmarks.push({
      id: "fountain",
      name: "Fonte do Dragão",
      subtitle: "Praça Central",
      x: cx * TILE + TILE / 2,
      y: cy * TILE + TILE / 2,
      kind: "fountain",
      color: "#60c8ff",
    });

    // Grand Staircase into the 100-Floor Dungeon of Asterion (north of fountain)
    const gsx = cx;
    const gsy = cy - 8;
    this.setKind(gsx, gsy, 16, 1);
    this.setKind(gsx - 2, gsy, 11, 1);
    this.setKind(gsx + 2, gsy, 11, 1);
    this.setKind(gsx - 2, gsy + 1, 8, 1);
    this.setKind(gsx + 2, gsy + 1, 8, 1);
    this.torches.push({ x: gsx - 2, y: gsy + 1 }, { x: gsx + 2, y: gsy + 1 });
    this.grandStair = { x: gsx * TILE + TILE / 2, y: gsy * TILE + TILE / 2 };
    this.stairs.push({ x: this.grandStair.x, y: this.grandStair.y, biome: 1, kind: "grand" });
    this.landmarks.push({
      id: "grand_stair",
      name: "Masmorra de Asterion",
      subtitle: "100 Andares",
      x: this.grandStair.x,
      y: this.grandStair.y,
      kind: "grand_stair",
      color: "#f4c85b",
    });

    // District Buildings (4x4 stone buildings with doorways & interactive landmarks)
    const districts: Array<{
      bx: number;
      by: number;
      kind: Landmark["kind"];
      name: string;
      subtitle: string;
      color: string;
      propKind: TileKind;
    }> = [
      { bx: cx - 12, by: cy - 11, kind: "forge",    name: "Forja Dragonstone", subtitle: "[B] Forjar Armas",     color: "#ff9040", propKind: 19 },
      { bx: cx + 8,  by: cy - 11, kind: "alchemy",  name: "Alquimia & Gemas",  subtitle: "[B] Poções & Runas",   color: "#60e0a0", propKind: 20 },
      { bx: cx - 12, by: cy + 7,  kind: "tavern",   name: "Taverna do Grifo",  subtitle: "Descanso & Cura",      color: "#f0c050", propKind: 20 },
      { bx: cx + 8,  by: cy + 7,  kind: "barracks", name: "Salão dos Mestres", subtitle: "[N] Picaretas & Minas",color: "#90b8ff", propKind: 19 },
    ];

    for (const d of districts) {
      for (let yy = 0; yy < 4; yy++) {
        for (let xx = 0; xx < 4; xx++) {
          const tx = d.bx + xx;
          const ty = d.by + yy;
          const isEdge = xx === 0 || yy === 0 || xx === 3 || yy === 3;
          this.setKind(tx, ty, isEdge ? 14 : 13, 1);
        }
      }
      // Wide doorway facing central avenue
      this.setKind(d.bx + 1, d.by + 3, 13, 1);
      this.setKind(d.bx + 2, d.by + 3, 13, 1);
      // Courtyard brazier & workshop station in front
      this.setKind(d.bx - 1, d.by + 3, 8, 1);
      this.torches.push({ x: d.bx - 1, y: d.by + 3 });
      this.setKind(d.bx + 4, d.by + 2, d.propKind, 1);

      this.landmarks.push({
        id: `city_${d.kind}`,
        name: d.name,
        subtitle: d.subtitle,
        x: (d.bx + 2) * TILE,
        y: (d.by + 2) * TILE,
        kind: d.kind,
        color: d.color,
      });
    }
  }
}

// =========================================================================
// Fixed Handcrafted Cave Floors (Floors 2, 3, 4 per Biome) — Zero Random Gen
// =========================================================================
export class FixedCaveFloor implements PlayMap {
  readonly size: number;
  readonly seed: number;
  readonly floor: number;
  readonly tiles: WorldTile[];
  readonly stairs: Stair[] = [];
  readonly torches: Array<{ x: number; y: number }> = [];
  readonly spawn: { x: number; y: number };
  readonly isCave = true;
  readonly biomeId: number;

  constructor(biomeId: number, floor = 2) {
    this.biomeId = biomeId;
    this.floor = floor;
    this.seed = biomeId * 100 + floor;
    this.size = floor === 2 ? 72 : floor === 3 ? 88 : 96;
    this.tiles = new Array(this.size * this.size);
    this.buildHandcraftedLayout();
    const sc = Math.floor(this.size / 2);
    this.spawn = { x: sc * TILE + TILE / 2, y: (sc + 4) * TILE + TILE / 2 };
  }

  idx(x: number, y: number): number { return y * this.size + x; }
  inBounds(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  get(x: number, y: number): WorldTile {
    if (!this.inBounds(x, y)) return { kind: 2, biome: this.biomeId };
    return this.tiles[this.idx(x, y)];
  }
  isBlocked(x: number, y: number): boolean {
    const t = this.get(x, y).kind;
    return t === 2 || t === 1 || t === 4 || t === 9 || t === 11 || t === 14 || t === 15;
  }

  private carveRect(x0: number, y0: number, w: number, h: number, kind: TileKind = 0) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (this.inBounds(x, y)) {
          this.tiles[this.idx(x, y)] = { kind, biome: this.biomeId };
        }
      }
    }
  }

  private addTorch(x: number, y: number) {
    if (!this.inBounds(x, y)) return;
    this.tiles[this.idx(x, y)].kind = 8;
    this.torches.push({ x, y });
  }

  private buildHandcraftedLayout() {
    const s = this.size;
    for (let i = 0; i < s * s; i++) {
      this.tiles[i] = { kind: 2, biome: this.biomeId };
    }

    const c = Math.floor(s / 2);
    // Central grand hall
    this.carveRect(c - 8, c - 8, 17, 17, 0);
    // Cardinal wing halls + ring corridor
    this.carveRect(8, c - 3, s - 16, 7, 0);
    this.carveRect(c - 3, 8, 7, s - 16, 0);

    // 4 Corner Chambers
    const q = Math.floor(s * 0.22);
    const chambers = [
      { x: q - 6, y: q - 6, w: 13, h: 13 },
      { x: s - q - 7, y: q - 6, w: 13, h: 13 },
      { x: q - 6, y: s - q - 7, w: 13, h: 13 },
      { x: s - q - 7, y: s - q - 7, w: 13, h: 13 },
    ];
    for (const ch of chambers) {
      this.carveRect(ch.x, ch.y, ch.w, ch.h, 0);
      // Connect chambers to cardinal corridors
      this.carveRect(Math.min(ch.x + 6, c), ch.y + 5, Math.abs(c - (ch.x + 6)) + 3, 4, 0);
      this.carveRect(ch.x + 5, Math.min(ch.y + 6, c), 4, Math.abs(c - (ch.y + 6)) + 3, 0);
      // Pillars & torches in each chamber
      this.tiles[this.idx(ch.x + 2, ch.y + 2)].kind = 11;
      this.tiles[this.idx(ch.x + ch.w - 3, ch.y + 2)].kind = 11;
      this.tiles[this.idx(ch.x + 2, ch.y + ch.h - 3)].kind = 11;
      this.tiles[this.idx(ch.x + ch.w - 3, ch.y + ch.h - 3)].kind = 11;
      this.addTorch(ch.x + 6, ch.y + 1);
      this.addTorch(ch.x + 6, ch.y + ch.h - 2);
    }

    // Torches around central hall
    this.addTorch(c - 6, c - 6);
    this.addTorch(c + 6, c - 6);
    this.addTorch(c - 6, c + 6);
    this.addTorch(c + 6, c + 6);

    // Stair Up in central chamber
    this.tiles[this.idx(c, c)].kind = 7;
    this.stairs.push({ x: c * TILE + TILE / 2, y: c * TILE + TILE / 2, biome: this.biomeId, kind: "up" });

    // Stair Down at farthest wing depending on floor
    if (this.floor < 4) {
      const target = this.floor === 2 ? chambers[3] : chambers[0];
      const dx = target.x + 6;
      const dy = target.y + 6;
      this.tiles[this.idx(dx, dy)].kind = 6;
      this.stairs.push({ x: dx * TILE + TILE / 2, y: dy * TILE + TILE / 2, biome: this.biomeId, kind: "down" });
    }
  }
}

// =========================================================================
// Fixed Architectural Grand Dungeon of Asterion (100 Floors)
// =========================================================================
export class FixedGrandDungeonFloor implements PlayMap {
  readonly size: number;
  readonly seed: number;
  readonly floor: number;
  readonly tiles: WorldTile[];
  readonly stairs: Stair[] = [];
  readonly torches: Array<{ x: number; y: number }> = [];
  readonly chests: Array<{ x: number; y: number; secret: boolean; opened: boolean }> = [];
  readonly spawn: { x: number; y: number };
  readonly isCave = true;
  readonly biomeId = 0;

  constructor(floor: number) {
    this.floor = Math.max(1, Math.min(GRAND_MAX_FLOOR, floor));
    this.seed = 9000 + this.floor;
    this.size = 64;
    this.tiles = new Array(this.size * this.size);
    this.buildArchitecturalFloor();
    this.spawn = { x: 10 * TILE + TILE / 2, y: 32 * TILE + TILE / 2 };
  }

  idx(x: number, y: number): number { return y * this.size + x; }
  inBounds(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  get(x: number, y: number): WorldTile {
    if (!this.inBounds(x, y)) return { kind: 2, biome: 0 };
    return this.tiles[this.idx(x, y)];
  }
  isBlocked(x: number, y: number): boolean {
    const t = this.get(x, y).kind;
    return t === 2 || t === 9 || t === 11 || t === 14 || t === 15;
  }

  private carve(x0: number, y0: number, w: number, h: number, kind: TileKind = 0) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (this.inBounds(x, y)) this.tiles[this.idx(x, y)] = { kind, biome: 0 };
      }
    }
  }

  private addTorch(x: number, y: number) {
    if (!this.inBounds(x, y)) return;
    this.tiles[this.idx(x, y)].kind = 8;
    this.torches.push({ x, y });
  }

  private addChest(x: number, y: number, secret: boolean) {
    if (!this.inBounds(x, y)) return;
    this.tiles[this.idx(x, y)].kind = 12;
    this.chests.push({ x, y, secret, opened: false });
  }

  private buildArchitecturalFloor() {
    const s = this.size;
    for (let i = 0; i < s * s; i++) {
      this.tiles[i] = { kind: 2, biome: 0 };
    }

    // Rotate among 4 clean symmetric wing layouts based on floor % 4
    const wing = this.floor % 4;
    // Entry hall (West)
    this.carve(5, 27, 11, 11, 0);
    // Grand central nave
    this.carve(22, 22, 20, 20, 0);
    // North & South wing vaults
    this.carve(25, 6, 14, 12, 0);
    this.carve(25, 46, 14, 12, 0);
    // East Throne Room
    this.carve(48, 25, 11, 14, 0);

    // Corridors + Iron Gates
    this.carve(16, 31, 6, 3, 0);
    this.tiles[this.idx(18, 31)].kind = 10;
    this.tiles[this.idx(18, 32)].kind = 10;
    this.tiles[this.idx(18, 33)].kind = 10;

    this.carve(42, 31, 6, 3, 0);
    this.tiles[this.idx(45, 31)].kind = 10;
    this.tiles[this.idx(45, 32)].kind = 10;
    this.tiles[this.idx(45, 33)].kind = 10;

    this.carve(30, 18, 4, 4, 0);
    this.carve(30, 42, 4, 4, 0);

    // Steel pillars in Central Nave
    for (const [px, py] of [[25, 25], [38, 25], [25, 38], [38, 38]]) {
      this.tiles[this.idx(px, py)].kind = 11;
    }

    // Wall torches
    for (const [tx, ty] of [
      [7, 28], [7, 36], [23, 23], [40, 23], [23, 40], [40, 40],
      [27, 8], [36, 8], [27, 55], [36, 55], [50, 27], [56, 36],
    ]) {
      this.addTorch(tx, ty);
    }

    // Secret vault behind cracked wall (north or south depending on floor)
    if (wing < 2) {
      this.carve(10, 10, 6, 6, 0);
      this.carve(16, 12, 9, 2, 0);
      this.tiles[this.idx(24, 12)].kind = 9; // cracked secret wall
      this.tiles[this.idx(24, 13)].kind = 9;
      this.addChest(12, 12, true);
    } else {
      this.carve(10, 48, 6, 6, 0);
      this.carve(16, 50, 9, 2, 0);
      this.tiles[this.idx(24, 50)].kind = 9;
      this.tiles[this.idx(24, 51)].kind = 9;
      this.addChest(12, 50, true);
    }

    // Regular vault chest
    this.addChest(32, wing % 2 === 0 ? 10 : 53, false);

    // Stair Up (West Entry Hall)
    this.tiles[this.idx(8, 32)].kind = 7;
    this.stairs.push({ x: 8 * TILE + TILE / 2, y: 32 * TILE + TILE / 2, biome: 0, kind: "up" });

    // Stair Down or Final Floor Legendary Chest (East Throne Room)
    if (this.floor < GRAND_MAX_FLOOR) {
      this.tiles[this.idx(54, 32)].kind = 6;
      this.stairs.push({ x: 54 * TILE + TILE / 2, y: 32 * TILE + TILE / 2, biome: 0, kind: "down" });
    } else {
      this.addChest(54, 32, true);
    }
  }
}
