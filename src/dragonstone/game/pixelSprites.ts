import type { ActorAction, Enemy, FacingDir, PlayerClass } from "./types";

// ============================================================================
// Kaetram-Style 32x32 Crisp Pixel-Art Sprite & Multi-Frame Animation Engine
// ============================================================================
// Every sprite is rasterized onto an offscreen 32x32 canvas with strict dark
// pixel outlines, multi-tone cel shading, specular highlights, and distinct
// multi-frame animations for idle, walk, attack (windup -> lunge -> follow),
// hurt, and KO. Drawn with imageSmoothingEnabled = false for razor-sharp pixels.

export type SpritePalette = {
  outline: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  skin: string;
  skinDark: string;
  eye: string;
  weapon: string;
  weaponLight: string;
};

export type EnemyArchetype =
  | "wolf" | "spider" | "skeleton" | "zombie" | "slime" | "dragon"
  | "demon" | "angel" | "elemental" | "golem" | "aberration"
  | "scorpion" | "rat" | "mushroom" | "treant" | "ghost"
  | "knight" | "mage" | "bandit" | "mummy" | "bat" | "aquatic";

const CLASS_PALETTES: Record<PlayerClass, SpritePalette> = {
  melee: {
    outline: "#120b09",
    primary: "#8a98ad",
    primaryDark: "#4f5b6e",
    primaryLight: "#cbd6e6",
    secondary: "#b82a2a",
    secondaryDark: "#6e1313",
    accent: "#f4c85b",
    skin: "#e3b386",
    skinDark: "#b58256",
    eye: "#1a110d",
    weapon: "#d8e4f4",
    weaponLight: "#ffffff",
  },
  magic: {
    outline: "#100a18",
    primary: "#2d4c9c",
    primaryDark: "#192a5c",
    primaryLight: "#5b84e0",
    secondary: "#7a36b8",
    secondaryDark: "#451970",
    accent: "#5ce8ff",
    skin: "#e6b88e",
    skinDark: "#b88760",
    eye: "#38d8ff",
    weapon: "#8a5a2b",
    weaponLight: "#70f0ff",
  },
  paladin: {
    outline: "#140e08",
    primary: "#d4dae6",
    primaryDark: "#828da3",
    primaryLight: "#ffffff",
    secondary: "#e0aa32",
    secondaryDark: "#966812",
    accent: "#fff098",
    skin: "#e5b688",
    skinDark: "#b88558",
    eye: "#2a1b0e",
    weapon: "#f4c85b",
    weaponLight: "#fff9cc",
  },
  necro: {
    outline: "#0d0814",
    primary: "#2e243d",
    primaryDark: "#171121",
    primaryLight: "#554270",
    secondary: "#6e29a8",
    secondaryDark: "#3a125e",
    accent: "#d678ff",
    skin: "#b8b4c4",
    skinDark: "#7e7a8c",
    eye: "#e666ff",
    weapon: "#8e96a6",
    weaponLight: "#d678ff",
  },
  archer: {
    outline: "#0c120a",
    primary: "#2f6e3a",
    primaryDark: "#194020",
    primaryLight: "#59ad66",
    secondary: "#7a4e28",
    secondaryDark: "#4a2b12",
    accent: "#b5e65a",
    skin: "#e2b284",
    skinDark: "#b28154",
    eye: "#18120c",
    weapon: "#a66c36",
    weaponLight: "#f0dfa8",
  },
};

function hexShift(hex: string, amt: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const n = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Low-level pixel plotting helper on 32x32 context
class PixelCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid: (string | null)[];

  constructor(readonly w = 32, readonly h = 32) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");
    this.ctx = ctx;
    this.grid = new Array(w * h).fill(null);
  }

  px(x: number, y: number, color: string) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    this.grid[iy * this.w + ix] = color;
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        this.px(x + xx, y + yy, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / Math.max(0.5, rx);
        const ny = (y - cy) / Math.max(0.5, ry);
        if (nx * nx + ny * ny <= 1.0) this.px(x, y, color);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: string) {
    let ix0 = Math.round(x0), iy0 = Math.round(y0);
    const ix1 = Math.round(x1), iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0), sx = ix0 < ix1 ? 1 : -1;
    const dy = -Math.abs(iy1 - iy0), sy = iy0 < iy1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      this.px(ix0, iy0, color);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; ix0 += sx; }
      if (e2 <= dx) { err += dx; iy0 += sy; }
    }
  }

  // Apply crisp 1px dark Kaetram outline around all filled pixels!
  finalize(outlineColor = "#120b09"): HTMLCanvasElement {
    const out = [...this.grid];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.grid[y * this.w + x] !== null) continue;
        const hasNeighbor =
          (x > 0 && this.grid[y * this.w + (x - 1)] !== null) ||
          (x < this.w - 1 && this.grid[y * this.w + (x + 1)] !== null) ||
          (y > 0 && this.grid[(y - 1) * this.w + x] !== null) ||
          (y < this.h - 1 && this.grid[(y + 1) * this.w + x] !== null);
        if (hasNeighbor) {
          out[y * this.w + x] = outlineColor;
        }
      }
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = out[y * this.w + x];
        if (c) {
          this.ctx.fillStyle = c;
          this.ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return this.canvas;
  }
}

// ----------------------------------------------------------------------------
// Humanoid Hero / Knight / Mage / Archer / Necromancer Pixel Art Renderer
// ----------------------------------------------------------------------------
function buildPlayerFrame(
  cls: PlayerClass,
  dir: FacingDir,
  action: ActorAction,
  frame: number,
): HTMLCanvasElement {
  const pal = CLASS_PALETTES[cls];
  const p = new PixelCanvas(32, 32);

  // Motion offsets per frame for crisp Kaetram-style animation
  let bobY = 0;
  let legL = 0;
  let legR = 0;
  let armSwing = 0;
  let capeWave = 0;
  let lungeX = 0;
  let lungeY = 0;
  let weaponAngle = 0; // -1 windup, 0 idle, 1..2 strike

  if (action === "idle") {
    bobY = frame === 1 || frame === 2 ? -1 : 0;
    capeWave = frame % 2 === 0 ? 0 : 1;
  } else if (action === "walk") {
    const cycle = [
      { b: 0, l: -2, r: 2, a: -1, c: 0 },
      { b: -1, l: -1, r: 1, a: 0, c: 1 },
      { b: 0, l: 0, r: 0, a: 1, c: 1 },
      { b: 0, l: 2, r: -2, a: 1, c: 0 },
      { b: -1, l: 1, r: -1, a: 0, c: -1 },
      { b: 0, l: 0, r: 0, a: -1, c: 0 },
    ][frame % 6];
    bobY = cycle.b;
    legL = cycle.l;
    legR = cycle.r;
    armSwing = cycle.a;
    capeWave = cycle.c;
  } else if (action === "attack") {
    const seq = [
      { bx: -2, by: 0, w: -2, l: -1, r: 1 }, // anticipation windup
      { bx: 3, by: 1, w: 2, l: 2, r: -2 },  // explosive lunge
      { bx: 4, by: 1, w: 3, l: 2, r: -2 },  // strike peak
      { bx: 2, by: 0, w: 2, l: 1, r: -1 },  // follow-through
      { bx: 0, by: 0, w: 0, l: 0, r: 0 },   // recovery
    ][frame % 5];
    lungeX = dir === "left" ? -seq.bx : dir === "right" ? seq.bx : 0;
    lungeY = dir === "up" ? -seq.bx : dir === "down" ? seq.bx : seq.by;
    weaponAngle = seq.w;
    legL = seq.l;
    legR = seq.r;
    capeWave = seq.w > 0 ? -1 : 1;
  } else if (action === "hurt") {
    lungeY = -1;
    bobY = -1;
  }

  const cx = 16 + lungeX;
  const cy = 16 + bobY + lungeY;
  const isUp = dir === "up";
  const isSide = dir === "left" || dir === "right";

  // Cape (behind when facing down/side, front-covering when facing up)
  if (!isUp) {
    p.rect(cx - 5 + capeWave, cy - 1, 10, 9, pal.secondaryDark);
    p.rect(cx - 4 + capeWave, cy, 8, 7, pal.secondary);
    p.px(cx - 5 + capeWave, cy + 8, pal.secondaryDark);
    p.px(cx + 4 + capeWave, cy + 8, pal.secondaryDark);
  }

  // Legs & Armored Boots
  const lY = cy + 6;
  p.rect(cx - 4, lY + Math.max(-1, legL), 3, 4, pal.primaryDark);
  p.rect(cx - 4, lY + 3 + Math.max(-1, legL), 3, 2, "#3a2315");
  p.rect(cx + 1, lY + Math.max(-1, legR), 3, 4, pal.primaryDark);
  p.rect(cx + 1, lY + 3 + Math.max(-1, legR), 3, 2, "#3a2315");

  // Torso Armor / Robe
  p.rect(cx - 5, cy - 1, 10, 8, pal.primaryDark);
  p.rect(cx - 4, cy - 1, 8, 7, pal.primary);
  p.rect(cx - 3, cy, 6, 3, pal.primaryLight);
  // Belt & Gold Buckle
  p.rect(cx - 4, cy + 5, 8, 2, "#4a2c16");
  p.rect(cx - 1, cy + 5, 2, 2, pal.accent);

  // Class chest emblem
  if (cls === "paladin") {
    p.rect(cx - 1, cy + 1, 2, 4, pal.accent);
    p.rect(cx - 2, cy + 2, 4, 1, pal.accent);
  } else if (cls === "magic" || cls === "necro") {
    p.rect(cx - 4, cy + 6, 8, 3, pal.primaryDark);
    p.rect(cx - 2, cy + 6, 4, 3, pal.secondary);
    p.px(cx, cy + 1, pal.accent);
  }

  // Shoulder Pauldrons
  p.rect(cx - 6, cy - 2, 3, 3, pal.primaryLight);
  p.rect(cx + 4, cy - 2, 3, 3, pal.primary);
  if (cls === "melee" || cls === "paladin") {
    p.px(cx - 6, cy - 2, pal.accent);
    p.px(cx + 5, cy - 2, pal.accent);
  }

  // Head & Face
  const hy = cy - 8;
  p.rect(cx - 4, hy, 8, 7, pal.skinDark);
  p.rect(cx - 3, hy, 6, 6, pal.skin);

  if (!isUp) {
    // Expressive Kaetram eyes
    const eyeOff = isSide ? 1 : 0;
    p.rect(cx - 2 + eyeOff, hy + 3, 1, 2, pal.eye);
    p.rect(cx + 1 + eyeOff, hy + 3, 1, 2, pal.eye);
    p.px(cx - 2 + eyeOff, hy + 3, "#ffffff");
    p.px(cx + 1 + eyeOff, hy + 3, "#ffffff");
  }

  // Class Headgear (Helmet / Wizard Hat / Hood / Crown)
  if (cls === "melee") {
    // Steel Visored Helm with Crimson Plume
    p.rect(cx - 4, hy - 2, 8, 4, pal.primaryLight);
    p.rect(cx - 4, hy - 1, 8, 2, pal.primary);
    p.rect(cx - 1, hy - 5, 3, 3, pal.secondary);
    p.px(cx, hy - 6, pal.secondary);
    if (isUp) p.rect(cx - 4, hy, 8, 6, pal.primaryDark);
  } else if (cls === "magic") {
    // Pointed Arcane Wizard Hat with Gold Band
    p.rect(cx - 6, hy, 12, 2, pal.primaryDark);
    p.rect(cx - 4, hy - 3, 8, 3, pal.primary);
    p.rect(cx - 3, hy - 5, 5, 2, pal.primaryLight);
    p.rect(cx - 1, hy - 7, 3, 2, pal.primary);
    p.rect(cx - 4, hy - 1, 8, 1, pal.accent);
  } else if (cls === "paladin") {
    // Winged Golden-Silver Greathelm
    p.rect(cx - 4, hy - 2, 8, 4, pal.primaryLight);
    p.rect(cx - 1, hy - 2, 2, 5, pal.accent);
    p.rect(cx - 6, hy - 3, 2, 3, pal.accent);
    p.rect(cx + 4, hy - 3, 2, 3, pal.accent);
    if (isUp) p.rect(cx - 4, hy, 8, 6, pal.primaryDark);
  } else if (cls === "necro") {
    // Shadow Hood & Skull Crest
    p.rect(cx - 5, hy - 2, 10, 4, pal.primaryDark);
    p.rect(cx - 4, hy - 3, 8, 3, pal.primary);
    p.rect(cx - 1, hy - 2, 2, 2, "#e8e0d0");
    if (isUp) p.rect(cx - 4, hy - 1, 8, 7, pal.primaryDark);
  } else if (cls === "archer") {
    // Ranger Hood + Feather
    p.rect(cx - 5, hy - 2, 10, 3, pal.primaryDark);
    p.rect(cx - 4, hy - 3, 8, 3, pal.primary);
    p.line(cx + 3, hy - 2, cx + 6, hy - 5, pal.accent);
    if (isUp) {
      p.rect(cx - 4, hy - 1, 8, 7, pal.primaryDark);
      // Quiver on back
      p.rect(cx - 2, cy, 4, 6, pal.secondary);
      p.px(cx - 1, cy - 1, "#ffffff");
      p.px(cx + 1, cy - 1, "#ffffff");
    }
  }

  // Cape overlay when facing UP
  if (isUp) {
    p.rect(cx - 5 + capeWave, cy, 10, 9, pal.secondary);
    p.rect(cx - 4 + capeWave, cy + 1, 8, 7, pal.secondaryDark);
  }

  // Left & Right Arms + Class Weapons with Dramatic Attack Swing
  const armY = cy + 1 + armSwing;
  p.rect(cx - 6, armY, 2, 4, pal.skin);

  // Off-hand Shield for Melee / Paladin
  if (cls === "melee" || cls === "paladin") {
    p.rect(cx - 8, armY - 1, 4, 6, pal.primaryDark);
    p.rect(cx - 7, armY, 2, 4, pal.accent);
  }

  // Main Weapon Hand
  const wx = cx + 5;
  const wy = cy + 1 - armSwing;
  p.rect(wx, wy, 2, 4, pal.skin);

  if (cls === "melee") {
    if (weaponAngle < 0) {
      // Windup back
      p.line(wx + 1, wy + 1, wx - 4, wy - 7, pal.weapon);
      p.line(wx + 1, wy, wx - 3, wy - 7, pal.weaponLight);
    } else if (weaponAngle >= 2) {
      // Heavy forward slash
      p.line(wx + 1, wy + 1, wx + 10, wy + 3, pal.weapon);
      p.line(wx + 2, wy + 1, wx + 10, wy + 2, pal.weaponLight);
    } else {
      p.line(wx + 1, wy + 1, wx + 5, wy - 7, pal.weapon);
      p.line(wx + 1, wy, wx + 5, wy - 6, pal.weaponLight);
    }
    p.rect(wx - 1, wy + 1, 3, 2, pal.accent);
  } else if (cls === "paladin") {
    // Holy Warhammer
    const dx = weaponAngle >= 2 ? 8 : weaponAngle < 0 ? -3 : 4;
    const dy = weaponAngle >= 2 ? 2 : -7;
    p.line(wx + 1, wy + 1, wx + dx, wy + dy, "#7a4e28");
    p.rect(wx + dx - 2, wy + dy - 2, 5, 4, pal.weapon);
    p.px(wx + dx, wy + dy - 1, pal.weaponLight);
  } else if (cls === "magic") {
    const dy = weaponAngle >= 2 ? -2 : -7;
    const dx = weaponAngle >= 2 ? 6 : 2;
    p.line(wx + 1, wy + 3, wx + dx, wy + dy, pal.weapon);
    p.ellipse(wx + dx, wy + dy - 1, 2, 2, pal.weaponLight);
    p.px(wx + dx, wy + dy - 1, "#ffffff");
  } else if (cls === "necro") {
    const dx = weaponAngle >= 2 ? 7 : 3;
    const dy = weaponAngle >= 2 ? 1 : -8;
    p.line(wx + 1, wy + 4, wx + dx, wy + dy, "#4a3222");
    p.line(wx + dx, wy + dy, wx + dx - 5, wy + dy + 2, pal.weapon);
    p.px(wx + dx - 3, wy + dy + 1, pal.weaponLight);
  } else if (cls === "archer") {
    const bx = wx + (weaponAngle >= 2 ? 4 : 2);
    p.line(bx, wy - 5, bx + 2, wy, pal.weapon);
    p.line(bx + 2, wy, bx, wy + 5, pal.weapon);
    p.line(bx, wy - 4, bx, wy + 4, pal.weaponLight);
    if (weaponAngle < 2) {
      p.line(bx - 1, wy, bx + 5, wy, "#ffffff");
    }
  }

  return p.finalize(pal.outline);
}

// ----------------------------------------------------------------------------
// Kaetram-Style Enemy Archetype Pixel Art Builder
// ----------------------------------------------------------------------------
export function classifyEnemyArchetype(name: string): EnemyArchetype {
  const n = name.toLowerCase();
  if (n.includes("lobo") || n.includes("alfa") || n.includes("matriarca") || n.includes("cão") || n.includes("lobisomem") || n.includes("onça") || n.includes("urso") || n.includes("javali") || n.includes("cervo")) return "wolf";
  if (n.includes("aranha") || n.includes("traça")) return "spider";
  if (n.includes("escorpi") || n.includes("escaravelho")) return "scorpion";
  if (n.includes("rato")) return "rat";
  if (n.includes("morcego") || n.includes("harpia")) return "bat";
  if (n.includes("esqueleto") || n.includes("lich") || n.includes("ossu")) return "skeleton";
  if (n.includes("múmia") || n.includes("mumia") || n.includes("faraó") || n.includes("farao") || n.includes("sacerdote")) return "mummy";
  if (n.includes("zumbi") || n.includes("ghoul") || n.includes("mutante") || n.includes("podre") || n.includes("necrofago")) return "zombie";
  if (n.includes("slime") || n.includes("poça") || n.includes("líquido")) return "slime";
  if (n.includes("cogumelo") || n.includes("mycon") || n.includes("esporo") || n.includes("fungo") || n.includes("colônia")) return "mushroom";
  if (n.includes("treant") || n.includes("broto") || n.includes("raiz") || n.includes("espinho") || n.includes("floral") || n.includes("ninfa")) return "treant";
  if (n.includes("drag") || n.includes("wyvern") || n.includes("wyrm") || n.includes("basilisco") || n.includes("hidra") || n.includes("fenix") || n.includes("fênix") || n.includes("águia") || n.includes("roc")) return "dragon";
  if (n.includes("demônio") || n.includes("diabrete") || n.includes("salamandra")) return "demon";
  if (n.includes("anjo") || n.includes("serafim") || n.includes("herald") || n.includes("criador") || n.includes("coro")) return "angel";
  if (n.includes("elemental") || n.includes("vagalume") || n.includes("wisp") || n.includes("fada") || n.includes("estrela") || n.includes("chama") || n.includes("núcleo")) return "elemental";
  if (n.includes("golem") || n.includes("colosso") || n.includes("titã") || n.includes("estátua") || n.includes("ogro") || n.includes("trol") || n.includes("yeti") || n.includes("cristal") || n.includes("prisma") || n.includes("arquiteto")) return "golem";
  if (n.includes("espectro") || n.includes("fantasma") || n.includes("assombra") || n.includes("sombra") || n.includes("umbra") || n.includes("aparição") || n.includes("eco")) return "ghost";
  if (n.includes("aberr") || n.includes("tentáculo") || n.includes("devorador") || n.includes("boca") || n.includes("olho") || n.includes("abismo") || n.includes("verme") || n.includes("fauces")) return "aberration";
  if (n.includes("pirata") || n.includes("corsário") || n.includes("sereia") || n.includes("tubarão") || n.includes("levi") || n.includes("peixe") || n.includes("naga") || n.includes("kraken")) return "aquatic";
  if (n.includes("mago") || n.includes("brux") || n.includes("necro") || n.includes("alquim") || n.includes("xamã")) return "mage";
  if (n.includes("cavaleiro") || n.includes("paladino") || n.includes("guarda") || n.includes("imperador") || n.includes("rei") || n.includes("duque") || n.includes("executor") || n.includes("legionário") || n.includes("anão") || n.includes("kobold")) return "knight";
  return "bandit";
}

function buildEnemyFrame(
  arch: EnemyArchetype,
  baseColor: string,
  isBoss: boolean,
  action: ActorAction,
  frame: number,
): HTMLCanvasElement {
  const p = new PixelCanvas(32, 32);
  const dark = hexShift(baseColor, -48);
  const light = hexShift(baseColor, 42);
  const eyeCol = isBoss ? "#ffea40" : "#ff4040";

  const bob = action === "walk" ? (frame % 2 === 0 ? -1 : 1) : frame % 2 === 0 ? 0 : -1;
  const lunge = action === "attack" ? (frame === 0 ? -2 : frame === 1 || frame === 2 ? 3 : 1) : 0;
  const cx = 16 + lunge;
  const cy = 17 + bob;

  switch (arch) {
    case "wolf": {
      // Quadruped wolf/beast/boar
      p.ellipse(cx - 1, cy + 2, 8, 5, dark);
      p.ellipse(cx - 1, cy + 1, 7, 4, baseColor);
      p.ellipse(cx - 2, cy, 4, 2, light);
      // Tail
      p.line(cx - 8, cy + 1, cx - 12, cy - 2 + (frame % 2), dark);
      // Animated galloping legs
      const stride = action === "walk" ? (frame % 2 === 0 ? 2 : -2) : 0;
      p.rect(cx - 7 + stride, cy + 5, 2, 5, dark);
      p.rect(cx - 3 - stride, cy + 5, 2, 5, baseColor);
      p.rect(cx + 2 + stride, cy + 5, 2, 5, baseColor);
      p.rect(cx + 5 - stride, cy + 5, 2, 5, dark);
      // Head & Snout
      p.ellipse(cx + 6, cy - 3, 5, 4, baseColor);
      p.rect(cx + 8, cy - 3, 5, 3, dark);
      p.px(cx + 12, cy - 3, "#141010");
      p.px(cx + 10, cy, "#ffffff"); // fang
      // Ears
      p.rect(cx + 3, cy - 8, 2, 3, dark);
      p.rect(cx + 6, cy - 8, 2, 3, baseColor);
      // Glowing eye
      p.px(cx + 8, cy - 4, eyeCol);
      break;
    }

    case "spider": {
      // Abdomen + Cephalothorax
      p.ellipse(cx - 3, cy + 1, 6, 5, dark);
      p.ellipse(cx - 3, cy, 4, 3, baseColor);
      p.px(cx - 4, cy - 1, light);
      p.ellipse(cx + 4, cy + 2, 4, 3, baseColor);
      // 8 Articulated spider legs alternating crawl
      const w = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      for (let i = 0; i < 4; i++) {
        const lx = cx - 4 + i * 3;
        const lift = (i + frame) % 2 === 0 ? -1 : 1;
        p.line(lx, cy + 1, lx - 3, cy - 4 + lift * w, dark);
        p.line(lx - 3, cy - 4 + lift * w, lx - 5, cy + 6, baseColor);
        p.line(lx, cy + 3, lx + 3, cy + 6 - lift * w, dark);
        p.line(lx + 3, cy + 6 - lift * w, lx + 6, cy + 9, baseColor);
      }
      p.px(cx + 6, cy + 1, "#ff2040");
      p.px(cx + 7, cy + 2, "#ff2040");
      p.px(cx + 5, cy + 2, "#ffea40");
      break;
    }

    case "scorpion": {
      p.ellipse(cx - 1, cy + 2, 7, 4, dark);
      p.ellipse(cx - 1, cy + 1, 5, 3, baseColor);
      // Segmented curled tail + stinger
      p.line(cx - 7, cy + 1, cx - 10, cy - 5, baseColor);
      p.line(cx - 10, cy - 5, cx - 5, cy - 9, light);
      p.px(cx - 4, cy - 8, "#ffea40");
      // Claws
      const snap = action === "attack" ? 2 : 0;
      p.line(cx + 5, cy + 1, cx + 10 + snap, cy - 2, baseColor);
      p.rect(cx + 9 + snap, cy - 4, 3, 3, light);
      p.line(cx + 5, cy + 3, cx + 10 + snap, cy + 5, dark);
      p.px(cx + 4, cy, eyeCol);
      break;
    }

    case "skeleton": {
      const stride = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      // Legs
      p.rect(cx - 3, cy + 5 + stride, 2, 6, "#dcd4be");
      p.rect(cx + 1, cy + 5 - stride, 2, 6, "#dcd4be");
      // Ribcage
      p.rect(cx - 4, cy - 2, 8, 7, "#a89f8b");
      p.rect(cx - 3, cy - 1, 6, 1, "#f2ebd8");
      p.rect(cx - 3, cy + 1, 6, 1, "#f2ebd8");
      p.rect(cx - 3, cy + 3, 6, 1, "#f2ebd8");
      // Skull
      p.ellipse(cx, cy - 7, 5, 4, "#f2ebd8");
      p.rect(cx - 2, cy - 4, 4, 2, "#d4ccb6");
      p.px(cx - 2, cy - 7, "#180c18");
      p.px(cx + 1, cy - 7, "#180c18");
      p.px(cx - 2, cy - 7, baseColor);
      p.px(cx + 1, cy - 7, baseColor);
      // Sword / Staff
      const swing = action === "attack" && frame >= 1 ? 5 : 0;
      p.line(cx + 5, cy + 2, cx + 8 + swing, cy - 6 + swing, "#cbd6e6");
      break;
    }

    case "mummy": {
      const stride = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      p.rect(cx - 4, cy - 2, 8, 9, "#d6c298");
      p.rect(cx - 4, cy + 1, 8, 1, "#8f7a52");
      p.rect(cx - 4, cy + 4, 8, 1, "#8f7a52");
      p.rect(cx - 3, cy + 7 + stride, 2, 4, "#b8a278");
      p.rect(cx + 1, cy + 7 - stride, 2, 4, "#b8a278");
      p.ellipse(cx, cy - 7, 4, 4, "#e6d4ad");
      p.rect(cx - 4, cy - 7, 8, 1, "#8f7a52");
      if (isBoss) {
        // Pharaoh gold crown / nemes
        p.rect(cx - 5, cy - 11, 10, 3, "#f4c85b");
        p.rect(cx - 1, cy - 13, 2, 3, "#40a0ff");
      }
      // Outstretched mummy arms
      p.rect(cx + 4, cy - 1, 5, 2, "#d6c298");
      p.px(cx + 1, cy - 7, "#ffea40");
      p.px(cx - 1, cy - 7, "#ffea40");
      break;
    }

    case "zombie": {
      const stride = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      p.rect(cx - 4, cy - 1, 8, 8, dark);
      p.rect(cx - 3, cy, 6, 5, baseColor);
      p.rect(cx - 3, cy + 7 + stride, 2, 4, dark);
      p.rect(cx + 1, cy + 7 - stride, 2, 4, dark);
      p.ellipse(cx + 1, cy - 6, 4, 4, light);
      p.rect(cx + 4, cy, 5, 2, light);
      p.px(cx + 2, cy - 7, "#ff3030");
      break;
    }

    case "slime": {
      const sq = action === "walk" ? (frame % 2 === 0 ? 2 : -1) : frame % 2 === 0 ? 1 : 0;
      p.ellipse(cx, cy + 3, 9 + sq, 6 - Math.floor(sq / 2), dark);
      p.ellipse(cx, cy + 2, 8 + sq, 5 - Math.floor(sq / 2), baseColor);
      p.ellipse(cx - 2, cy, 4, 2, light);
      p.px(cx - 3, cy + 1, "#ffffff");
      p.rect(cx - 3, cy + 2, 2, 2, "#120b09");
      p.rect(cx + 2, cy + 2, 2, 2, "#120b09");
      break;
    }

    case "mushroom": {
      p.rect(cx - 3, cy + 1, 6, 8, "#e8dcc4");
      p.rect(cx - 2, cy + 2, 4, 6, "#fff4e0");
      p.ellipse(cx, cy - 3, 9, 5, dark);
      p.ellipse(cx, cy - 4, 8, 4, baseColor);
      p.px(cx - 4, cy - 5, "#ffffff");
      p.px(cx + 3, cy - 4, "#ffffff");
      p.px(cx, cy - 7, "#ffffff");
      p.px(cx - 1, cy + 3, "#120b09");
      p.px(cx + 2, cy + 3, "#120b09");
      break;
    }

    case "treant": {
      p.rect(cx - 4, cy - 2, 8, 12, "#5a381e");
      p.rect(cx - 2, cy, 4, 10, "#7a4e2c");
      p.ellipse(cx, cy - 7, 9, 6, dark);
      p.ellipse(cx - 2, cy - 8, 6, 4, baseColor);
      p.ellipse(cx + 3, cy - 7, 5, 4, light);
      p.px(cx - 2, cy - 1, "#ffea60");
      p.px(cx + 1, cy - 1, "#ffea60");
      break;
    }

    case "dragon": {
      const wing = frame % 2 === 0 ? -4 : 3;
      // Wings
      p.line(cx - 2, cy - 2, cx - 12, cy - 8 + wing, dark);
      p.line(cx - 3, cy, cx - 11, cy - 4 + wing, baseColor);
      p.line(cx + 2, cy - 2, cx + 12, cy - 8 + wing, dark);
      p.line(cx + 3, cy, cx + 11, cy - 4 + wing, baseColor);
      // Scaled Body & Tail
      p.ellipse(cx, cy + 2, 6, 6, dark);
      p.ellipse(cx, cy + 1, 5, 5, baseColor);
      p.rect(cx - 2, cy, 4, 5, light);
      p.line(cx - 3, cy + 6, cx - 8, cy + 10, dark);
      // Horned Head
      p.ellipse(cx + 1, cy - 6, 5, 4, baseColor);
      p.rect(cx + 3, cy - 6, 4, 3, light);
      p.line(cx - 2, cy - 9, cx - 4, cy - 13, "#f4e0a0");
      p.line(cx + 2, cy - 9, cx + 4, cy - 13, "#f4e0a0");
      p.px(cx + 3, cy - 7, "#ffea40");
      break;
    }

    case "demon": {
      const wing = frame % 2 === 0 ? -2 : 2;
      p.line(cx - 3, cy - 2, cx - 11, cy - 6 + wing, "#3a1018");
      p.line(cx + 3, cy - 2, cx + 11, cy - 6 + wing, "#3a1018");
      p.rect(cx - 5, cy - 2, 10, 9, dark);
      p.rect(cx - 4, cy - 1, 8, 7, baseColor);
      p.rect(cx - 4, cy + 7, 3, 4, dark);
      p.rect(cx + 1, cy + 7, 3, 4, dark);
      p.ellipse(cx, cy - 7, 4, 4, baseColor);
      // Horns
      p.line(cx - 3, cy - 9, cx - 6, cy - 13, "#e8d8a0");
      p.line(cx + 3, cy - 9, cx + 6, cy - 13, "#e8d8a0");
      p.px(cx - 2, cy - 7, "#ffea40");
      p.px(cx + 2, cy - 7, "#ffea40");
      break;
    }

    case "angel": {
      const wing = frame % 2 === 0 ? -2 : 2;
      p.ellipse(cx - 8, cy - 2 + wing, 4, 6, "#f4f8ff");
      p.ellipse(cx + 8, cy - 2 + wing, 4, 6, "#f4f8ff");
      p.rect(cx - 4, cy - 2, 8, 10, "#e6ecf8");
      p.rect(cx - 2, cy - 1, 4, 8, "#f4c85b");
      p.ellipse(cx, cy - 7, 4, 4, "#f0c8a0");
      // Halo
      p.line(cx - 3, cy - 13, cx + 3, cy - 13, "#fff090");
      p.line(cx + 6, cy + 2, cx + 9, cy - 8, "#fff8d0");
      break;
    }

    case "elemental": {
      const orbit = frame % 4;
      p.ellipse(cx, cy, 6, 7, dark);
      p.ellipse(cx, cy - 1, 5, 5, baseColor);
      p.ellipse(cx, cy - 2, 3, 3, light);
      p.px(cx - 2, cy - 2, "#ffffff");
      p.px(cx + 2, cy - 2, "#ffffff");
      // Orbiting elemental shards
      const ox = Math.round(Math.cos((orbit * Math.PI) / 2) * 9);
      const oy = Math.round(Math.sin((orbit * Math.PI) / 2) * 6);
      p.rect(cx + ox - 1, cy + oy - 1, 3, 3, light);
      p.rect(cx - ox - 1, cy - oy - 1, 2, 2, baseColor);
      break;
    }

    case "golem": {
      const stomp = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      // Massive shoulders & stone chest
      p.rect(cx - 8, cy - 5, 16, 12, dark);
      p.rect(cx - 7, cy - 4, 14, 10, baseColor);
      p.rect(cx - 5, cy - 3, 10, 4, light);
      // Core rune
      p.rect(cx - 1, cy, 2, 2, "#ffaa30");
      // Arms
      const smash = action === "attack" && frame >= 1 ? 3 : 0;
      p.rect(cx - 11, cy - 2 + smash, 3, 9, dark);
      p.rect(cx + 8, cy - 2 + smash, 3, 9, dark);
      // Legs
      p.rect(cx - 6, cy + 7 + stomp, 4, 5, dark);
      p.rect(cx + 2, cy + 7 - stomp, 4, 5, dark);
      // Head
      p.rect(cx - 4, cy - 10, 8, 5, baseColor);
      p.px(cx - 2, cy - 8, "#ffea40");
      p.px(cx + 1, cy - 8, "#ffea40");
      break;
    }

    case "ghost": {
      const floatY = frame % 2 === 0 ? -1 : 1;
      p.ellipse(cx, cy - 2 + floatY, 7, 8, dark);
      p.ellipse(cx, cy - 3 + floatY, 6, 7, baseColor);
      p.ellipse(cx, cy - 5 + floatY, 4, 4, light);
      // Wispy tail
      p.rect(cx - 5, cy + 5 + floatY, 2, 4, baseColor);
      p.rect(cx - 1, cy + 6 + floatY, 2, 5, baseColor);
      p.rect(cx + 3, cy + 5 + floatY, 2, 4, baseColor);
      p.px(cx - 2, cy - 5 + floatY, "#ffffff");
      p.px(cx + 2, cy - 5 + floatY, "#ffffff");
      break;
    }

    case "aberration": {
      p.ellipse(cx, cy - 1, 8, 7, dark);
      p.ellipse(cx, cy - 2, 7, 6, baseColor);
      // Giant central eye
      p.ellipse(cx, cy - 2, 3, 3, "#ffffff");
      p.rect(cx - 1, cy - 3, 2, 2, "#ff2050");
      // Writhing tentacles
      const w = frame % 2 === 0 ? 1 : -1;
      p.line(cx - 6, cy + 4, cx - 9, cy + 10 + w, dark);
      p.line(cx - 2, cy + 5, cx - 3, cy + 11 - w, baseColor);
      p.line(cx + 2, cy + 5, cx + 3, cy + 11 + w, baseColor);
      p.line(cx + 6, cy + 4, cx + 9, cy + 10 - w, dark);
      break;
    }

    case "rat": {
      p.ellipse(cx, cy + 3, 6, 4, dark);
      p.ellipse(cx, cy + 2, 5, 3, baseColor);
      p.line(cx - 6, cy + 3, cx - 11, cy + 1 + (frame % 2), "#d89090");
      p.ellipse(cx + 5, cy + 1, 3, 2, light);
      p.px(cx + 6, cy, "#ff3030");
      p.px(cx + 3, cy - 1, "#d89090");
      break;
    }

    case "bat": {
      const flap = frame % 2 === 0 ? -4 : 3;
      p.line(cx - 2, cy, cx - 11, cy + flap, dark);
      p.line(cx - 3, cy + 1, cx - 10, cy + 2 + flap, baseColor);
      p.line(cx + 2, cy, cx + 11, cy + flap, dark);
      p.line(cx + 3, cy + 1, cx + 10, cy + 2 + flap, baseColor);
      p.ellipse(cx, cy, 4, 5, baseColor);
      p.px(cx - 2, cy - 5, dark);
      p.px(cx + 2, cy - 5, dark);
      p.px(cx - 1, cy - 1, "#ff4040");
      p.px(cx + 1, cy - 1, "#ff4040");
      break;
    }

    case "aquatic": {
      p.ellipse(cx, cy + 1, 6, 7, dark);
      p.ellipse(cx, cy, 5, 6, baseColor);
      p.rect(cx - 3, cy - 2, 6, 4, light);
      // Dorsal fin
      p.line(cx, cy - 7, cx - 2, cy - 11, light);
      p.px(cx - 2, cy - 3, "#ffea40");
      p.px(cx + 2, cy - 3, "#ffea40");
      // Trident
      p.line(cx + 6, cy + 6, cx + 6, cy - 8, "#c8d8e8");
      p.px(cx + 5, cy - 8, "#ffffff");
      p.px(cx + 7, cy - 8, "#ffffff");
      break;
    }

    case "mage": {
      p.rect(cx - 5, cy - 1, 10, 10, dark);
      p.rect(cx - 3, cy, 6, 8, baseColor);
      p.rect(cx - 1, cy + 1, 2, 7, light);
      p.ellipse(cx, cy - 6, 4, 4, "#d8a878");
      // Hood/hat
      p.rect(cx - 6, cy - 7, 12, 2, dark);
      p.rect(cx - 4, cy - 11, 8, 4, baseColor);
      p.rect(cx - 2, cy - 13, 4, 2, light);
      p.px(cx - 1, cy - 5, eyeCol);
      p.px(cx + 1, cy - 5, eyeCol);
      // Staff
      p.line(cx + 6, cy + 8, cx + 6, cy - 6, "#6a4222");
      p.ellipse(cx + 6, cy - 7, 2, 2, "#ff80ff");
      break;
    }

    case "knight": {
      const stride = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      p.rect(cx - 5, cy - 2, 10, 8, dark);
      p.rect(cx - 4, cy - 1, 8, 6, baseColor);
      p.rect(cx - 2, cy, 4, 3, light);
      p.rect(cx - 4, cy + 6 + stride, 3, 5, dark);
      p.rect(cx + 1, cy + 6 - stride, 3, 5, dark);
      p.rect(cx - 4, cy - 9, 8, 7, baseColor);
      p.rect(cx - 3, cy - 6, 6, 1, "#120b09");
      p.px(cx - 1, cy - 6, eyeCol);
      p.px(cx + 1, cy - 6, eyeCol);
      // Shield & Blade
      p.rect(cx - 8, cy - 1, 3, 6, light);
      const swing = action === "attack" && frame >= 1 ? 5 : 0;
      p.line(cx + 6, cy + 2, cx + 8 + swing, cy - 7 + swing, "#e8f0ff");
      break;
    }

    case "bandit":
    default: {
      const stride = action === "walk" ? (frame % 2 === 0 ? 1 : -1) : 0;
      p.rect(cx - 4, cy - 1, 8, 7, dark);
      p.rect(cx - 3, cy, 6, 5, baseColor);
      p.rect(cx - 3, cy + 6 + stride, 2, 5, "#3a2414");
      p.rect(cx + 1, cy + 6 - stride, 2, 5, "#3a2414");
      p.ellipse(cx, cy - 6, 4, 4, "#d8a878");
      p.rect(cx - 4, cy - 9, 8, 3, dark);
      p.rect(cx - 3, cy - 4, 6, 2, "#241818"); // bandana
      p.px(cx - 1, cy - 6, "#120b09");
      p.px(cx + 1, cy - 6, "#120b09");
      const swing = action === "attack" && frame >= 1 ? 4 : 0;
      p.line(cx + 5, cy + 2, cx + 8 + swing, cy - 5 + swing, "#d8e0e8");
      break;
    }
  }

  // Boss Golden Crown Sigil
  if (isBoss) {
    p.rect(cx - 4, 2, 8, 2, "#f4c85b");
    p.px(cx - 4, 1, "#fff098");
    p.px(cx, 1, "#ff4060");
    p.px(cx + 3, 1, "#fff098");
  }

  return p.finalize("#120b09");
}

// ----------------------------------------------------------------------------
// Sprite Sheet Cache
// ----------------------------------------------------------------------------
const playerCache = new Map<string, HTMLCanvasElement>();
const enemyCache = new Map<string, HTMLCanvasElement>();
const minionCache = new Map<string, HTMLCanvasElement>();

export function getPlayerFrame(
  cls: PlayerClass,
  dir: FacingDir,
  action: ActorAction,
  time: number,
  actionTimer: number,
  walkCycle: number,
): { canvas: HTMLCanvasElement; flipX: boolean } {
  const normDir: FacingDir = dir === "left" || dir === "right" ? "right" : dir;
  const flipX = dir === "left";

  let frame = 0;
  if (action === "idle") {
    frame = Math.floor(time * 4) % 4;
  } else if (action === "walk") {
    frame = Math.floor(walkCycle * 10) % 6;
  } else if (action === "attack") {
    const progress = Math.max(0, Math.min(1, 1 - actionTimer / 0.24));
    frame = Math.min(4, Math.floor(progress * 5));
  } else if (action === "hurt") {
    frame = Math.floor(time * 12) % 2;
  }

  const key = `${cls}:${normDir}:${action}:${frame}`;
  let canvas = playerCache.get(key);
  if (!canvas) {
    canvas = buildPlayerFrame(cls, normDir, action, frame);
    playerCache.set(key, canvas);
  }
  return { canvas, flipX };
}

export function getEnemyFrame(
  e: Enemy,
  time: number,
): { canvas: HTMLCanvasElement; flipX: boolean } {
  const arch = classifyEnemyArchetype(e.name);
  const flipX = e.facing.x < -0.15;

  let frame = 0;
  const act = e.action === "ko" ? "hurt" : e.action;
  if (act === "idle") {
    frame = Math.floor(time * 4 + e.id) % 4;
  } else if (act === "walk") {
    frame = Math.floor(e.walkCycle * 8) % 4;
  } else if (act === "attack") {
    const progress = Math.max(0, Math.min(1, 1 - e.actionTimer / 0.28));
    frame = Math.min(3, Math.floor(progress * 4));
  }

  const key = `${arch}:${e.color}:${e.isBoss ? 1 : 0}:${act}:${frame}`;
  let canvas = enemyCache.get(key);
  if (!canvas) {
    canvas = buildEnemyFrame(arch, e.color, e.isBoss, act, frame);
    enemyCache.set(key, canvas);
  }
  return { canvas, flipX };
}

export function getMinionFrame(time: number, walkCycle: number, attacking: boolean): HTMLCanvasElement {
  const act: ActorAction = attacking ? "attack" : "walk";
  const frame = attacking ? Math.floor(time * 12) % 4 : Math.floor(walkCycle * 8) % 4;
  const key = `minion:${act}:${frame}`;
  let canvas = minionCache.get(key);
  if (!canvas) {
    canvas = buildEnemyFrame("skeleton", "#b878ff", false, act, frame);
    minionCache.set(key, canvas);
  }
  return canvas;
}

// Render an animated class sprite directly into a small DOM preview canvas
export function renderClassPreview(canvas: HTMLCanvasElement, cls: PlayerClass, time: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const { canvas: spr } = getPlayerFrame(cls, "down", "idle", time, 0, time);
  ctx.drawImage(spr, 0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = prev;
}
