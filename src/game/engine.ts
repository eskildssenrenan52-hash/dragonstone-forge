// Eternal Realms - offline 2D action RPG engine
// Single-file game core. Rendered on a canvas, no external assets.

export type Biome = {
  id: number;
  name: string;
  color: string;
  accent: string;
  danger: number; // 1..30
  monsters: string[];
  boss: string;
  // Sub-floor (cave/dungeon) theme
  caveTheme: {
    label: string; // e.g. "Cripta", "Masmorra", "Gruta"
    floor: string;
    wall: string;
    accent: string;
    monsters: string[];
    boss: string;
  };
};

// Helper to derive cave theme quickly
function ct(label: string, floor: string, wall: string, accent: string, monsters: string[], boss: string) {
  return { label, floor, wall, accent, monsters, boss };
}

export const BIOMES: Biome[] = [
  { id: 1,  name: "Planícies de Aurora",    color: "#6fb85f", accent: "#3d7a3a", danger: 1,  monsters: ["Lobo Cinzento", "Bandido", "Javali"],              boss: "Alfa da Alvorada",
    caveTheme: ct("Toca da Alvorada", "#3a3a2a", "#1a1a12", "#8fae60", ["Lobo Sombrio", "Rato Grande", "Salteador Oculto"], "Matriarca dos Lobos") },
  { id: 2,  name: "Floresta Esmeralda",     color: "#2f6a3a", accent: "#1e4a26", danger: 3,  monsters: ["Aranha Gigante", "Treant Jovem", "Elfo Sombrio"],  boss: "Guardião Esmeralda",
    caveTheme: ct("Ninho da Floresta", "#1a2a1a", "#0a180a", "#4faf60", ["Aranha das Raízes", "Broto Corrompido", "Traça Verde"], "Aranha-Mãe Esmeralda") },
  { id: 3,  name: "Deserto Escarlate",      color: "#d09550", accent: "#8f5a2a", danger: 5,  monsters: ["Escorpião Real", "Múmia", "Salteador"],            boss: "Faraó Esquecido",
    caveTheme: ct("Tumba do Faraó", "#3a2818", "#1a1008", "#c08a40", ["Múmia Antiga", "Escaravelho Ígneo", "Sacerdote Sepulto"], "Faraó Ressurgido") },
  { id: 4,  name: "Montanhas de Ferro",     color: "#8a8a92", accent: "#4a4a52", danger: 7,  monsters: ["Golem de Pedra", "Ogro", "Anão Renegado"],         boss: "Colosso de Ferro",
    caveTheme: ct("Mina de Ferro", "#2a2a30", "#12121a", "#8090a0", ["Kobold Mineiro", "Golem Menor", "Aranha Metálica"], "Forjador Colossal") },
  { id: 5,  name: "Pântano Sombrio",        color: "#4a5a3a", accent: "#22331f", danger: 9,  monsters: ["Zumbi Afogado", "Bruxa", "Serpente Venenosa"],     boss: "Hidra do Pântano",
    caveTheme: ct("Cripta do Lodo", "#1a2018", "#08100a", "#5a8040", ["Verme Podre", "Bruxa Menor", "Slime Tóxico"], "Hidra Enraizada") },
  { id: 6,  name: "Tundra Boreal",          color: "#c4d8dc", accent: "#7a9098", danger: 11, monsters: ["Urso Polar", "Lobo Gelado", "Espectro Ártico"],    boss: "Imperador do Gelo",
    caveTheme: ct("Caverna Congelada", "#2a3a40", "#12181c", "#a8c8d8", ["Espectro Ártico", "Aranha do Gelo", "Draugr"], "Rei do Permafrost") },
  { id: 7,  name: "Cordilheira Glacial",    color: "#a8c8d8", accent: "#5a7080", danger: 13, monsters: ["Grifo Gelado", "Yeti", "Arqueiro Boreal"],         boss: "Dragão Boreal",
    caveTheme: ct("Câmara do Dragão", "#20303a", "#0a1418", "#98b0c0", ["Filhote Draconiano", "Yeti Cavernícola", "Espírito Gelado"], "Dragão Ancestral") },
  { id: 8,  name: "Selva Tropical",         color: "#3d8a3a", accent: "#1f5020", danger: 6,  monsters: ["Onça", "Naga", "Caçador de Cabeças"],              boss: "Altar da Selva",
    caveTheme: ct("Templo da Naga", "#1a2818", "#08140a", "#5aa060", ["Naga das Sombras", "Onça Espectral", "Ídolo Vivo"], "Sacerdotisa Naga") },
  { id: 9,  name: "Floresta Carmesim",      color: "#8a3a3a", accent: "#4a1010", danger: 14, monsters: ["Lobisomem", "Fada Rubra", "Cervo Sombrio"],        boss: "Guardião Rubi",
    caveTheme: ct("Covil Sangrento", "#2a1010", "#100404", "#c04040", ["Lobisomem Menor", "Vampiro Jovem", "Fada Corrompida"], "Alfa Escarlate") },
  { id: 10, name: "Vulcões de Obsidiana",   color: "#5a2020", accent: "#2a0a0a", danger: 18, monsters: ["Elemental de Lava", "Demônio Menor", "Salamandra"], boss: "Titã de Obsidiana",
    caveTheme: ct("Forja Vulcânica", "#2a0808", "#100404", "#e05020", ["Diabrete", "Elemental Ígneo", "Salamandra Fundida"], "Senhor do Magma") },
  { id: 11, name: "Costa Tempestuosa",      color: "#8ab0c8", accent: "#3a5060", danger: 4,  monsters: ["Corsário", "Kraken Jovem", "Homem-Peixe"],         boss: "Almirante Fantasma",
    caveTheme: ct("Gruta Marinha", "#1a2830", "#080f14", "#60a0c0", ["Homem-Peixe", "Marujo Afogado", "Polvo Menor"], "Capitão Naufragado") },
  { id: 12, name: "Arquipélago das Marés",  color: "#5aa8c8", accent: "#204a60", danger: 8,  monsters: ["Pirata", "Sereia Sombria", "Tubarão Colossal"],    boss: "Leviatã das Marés",
    caveTheme: ct("Fossa das Marés", "#0a1a24", "#040a10", "#4090b0", ["Sereia Sombria", "Anguíla Elétrica", "Casco Amaldiçoado"], "Leviatã Menor") },
  { id: 13, name: "Cavernas de Cristal",    color: "#a89ad8", accent: "#4a3a80", danger: 10, monsters: ["Golem de Cristal", "Aranha de Ametista", "Minerador Louco"], boss: "Rainha de Cristal",
    caveTheme: ct("Geoda Profunda", "#2a2040", "#100818", "#a880ff", ["Cristal Andante", "Larva de Ametista", "Ecoador"], "Coração de Cristal") },
  { id: 14, name: "Penhascos Celestiais",   color: "#c8d8e8", accent: "#6a7a90", danger: 16, monsters: ["Águia Real", "Servo Angelical", "Gárgula"],        boss: "Serafim Caído",
    caveTheme: ct("Santuário Suspenso", "#2a303a", "#101418", "#c8d0e0", ["Gárgula Menor", "Coro Distorcido", "Anjo Menor"], "Herald Caído") },
  { id: 15, name: "Vale dos Ventos",        color: "#a8c890", accent: "#5a7040", danger: 5,  monsters: ["Elemental de Ar", "Wyvern Jovem", "Ladrão do Vento"], boss: "Roc Ancião",
    caveTheme: ct("Câmara Sussurrante", "#20281c", "#0c100a", "#a0c088", ["Espírito Sibilante", "Morcego Cortante", "Assobio Vivo"], "Vórtice Ancião") },
  { id: 16, name: "Campos Dourados",        color: "#e0c060", accent: "#907028", danger: 2,  monsters: ["Espantalho Vivo", "Rato Gigante", "Camponês Amaldiçoado"], boss: "Ceifador Dourado",
    caveTheme: ct("Adega Amaldiçoada", "#302818", "#100c08", "#d8b040", ["Rato Amaldiçoado", "Espantalho Menor", "Camponês Podre"], "Ceifador Menor") },
  { id: 17, name: "Ruínas Imperiais",       color: "#a89078", accent: "#5a4830", danger: 12, monsters: ["Cavaleiro Fantasma", "Estátua Viva", "Legionário"], boss: "Imperador Espectral",
    caveTheme: ct("Catacumbas Imperiais", "#28201a", "#100c08", "#c0a080", ["Legionário Espectral", "Escravo Amaldiçoado", "Estátua Menor"], "Senador Cadavérico") },
  { id: 18, name: "Reino Subterrâneo",      color: "#605068", accent: "#2a2030", danger: 15, monsters: ["Anão Ancião", "Trol das Cavernas", "Dweller"],     boss: "Rei das Profundezas",
    caveTheme: ct("Profundezas do Trono", "#181420", "#080610", "#807090", ["Verme das Rochas", "Trol Menor", "Dweller Cego"], "Trono Fundo") },
  { id: 19, name: "Mar de Cinzas",          color: "#706860", accent: "#302a24", danger: 17, monsters: ["Fenix Menor", "Cão Ígneo", "Espírito de Fumaça"], boss: "Fênix Ancestral",
    caveTheme: ct("Cratera Fumegante", "#201814", "#0c0806", "#c0806a", ["Cão de Cinzas", "Salamandra Menor", "Espectro Fumaça"], "Fênix Menor") },
  { id: 20, name: "Bosque Luminescente",    color: "#5a4a90", accent: "#2a1f4a", danger: 12, monsters: ["Fada Corrompida", "Cogumelo Andante", "Vagalume Gigante"], boss: "Rainha Bioluminescente",
    caveTheme: ct("Micélio Profundo", "#141028", "#080418", "#a880f0", ["Cogumelo Explosivo", "Vagalume Sombrio", "Micomorfe"], "Rainha do Micélio") },
  { id: 21, name: "Ilha das Tempestades",   color: "#4a5a80", accent: "#1a2440", danger: 19, monsters: ["Elemental de Raio", "Marinheiro Amaldiçoado", "Harpia"], boss: "Senhor das Tempestades",
    caveTheme: ct("Câmara do Trovão", "#101828", "#060a14", "#80a0f0", ["Elemental Voltaico", "Harpia Menor", "Marujo Voltaico"], "Coração da Tempestade") },
  { id: 22, name: "Fortaleza Abandonada",   color: "#585868", accent: "#282838", danger: 20, monsters: ["Cavaleiro Caído", "Necromante", "Lich Aprendiz"],  boss: "Rei Caído",
    caveTheme: ct("Masmorra do Rei", "#181820", "#080810", "#a0a0c0", ["Cavaleiro Esqueleto", "Aprendiz Lich", "Servo Necro"], "Príncipe Amaldiçoado") },
  { id: 23, name: "Cânion Rubro",           color: "#c0603a", accent: "#7a3018", danger: 11, monsters: ["Basilisco", "Bandoleiro", "Escorpião Vermelho"],   boss: "Wyrm do Cânion",
    caveTheme: ct("Fenda do Wyrm", "#301810", "#100806", "#d0603a", ["Basilisco Jovem", "Escorpião Menor", "Bandoleiro Oculto"], "Wyrm Menor") },
  { id: 24, name: "Picos Celestes",         color: "#d0dae8", accent: "#7080a0", danger: 21, monsters: ["Dragão Alado", "Monge Ancião", "Roc"],             boss: "Deus dos Ventos",
    caveTheme: ct("Câmara do Ventos", "#20282e", "#0c1014", "#c0d0e8", ["Monge Espectral", "Wyvern Jovem", "Roc Jovem"], "Ancião dos Ventos") },
  { id: 25, name: "Jardim Ancestral",       color: "#80c080", accent: "#3a6a3a", danger: 14, monsters: ["Ninfa", "Espinho Vivo", "Guardião Floral"],        boss: "Espírito Ancestral",
    caveTheme: ct("Raízes Ancestrais", "#182818", "#080c08", "#80d080", ["Raiz Faminta", "Ninfa Menor", "Broto Espinhado"], "Coração Ancião") },
  { id: 26, name: "Cidade Perdida",         color: "#98908a", accent: "#4a4038", danger: 16, monsters: ["Cidadão Amaldiçoado", "Cão de Guerra", "Ladrão Fantasma"], boss: "Prefeito Corrompido",
    caveTheme: ct("Esgotos Perdidos", "#20201c", "#0c0c08", "#a89880", ["Rato Amaldiçoado", "Ladrão Espectral", "Cidadão Podre"], "Contramestre Espectral") },
  { id: 27, name: "Abismo Infinito",        color: "#2a2038", accent: "#100818", danger: 24, monsters: ["Aberrante", "Tentáculo", "Devorador"],             boss: "Coisa do Abismo",
    caveTheme: ct("Fenda Impossível", "#100818", "#040208", "#6040a0", ["Tentáculo Menor", "Olho Flutuante", "Voraz Cego"], "Devorador Menor") },
  { id: 28, name: "Reino das Sombras",      color: "#1a1a2a", accent: "#080810", danger: 26, monsters: ["Sombra", "Assassino Sombrio", "Umbra"],             boss: "Rei das Sombras",
    caveTheme: ct("Vazio Sombrio", "#080810", "#020208", "#4a4a6a", ["Sombra Vazia", "Assassino Umbra", "Eco Sombrio"], "Príncipe Sombrio") },
  { id: 29, name: "Plano Astral",           color: "#5a3a90", accent: "#2a1a4a", danger: 28, monsters: ["Vigia Astral", "Estrela Caída", "Fragmento Cósmico"], boss: "Sentinela Cósmico",
    caveTheme: ct("Nexo Astral", "#181028", "#080418", "#a080ff", ["Fragmento Menor", "Vigia Menor", "Eco Astral"], "Sentinela Menor") },
  { id: 30, name: "Trono dos Criadores",    color: "#e0c078", accent: "#a08040", danger: 30, monsters: ["Anjo do Alvorecer", "Herald Divino", "Serafim"],   boss: "O Criador",
    caveTheme: ct("Câmara Divina", "#302818", "#100c08", "#f0d090", ["Herald Menor", "Serafim Menor", "Coro Divino"], "Arauto do Criador") },
  // ---- New biomes 31..40 ----
  { id: 31, name: "Deserto de Sal",         color: "#e8e0c8", accent: "#a89870", danger: 6,  monsters: ["Cristalino Salino", "Nômade Cego", "Escorpião Branco"], boss: "Rainha do Sal",
    caveTheme: ct("Caverna Salina", "#302818", "#100c08", "#e8dcb0", ["Cristal Salino", "Verme das Salinas", "Espectro do Sal"], "Coração Salino") },
  { id: 32, name: "Terras Radioativas",     color: "#8ac040", accent: "#4a6018", danger: 22, monsters: ["Mutante", "Ghoul Verde", "Cão Deformado"],         boss: "Aberração Prima",
    caveTheme: ct("Bunker Radioativo", "#18201a", "#080c08", "#a0ff40", ["Ghoul Menor", "Rato Mutante", "Servo Radioativo"], "Núcleo Vivo") },
  { id: 33, name: "Cemitério Fúnebre",      color: "#5a5060", accent: "#2a2030", danger: 13, monsters: ["Esqueleto Guerreiro", "Cão Necrótico", "Necrofago"], boss: "Coveiro Eterno",
    caveTheme: ct("Cripta Ossuária", "#181420", "#080610", "#c0b0d0", ["Esqueleto Menor", "Ghoul Sepulto", "Espectro Cadavérico"], "Lich Ancião") },
  { id: 34, name: "Ilhas Flutuantes",       color: "#8ac0e0", accent: "#3a6080", danger: 15, monsters: ["Wyvern Menor", "Servo do Vento", "Piloto Aéreo"],  boss: "Skywhale Ancião",
    caveTheme: ct("Câmara Suspensa", "#182028", "#080c10", "#a0d0f0", ["Servo do Vento", "Espírito Nublado", "Djinn Menor"], "Djinn Ancião") },
  { id: 35, name: "Grutas de Mercúrio",     color: "#b0b8c0", accent: "#5a6068", danger: 19, monsters: ["Elemental Líquido", "Espelho Vivo", "Alquimista Amaldiçoado"], boss: "Prisma do Mercúrio",
    caveTheme: ct("Lago de Mercúrio", "#181820", "#080810", "#d0d8e0", ["Poça Líquida", "Espelho Menor", "Reflexo Sombrio"], "Titã do Mercúrio") },
  { id: 36, name: "Planalto Fúngico",       color: "#a880c0", accent: "#4a2a60", danger: 10, monsters: ["Mycon", "Esporo Andante", "Guardião do Fungo"],    boss: "Colônia-Mãe",
    caveTheme: ct("Micélio das Sombras", "#181020", "#080418", "#c090e0", ["Esporo Explosivo", "Mycon Menor", "Sombra Fúngica"], "Rainha Fúngica") },
  { id: 37, name: "Ruínas Cristalinas",     color: "#c0e0e8", accent: "#5080a0", danger: 17, monsters: ["Estátua de Prisma", "Guardião Ancião", "Vidro Vivo"], boss: "Arquiteto de Vidro",
    caveTheme: ct("Sanctum de Vidro", "#182028", "#080c10", "#c0e8f0", ["Fragmento Andante", "Guardião Menor", "Prisma Sombrio"], "Sanctum Ancião") },
  { id: 38, name: "Vastidão Voraz",         color: "#603838", accent: "#301818", danger: 23, monsters: ["Devorador Menor", "Boca Andante", "Tentáculo Faminto"], boss: "Fauces do Mundo",
    caveTheme: ct("Estômago do Mundo", "#201010", "#0c0606", "#a04040", ["Órgão Vivo", "Verme Digestivo", "Ácido Andante"], "Fauces Menores") },
  { id: 39, name: "Bosque Espectral",       color: "#3a5a5a", accent: "#182828", danger: 20, monsters: ["Assombração", "Cervo Espectral", "Wisp Sombrio"],  boss: "Senhora dos Espectros",
    caveTheme: ct("Cripta Espectral", "#141c1c", "#080e0e", "#80c0c0", ["Wisp Menor", "Aparição", "Servo Espectral"], "Espectro Ancestral") },
  { id: 40, name: "Núcleo do Mundo",        color: "#c04010", accent: "#601808", danger: 30, monsters: ["Elemental Primal", "Coração de Magma", "Titã Menor"], boss: "Coração do Mundo",
    caveTheme: ct("Câmara do Núcleo", "#200806", "#100404", "#ff6020", ["Chama Primal", "Servo do Núcleo", "Elemental Fundido"], "Núcleo Ancião") },
];

export type Rarity = "comum" | "incomum" | "raro" | "épico" | "lendário";
export const RARITY_COLOR: Record<Rarity, string> = {
  comum: "#c8c8c8",
  incomum: "#5ecf5e",
  raro: "#5ea8ff",
  épico: "#c25ef0",
  lendário: "#f0b040",
};
const RARITY_MULT: Record<Rarity, number> = { comum: 1, incomum: 1.4, raro: 1.9, épico: 2.6, lendário: 3.6 };

export type Item = {
  id: string;
  name: string;
  kind: "weapon" | "armor" | "potion" | "material";
  rarity: Rarity;
  power: number;
  icon: string;
  color: string;
  // Optional metadata (see ExtItem below for the full crafting/pickaxe/enchant/gem set).
  quality?: "comum" | "bom" | "excelente" | "perfeito" | "obra-prima" | "lendario" | "divino";
  enchant?: "fogo" | "gelo" | "veneno" | "luz" | "sombra" | "raio" | "sangramento" | "vampirismo" | "critico" | "velocidade" | "mana" | "hp";
  gems?: string[];
  slots?: number;
  evolution?: number;
  isPickaxe?: boolean;
  pickaxeTier?: number;
};


let itemSeq = 0;
export function makeItem(kind: Item["kind"], tier: number, rarity: Rarity): Item {
  itemSeq++;
  const baseNames = {
    weapon: ["Espada", "Machado", "Lança", "Adaga", "Cajado", "Arco", "Martelo", "Foice"],
    armor: ["Elmo", "Peitoral", "Grevas", "Manto", "Escudo", "Botas", "Braçadeiras"],
    potion: ["Poção Menor", "Poção", "Poção Maior", "Elixir", "Néctar"],
    material: ["Minério", "Erva", "Couro", "Osso", "Cristal", "Essência", "Escama"],
  };
  const suffix = ["de Ferro", "do Vento", "das Sombras", "da Aurora", "do Trovão", "do Vazio", "Rúnico", "Ancestral", "do Dragão", "Estelar"];
  const n = baseNames[kind][Math.floor(Math.random() * baseNames[kind].length)];
  const s = kind === "material" ? "" : " " + suffix[Math.min(suffix.length - 1, tier - 1 + Math.floor(Math.random() * 3))];
  const power = Math.round((5 + tier * 4) * RARITY_MULT[rarity] * (kind === "potion" ? 3 : 1));
  const glyph = kind === "weapon" ? "⚔" : kind === "armor" ? "🛡" : kind === "potion" ? "🧪" : "◈";
  return {
    id: `it_${itemSeq}`,
    name: `${n}${s}`,
    kind,
    rarity,
    power,
    icon: glyph,
    color: RARITY_COLOR[rarity],
  };
}

export function rollRarity(luck = 0): Rarity {
  const r = Math.random() * 100 - luck;
  if (r > 98) return "lendário";
  if (r > 92) return "épico";
  if (r > 78) return "raro";
  if (r > 55) return "incomum";
  return "comum";
}

// -------- World generation --------
export const TILE = 32;
export const CHUNK = 32;
export const WORLD_CHUNKS = 24; // 24x24 chunks => 768x768 tiles (~3x a área anterior; biomas ~3x maiores)

// Tile kinds:
// 0 grass, 1 water, 2 mountain/wall, 3 sand, 4 tree, 5 city, 6 stair-down, 7 stair-up
// Extended (dungeon + central city):
// 8 torch, 9 cracked stone wall (blocking), 10 iron gate (walkable),
// 11 steel pillar (blocking), 12 chest, 13 building floor,
// 14 building wall (blocking), 15 fountain (blocking),
// 16 grand-dungeon stair down (special — from central city into the 100-floor dungeon)
export type TileKind = number;

export type WorldTile = { kind: TileKind; biome: number };
export type City = { name: string; x: number; y: number; biome: number };
export type Stair = { x: number; y: number; biome: number; kind: "down" | "up" };

function hash2(x: number, y: number, seed: number) {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function smoothNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x: number, y: number, seed: number, oct = 4) {
  let s = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    s += smoothNoise(x * freq, y * freq, seed + i * 101) * amp;
    norm += amp; amp *= 0.5; freq *= 2;
  }
  return s / norm;
}

const CITY_NAMES = [
  "Aurora", "Elvengarde", "Solmara", "Ferrondh", "Murkholme",
  "Nivalis", "Skyreach", "Verdanor", "Sanguemera", "Emberforge",
  "Portstorm", "Marésia", "Cristallum", "Aetheris", "Ventaria",
  "Trigal", "Imperia", "Undralar", "Cinderfall", "Lumenglade",
  "Fulminis", "Vanheim", "Cânios", "Kaelstone", "Verdanthal",
  "Perdisia", "Voidhaven", "Umbralis", "Astraeon", "Zenithar",
  "Saltmere", "Radgrad", "Ossuária", "Aeronis", "Mercúria",
  "Fungara", "Prismath", "Voracis", "Espectra", "Corvath",
];

// Common interface for any playable map
export interface PlayMap {
  size: number;
  seed: number;
  isBlocked(x: number, y: number): boolean;
  get(x: number, y: number): WorldTile;
  readonly stairs: Stair[];
  readonly isCave: boolean;
  readonly biomeId: number; // for caves; 0 for overworld
  readonly spawn: { x: number; y: number };
}

export class World implements PlayMap {
  size: number;
  seed: number;
  tiles: WorldTile[];
  biomeSeeds: { x: number; y: number; biome: number }[] = [];
  cities: City[] = [];
  stairs: Stair[] = [];
  spawn: { x: number; y: number } = { x: 0, y: 0 };
  readonly isCave = false;
  readonly biomeId = 0;
  constructor(seed = 1337) {
    this.seed = seed;
    this.size = WORLD_CHUNKS * CHUNK;
    this.tiles = new Array(this.size * this.size);
    this.generate();
  }
  idx(x: number, y: number) { return y * this.size + x; }
  inBounds(x: number, y: number) { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  get(x: number, y: number): WorldTile {
    if (!this.inBounds(x, y)) return { kind: 1, biome: 0 };
    return this.tiles[this.idx(x, y)];
  }
  isBlocked(x: number, y: number) {
    const t = this.get(x, y).kind;
    return t === 1 || t === 2 || t === 4 || t === 9 || t === 11 || t === 14 || t === 15;
  }
  grandStair: { x: number; y: number } | null = null;
  centralCity: { x: number; y: number; radius: number } | null = null;
  private landMask(x: number, y: number) {
    const s = this.size;
    const dx = (x / s) * 2 - 1, dy = (y / s) * 2 - 1;
    const radial = 1 - Math.sqrt(dx * dx + dy * dy);
    const distort = fbm(x / 60, y / 60, this.seed + 999, 4) * 0.55;
    return Math.max(0, Math.min(1, radial + distort - 0.2));
  }
  generate() {
    const s = this.size;
    const cols = 8, rows = 5; // 40 biomes
    const padX = s * 0.10, padY = s * 0.12;
    const cellW = (s - padX * 2) / cols;
    const cellH = (s - padY * 2) / rows;
    let biomeIdx = 0;
    const order = BIOMES.map(b => b.id);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (biomeIdx >= order.length) break;
        const jx = (hash2(c, r, this.seed + 11) - 0.5) * cellW * 0.7;
        const jy = (hash2(c, r, this.seed + 22) - 0.5) * cellH * 0.7;
        let sx = padX + cellW * (c + 0.5) + jx;
        let sy = padY + cellH * (r + 0.5) + jy;
        for (let k = 0; k < 6 && this.landMask(sx, sy) < 0.15; k++) {
          sx += (s / 2 - sx) * 0.25;
          sy += (s / 2 - sy) * 0.25;
        }
        this.biomeSeeds.push({ x: sx, y: sy, biome: order[biomeIdx++] });
      }
    }
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const mask = this.landMask(x, y);
        if (mask < 0.15) { this.tiles[this.idx(x, y)] = { kind: 1, biome: 0 }; continue; }
        const wx = x + (fbm(x / 22, y / 22, this.seed + 33, 3) - 0.5) * 24;
        const wy = y + (fbm(x / 22, y / 22, this.seed + 44, 3) - 0.5) * 24;
        let bestD = Infinity, bestBiome = 1;
        for (const seed of this.biomeSeeds) {
          const dx = seed.x - wx, dy = seed.y - wy;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; bestBiome = seed.biome; }
        }
        let kind: TileKind = 0;
        const biome = bestBiome;
        if (biome === 3 || biome === 23 || biome === 19 || biome === 31) kind = 3;
        if ((biome === 4 || biome === 7 || biome === 14 || biome === 24 || biome === 10 || biome === 18 || biome === 22 || biome === 27 || biome === 37 || biome === 40)
            && hash2(x, y, this.seed + 61) > 0.72) kind = 2;
        if ((biome === 2 || biome === 8 || biome === 9 || biome === 20 || biome === 25 || biome === 39)
            && hash2(x, y, this.seed + 62) > 0.76) kind = 4;
        if ((biome === 5 || biome === 20 || biome === 33) && hash2(x, y, this.seed + 63) > 0.94) kind = 1;
        if ((biome === 11 || biome === 12 || biome === 21 || biome === 34) && hash2(x, y, this.seed + 64) > 0.55) kind = 1;
        if (mask < 0.22 && hash2(x, y, this.seed + 65) > 0.4) kind = 3;
        this.tiles[this.idx(x, y)] = { kind, biome };
      }
    }
    // cities + staircases per biome
    for (let i = 0; i < this.biomeSeeds.length; i++) {
      const s0 = this.biomeSeeds[i];
      const cx = Math.floor(s0.x), cy = Math.floor(s0.y);
      for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) {
        if (this.inBounds(cx + xx, cy + yy)) {
          const t = this.tiles[this.idx(cx + xx, cy + yy)];
          if (t.kind !== 1) t.kind = 0;
        }
      }
      if (this.inBounds(cx, cy)) this.tiles[this.idx(cx, cy)].kind = 5;
      this.cities.push({
        name: CITY_NAMES[i] ?? `Cidade ${i + 1}`,
        x: s0.x * TILE, y: s0.y * TILE, biome: s0.biome,
      });
      // place staircase down offset from city — sempre em local alcançável a partir da cidade
      const offsets: Array<[number, number]> = [[5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, 4], [4, -4], [-4, -4], [6, 0], [-6, 0], [0, 6], [0, -6]];
      for (const [ox, oy] of offsets) {
        const sxT = cx + ox, syT = cy + oy;
        if (!this.inBounds(sxT, syT)) continue;
        const t = this.tiles[this.idx(sxT, syT)];
        if (t.kind === 5) continue;
        // Esvazia um patch 3x3 ao redor da escada (nunca sobre água/cidade)
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          if (this.inBounds(sxT + xx, syT + yy)) {
            const tt = this.tiles[this.idx(sxT + xx, syT + yy)];
            if (tt.kind !== 5) tt.kind = 0;
          }
        }
        // Cava um corredor 3-tiles de largura entre a praça da cidade e a escada,
        // garantindo que o jogador SEMPRE consiga alcançá-la.
        const stepX = Math.sign(sxT - cx), stepY = Math.sign(syT - cy);
        let px = cx, py = cy;
        const carve = (x: number, y: number) => {
          for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
            const nx = x + xx, ny = y + yy;
            if (!this.inBounds(nx, ny)) continue;
            const tt = this.tiles[this.idx(nx, ny)];
            if (tt.kind !== 5 && tt.kind !== 6) tt.kind = 0;
          }
        };
        while (px !== sxT || py !== syT) {
          if (px !== sxT) px += stepX;
          carve(px, py);
          if (py !== syT) py += stepY;
          carve(px, py);
        }
        t.kind = 6;
        this.stairs.push({ x: sxT * TILE + TILE / 2, y: syT * TILE + TILE / 2, biome: s0.biome, kind: "down" });
        break;
      }
    }
    const capital = this.cities.find(c => c.biome === 1) ?? this.cities[0];
    this.spawn = { x: capital.x, y: capital.y };
    const sxT = Math.floor(capital.x / TILE), syT = Math.floor(capital.y / TILE);
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      if (this.inBounds(sxT + xx, syT + yy)) {
        const t = this.tiles[this.idx(sxT + xx, syT + yy)];
        if (t.kind !== 5 && t.kind !== 6) t.kind = 0;
      }
    }
    // ============ Central City of Asterion ============
    // Overwrites the capital tile with a proper walled city, complete with
    // buildings, torches, a central fountain, and a special GRAND staircase
    // that leads into the 100-floor Dungeon of Asterion.
    this.buildCentralCity(sxT, syT);
  }

  private buildCentralCity(cx: number, cy: number) {
    const R = 14; // city radius (in tiles)
    this.centralCity = { x: cx, y: cy, radius: R };
    // Plaza floor + outer wall ring
    for (let yy = -R; yy <= R; yy++) {
      for (let xx = -R; xx <= R; xx++) {
        const x = cx + xx, y = cy + yy;
        if (!this.inBounds(x, y)) continue;
        const d = Math.max(Math.abs(xx), Math.abs(yy));
        const t = this.tiles[this.idx(x, y)];
        if (d === R) {
          t.kind = 14; // stone wall ring
          t.biome = 1;
        } else if (d < R) {
          t.kind = 13; // paved city floor
          t.biome = 1;
        }
      }
    }
    // Four gate openings
    for (const [gx, gy] of [[cx + R, cy], [cx - R, cy], [cx, cy + R], [cx, cy - R]] as [number,number][]) {
      if (this.inBounds(gx, gy)) this.tiles[this.idx(gx, gy)].kind = 10;
      if (this.inBounds(gx, gy - 1)) this.tiles[this.idx(gx, gy - 1)].kind = 10;
      if (this.inBounds(gx, gy + 1)) this.tiles[this.idx(gx, gy + 1)].kind = 10;
    }
    // Corner towers (steel pillars)
    for (const [dx, dy] of [[-R, -R], [R, -R], [-R, R], [R, R]] as [number,number][]) {
      const x = cx + dx, y = cy + dy;
      if (this.inBounds(x, y)) this.tiles[this.idx(x, y)].kind = 11;
    }
    // Wall torches on the ring
    for (let yy = -R; yy <= R; yy += 3) {
      const sides: Array<[number, number]> = [[cx - R + 1, cy + yy], [cx + R - 1, cy + yy]];
      for (const [tx, ty] of sides) {
        if (this.inBounds(tx, ty) && this.tiles[this.idx(tx, ty)].kind === 13) {
          this.tiles[this.idx(tx, ty)].kind = 8;
        }
      }
    }
    for (let xx = -R; xx <= R; xx += 3) {
      const sides: Array<[number, number]> = [[cx + xx, cy - R + 1], [cx + xx, cy + R - 1]];
      for (const [tx, ty] of sides) {
        if (this.inBounds(tx, ty) && this.tiles[this.idx(tx, ty)].kind === 13) {
          this.tiles[this.idx(tx, ty)].kind = 8;
        }
      }
    }
    // Central fountain (3x3 with fountain in the middle)
    for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
      if (this.inBounds(cx + xx, cy + yy)) this.tiles[this.idx(cx + xx, cy + yy)].kind = 13;
    }
    if (this.inBounds(cx, cy)) this.tiles[this.idx(cx, cy)].kind = 15;
    // Buildings: a few 3x3 building blocks in the quadrants
    const buildings: Array<[number, number]> = [
      [cx - 8, cy - 7], [cx + 5, cy - 7], [cx - 8, cy + 5], [cx + 5, cy + 5],
      [cx - 10, cy - 2], [cx + 7, cy - 2],
    ];
    for (const [bx, by] of buildings) {
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) {
        const x = bx + xx, y = by + yy;
        if (!this.inBounds(x, y)) continue;
        if (xx === 0 || yy === 0 || xx === 3 || yy === 3) {
          this.tiles[this.idx(x, y)].kind = 14;
        } else {
          this.tiles[this.idx(x, y)].kind = 13;
        }
      }
      // door
      if (this.inBounds(bx + 1, by + 3)) this.tiles[this.idx(bx + 1, by + 3)].kind = 13;
      // torch near door
      if (this.inBounds(bx - 1, by + 3)) this.tiles[this.idx(bx - 1, by + 3)].kind = 8;
    }
    // Grand dungeon staircase — north of the fountain, prominent
    const gsx = cx, gsy = cy - 5;
    if (this.inBounds(gsx, gsy)) this.tiles[this.idx(gsx, gsy)].kind = 16;
    // Frame the grand stair with steel pillars
    if (this.inBounds(gsx - 1, gsy)) this.tiles[this.idx(gsx - 1, gsy)].kind = 11;
    if (this.inBounds(gsx + 1, gsy)) this.tiles[this.idx(gsx + 1, gsy)].kind = 11;
    if (this.inBounds(gsx - 1, gsy - 1)) this.tiles[this.idx(gsx - 1, gsy - 1)].kind = 8;
    if (this.inBounds(gsx + 1, gsy - 1)) this.tiles[this.idx(gsx + 1, gsy - 1)].kind = 8;
    this.grandStair = { x: gsx * TILE + TILE / 2, y: gsy * TILE + TILE / 2 };
    // Spawn is now the plaza, just south of the fountain
    this.spawn = { x: cx * TILE + TILE / 2, y: (cy + 3) * TILE + TILE / 2 };
  }
}

// -------- Sub-floor generator (floors 2, 3, 4 per biome) --------
// Floor 2: cavern (cellular automata)
// Floor 3: sprawling dungeon of rooms and corridors
// Floor 4: huge biome-themed sanctum, reorganized but reminiscent of the surface
export class CaveFloor implements PlayMap {
  size: number;
  seed: number;
  floor: number; // 2, 3 or 4
  tiles: WorldTile[];
  stairs: Stair[] = [];
  spawn: { x: number; y: number } = { x: 0, y: 0 };
  readonly isCave = true;
  readonly biomeId: number;

  constructor(biomeId: number, seed: number, floor = 2) {
    this.biomeId = biomeId;
    this.seed = seed;
    this.floor = floor;
    // Andares 3x maiores por lado (~9x área) para biomas subterrâneos amplos
    this.size = floor === 2 ? 192 : floor === 3 ? 288 : 336;
    this.tiles = new Array(this.size * this.size);
    if (floor === 2) this.generateCave();
    else if (floor === 3) this.generateDungeon();
    else this.generateDeepBiome();
  }
  idx(x: number, y: number) { return y * this.size + x; }
  inBounds(x: number, y: number) { return x >= 0 && y >= 0 && x < this.size && y < this.size; }
  get(x: number, y: number): WorldTile {
    if (!this.inBounds(x, y)) return { kind: 2, biome: this.biomeId };
    return this.tiles[this.idx(x, y)];
  }
  isBlocked(x: number, y: number) {
    const t = this.get(x, y).kind;
    return t === 2 || t === 1 || t === 4 || t === 9 || t === 11 || t === 14 || t === 15;
  }
  private rng(x: number, y: number) { return hash2(x, y, this.seed); }

  private placeStair(x: number, y: number, kind: "up" | "down") {
    this.tiles[this.idx(x, y)] = { kind: (kind === "up" ? 7 : 6) as TileKind, biome: this.biomeId };
    this.stairs.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, biome: this.biomeId, kind });
  }

  // -------- Floor 2: cellular-automata cavern --------
  private generateCave() {
    const s = this.size;
    let map: number[] = new Array(s * s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const border = x < 2 || y < 2 || x >= s - 2 || y >= s - 2;
        map[y * s + x] = border ? 1 : (this.rng(x, y) < 0.45 ? 1 : 0);
      }
    }
    for (let step = 0; step < 5; step++) {
      const next = new Array<number>(s * s);
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          let walls = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= s || ny >= s) { walls++; continue; }
            walls += map[ny * s + nx];
          }
          next[y * s + x] = walls >= 5 ? 1 : (walls <= 3 ? 0 : map[y * s + x]);
        }
      }
      map = next;
    }
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const w = map[y * s + x];
        this.tiles[this.idx(x, y)] = { kind: (w ? 2 : 0) as TileKind, biome: this.biomeId };
      }
    }
    const up = this.findOpen(Math.floor(s / 2), Math.floor(s / 2), map);
    if (!up) return;
    this.spawn = { x: up.x * TILE + TILE / 2, y: up.y * TILE + TILE / 2 };
    this.placeStair(up.x, up.y, "up");
    // stair-down: BFS a partir do spawn e escolhe o tile aberto mais distante
    // que seja REALMENTE alcançável (evita colocar em cavernas isoladas atrás de paredes).
    const distArr = new Int32Array(s * s);
    for (let i = 0; i < distArr.length; i++) distArr[i] = -1;
    const queue: number[] = [up.y * s + up.x];
    let qHead = 0;
    distArr[up.y * s + up.x] = 0;
    let best = up, bestD = 0;
    while (qHead < queue.length) {
      const cur = queue[qHead++];
      const cx = cur % s, cy = (cur - cx) / s;
      const d = distArr[cur];
      if (d > bestD) { bestD = d; best = { x: cx, y: cy }; }
      const neigh: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of neigh) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 1 || ny < 1 || nx >= s - 1 || ny >= s - 1) continue;
        const ni = ny * s + nx;
        if (distArr[ni] !== -1) continue;
        if (map[ni] !== 0) continue;
        distArr[ni] = d + 1;
        queue.push(ni);
      }
    }
    if (bestD > 0) {
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        if (this.inBounds(best.x + xx, best.y + yy)) {
          this.tiles[this.idx(best.x + xx, best.y + yy)] = { kind: 0 as TileKind, biome: this.biomeId };
        }
      }
      this.placeStair(best.x, best.y, "down");
    }
  }

  // -------- Floor 3: dungeon of rooms + corridors --------
  private generateDungeon() {
    const s = this.size;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        this.tiles[this.idx(x, y)] = { kind: 2 as TileKind, biome: this.biomeId };
      }
    }
    type Room = { x: number; y: number; w: number; h: number; cx: number; cy: number };
    const rooms: Room[] = [];
    // Escala com o tamanho da masmorra (antes: 80 salas para size 96)
    const roomTries = Math.floor(80 * (s / 96) * (s / 96));
    for (let i = 0; i < roomTries; i++) {
      const w = 6 + Math.floor(this.rng(i, 1) * 10);
      const h = 5 + Math.floor(this.rng(i, 2) * 9);
      const x = 2 + Math.floor(this.rng(i, 3) * (s - w - 4));
      const y = 2 + Math.floor(this.rng(i, 4) * (s - h - 4));
      const overlap = rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y);
      if (overlap) continue;
      rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }
    for (const r of rooms) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          this.tiles[this.idx(x, y)] = { kind: 0 as TileKind, biome: this.biomeId };
        }
      }
    }
    const carveCorridor = (a: Room, b: Room) => {
      const x0 = Math.min(a.cx, b.cx), x1 = Math.max(a.cx, b.cx);
      for (let x = x0; x <= x1; x++) {
        this.tiles[this.idx(x, a.cy)] = { kind: 0 as TileKind, biome: this.biomeId };
        if (a.cy + 1 < s) this.tiles[this.idx(x, a.cy + 1)] = { kind: 0 as TileKind, biome: this.biomeId };
      }
      const y0 = Math.min(a.cy, b.cy), y1 = Math.max(a.cy, b.cy);
      for (let y = y0; y <= y1; y++) {
        this.tiles[this.idx(b.cx, y)] = { kind: 0 as TileKind, biome: this.biomeId };
        if (b.cx + 1 < s) this.tiles[this.idx(b.cx + 1, y)] = { kind: 0 as TileKind, biome: this.biomeId };
      }
    };
    for (let i = 1; i < rooms.length; i++) {
      carveCorridor(rooms[i - 1], rooms[i]);
      if (this.rng(i, 77) > 0.6 && i > 2) {
        const j = Math.floor(this.rng(i, 88) * (i - 1));
        carveCorridor(rooms[j], rooms[i]);
      }
    }
    for (const r of rooms) {
      if (r.w >= 9 && r.h >= 7) {
        const pxs = [r.x + 2, r.x + r.w - 3];
        const pys = [r.y + 2, r.y + r.h - 3];
        for (const px of pxs) for (const py of pys) {
          this.tiles[this.idx(px, py)] = { kind: 2 as TileKind, biome: this.biomeId };
        }
      }
    }
    if (rooms.length < 2) {
      const cx = Math.floor(s / 2), cy = Math.floor(s / 2);
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) {
        this.tiles[this.idx(x, y)] = { kind: 0 as TileKind, biome: this.biomeId };
      }
      this.spawn = { x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2 };
      this.placeStair(cx, cy, "up");
      this.placeStair(cx + 2, cy, "down");
      return;
    }
    let a = rooms[0], b = rooms[1], bestD = 0;
    for (const r1 of rooms) for (const r2 of rooms) {
      const d = (r1.cx - r2.cx) ** 2 + (r1.cy - r2.cy) ** 2;
      if (d > bestD) { bestD = d; a = r1; b = r2; }
    }
    this.spawn = { x: a.cx * TILE + TILE / 2, y: a.cy * TILE + TILE / 2 };
    this.placeStair(a.cx, a.cy, "up");
    this.placeStair(b.cx, b.cy, "down");
  }

  // -------- Floor 4: huge biome-themed sanctum, reorganized --------
  private generateDeepBiome() {
    const s = this.size;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const border = x < 2 || y < 2 || x >= s - 2 || y >= s - 2;
        this.tiles[this.idx(x, y)] = { kind: (border ? 2 : 0) as TileKind, biome: this.biomeId };
      }
    }
    const cx = s / 2, cy = s / 2;
    const b = BIOMES.find(bb => bb.id === this.biomeId);
    const usesTree = !!b && [2, 8, 9, 20, 25, 39, 15, 36].includes(b.id);
    const usesWater = !!b && [5, 11, 12, 21, 34].includes(b.id);
    const usesSand = !!b && [3, 23, 19, 31].includes(b.id);
    const obstacle: TileKind = usesTree ? 4 : usesWater ? 1 : 2;
    const soft: TileKind | null = usesSand ? 3 : null;

    for (let y = 2; y < s - 2; y++) {
      for (let x = 2; x < s - 2; x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const ring = fbm(x / 10, y / 10, this.seed + 7, 4);
        const inBand =
          (d > s * 0.15 && d < s * 0.20) ||
          (d > s * 0.28 && d < s * 0.33) ||
          (d > s * 0.40 && d < s * 0.45);
        if (inBand && ring > 0.35) {
          this.tiles[this.idx(x, y)] = { kind: obstacle, biome: this.biomeId };
        } else if (soft && ring > 0.66) {
          this.tiles[this.idx(x, y)] = { kind: soft, biome: this.biomeId };
        } else if (!inBand && ring > 0.78) {
          this.tiles[this.idx(x, y)] = { kind: obstacle, biome: this.biomeId };
        }
      }
    }
    const sanctum = 6;
    for (let y = -sanctum; y <= sanctum; y++) for (let x = -sanctum; x <= sanctum; x++) {
      const xx = Math.floor(cx + x), yy = Math.floor(cy + y);
      if (this.inBounds(xx, yy)) this.tiles[this.idx(xx, yy)] = { kind: 0 as TileKind, biome: this.biomeId };
    }
    const carveRay = (ax: number, ay: number) => {
      const len = s / 2 - 3;
      for (let i = 0; i < len; i++) {
        for (let w = -1; w <= 1; w++) {
          const x = Math.floor(cx + ax * i + (ax === 0 ? w : 0));
          const y = Math.floor(cy + ay * i + (ay === 0 ? w : 0));
          if (this.inBounds(x, y)) this.tiles[this.idx(x, y)] = { kind: 0 as TileKind, biome: this.biomeId };
        }
      }
    };
    carveRay(1, 0); carveRay(-1, 0); carveRay(0, 1); carveRay(0, -1);
    const scx = Math.floor(cx), scy = Math.floor(cy);
    this.spawn = { x: scx * TILE + TILE / 2, y: scy * TILE + TILE / 2 };
    this.placeStair(scx, scy, "up");
  }

  private findOpen(cx: number, cy: number, map: number[]): { x: number; y: number } | null {
    const s = this.size;
    for (let r = 0; r < s; r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 1 || y < 1 || x >= s - 1 || y >= s - 1) continue;
        if (map[y * s + x] === 0) return { x, y };
      }
    }
    return null;
  }
}

// -------- Entities --------
export type Vec = { x: number; y: number };

export type Enemy = {
  id: number;
  pos: Vec; vel: Vec;
  hp: number; maxHp: number;
  atk: number; def: number;
  speed: number;
  level: number;
  name: string;
  biome: number;
  radius: number;
  color: string;
  isBoss: boolean;
  attackCd: number;
  hitFlash: number;
};

export type FloatingText = { x: number; y: number; text: string; color: string; life: number; vy: number };
export type Loot = { pos: Vec; item: Item; life: number };
export type Projectile = { pos: Vec; vel: Vec; life: number; damage: number; from: "player" | "enemy" };

export type Skill = {
  id: string; name: string; cost: number; cd: number; cur: number; desc: string; key: string;
};

export type PlayerClass = "melee" | "magic" | "paladin" | "necro" | "archer";
export const CLASS_INFO: Record<PlayerClass, { name: string; sprite: string; desc: string; base: { str: number; agi: number; int: number; vit: number; hp: number; mp: number } }> = {
  melee:   { name: "Guerreiro",   sprite: "guerreiro",  desc: "Combate corpo-a-corpo. Alto STR/VIT.",       base: { str: 9, agi: 6, int: 3, vit: 8, hp: 130, mp: 30 } },
  magic:   { name: "Mago",        sprite: "mago",       desc: "Magias arcanas. Alto INT.",                  base: { str: 3, agi: 5, int: 10, vit: 4, hp: 80,  mp: 90 } },
  paladin: { name: "Paladino",    sprite: "paladino",   desc: "Guerreiro sagrado. Equilibrado.",            base: { str: 7, agi: 4, int: 6, vit: 7, hp: 110, mp: 60 } },
  necro:   { name: "Necromante",  sprite: "necromante", desc: "Invoca aliados e drena vida. Alto INT.",     base: { str: 3, agi: 4, int: 11, vit: 5, hp: 90, mp: 100 } },
  archer:  { name: "Arqueiro",    sprite: "arqueiro",   desc: "Flechas rápidas de longo alcance. Alto AGI.", base: { str: 5, agi: 11, int: 4, vit: 5, hp: 95, mp: 45 } },
};

// Profession catalogue (mirrors src/game/crafting.ts)
export type Profession = "ferreiro" | "alquimista" | "joalheiro" | "engenheiro" | "encantador" | "carpinteiro" | "cozinheiro" | "tecelao";
export const PROFESSION_LIST: Profession[] = ["ferreiro","alquimista","joalheiro","engenheiro","encantador","carpinteiro","cozinheiro","tecelao"];
export const PROFESSION_NAME: Record<Profession, string> = {
  ferreiro: "Ferreiro", alquimista: "Alquimista", joalheiro: "Joalheiro", engenheiro: "Engenheiro",
  encantador: "Encantador", carpinteiro: "Carpinteiro", cozinheiro: "Cozinheiro", tecelao: "Tecelão",
};

export type Minion = { pos: Vec; vel: Vec; target: number | null; hp: number; maxHp: number; life: number; kind: "skeleton"; attackCd: number; };

export class Player {
  cls: PlayerClass = "melee";
  pos: Vec = { x: 0, y: 0 };
  vel: Vec = { x: 0, y: 0 };
  speed = 3.2;
  hp = 100; maxHp = 100;
  mp = 50; maxMp = 50;
  level = 1;
  xp = 0;
  xpNext = 1000;
  attr = { str: 5, agi: 5, int: 5, vit: 5 };
  attrPoints = 0;
  gold = 0;
  facing: Vec = { x: 1, y: 0 };
  attackCd = 0;
  invuln = 0;
  hitFlash = 0;
  inventory: Item[] = [];
  equipped: { weapon?: Item; armor?: Item; pickaxe?: Item } = {};
  // Mining progression
  miningLevel = 1;
  miningXp = 0;
  miningXpNext = 40;
  // Crafting progression
  professions: Record<Profession, { level: number; xp: number; xpNext: number }> = {
    ferreiro:   { level: 1, xp: 0, xpNext: 60 },
    alquimista: { level: 1, xp: 0, xpNext: 60 },
    joalheiro:  { level: 1, xp: 0, xpNext: 60 },
    engenheiro: { level: 1, xp: 0, xpNext: 60 },
    encantador: { level: 1, xp: 0, xpNext: 60 },
    carpinteiro:{ level: 1, xp: 0, xpNext: 60 },
    cozinheiro: { level: 1, xp: 0, xpNext: 60 },
    tecelao:    { level: 1, xp: 0, xpNext: 60 },
  };
  // Materials store: oreId/materialId -> count (kept out of the 32-slot bag)
  materials: Record<string, number> = {};
  // Discovered recipe ids
  recipesKnown: Set<string> = new Set();
  // Active companions (necromancer skeletons, etc.)
  minions: Minion[] = [];
  skills: Skill[] = [
    { id: "slash", name: "Golpe Giratório", cost: 8, cd: 0, cur: 0, desc: "Dano em área ao redor", key: "1" },
    { id: "bolt", name: "Raio Arcano", cost: 12, cd: 0, cur: 0, desc: "Projétil rápido", key: "2" },
    { id: "heal", name: "Cura Menor", cost: 15, cd: 0, cur: 0, desc: "Restaura HP", key: "3" },
    { id: "dash", name: "Investida", cost: 5, cd: 0, cur: 0, desc: "Impulso na direção", key: "4" },
  ];
  atk() {
    const wpn = this.equipped.weapon?.power ?? 0;
    return Math.floor(this.attr.str * 2 + wpn + this.level);
  }
  def() {
    const arm = this.equipped.armor?.power ?? 0;
    return Math.floor(this.attr.vit * 1.5 + arm);
  }
  gainXp(amount: number, log: (m: string, c?: string) => void) {
    this.xp += amount;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.attrPoints += 5;
      this.xpNext = Math.floor(this.xpNext * 1.35 + 400);
      this.maxHp += 15; this.hp = this.maxHp;
      this.maxMp += 5; this.mp = this.maxMp;
      log(`Subiu para o nível ${this.level}! +5 pontos de atributo.`, "#f0b040");
    }
  }
  gainMiningXp(amount: number, log: (m: string, c?: string) => void) {
    this.miningXp += amount;
    while (this.miningXp >= this.miningXpNext && this.miningLevel < 999) {
      this.miningXp -= this.miningXpNext;
      this.miningLevel++;
      this.miningXpNext = Math.floor(this.miningXpNext * 1.12 + 12);
      log(`Mineração subiu para nível ${this.miningLevel}!`, "#8fcfff");
    }
  }
  gainProfessionXp(prof: Profession, amount: number, log: (m: string, c?: string) => void) {
    const p = this.professions[prof];
    p.xp += amount;
    while (p.xp >= p.xpNext && p.level < 999) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.floor(p.xpNext * 1.15 + 20);
      log(`${PROFESSION_NAME[prof]} subiu para nível ${p.level}!`, "#f0b040");
    }
  }
}

// Extended item metadata for the crafting/enchant/gem system.
// Kept optional so legacy items keep working.
export type Enchant = "fogo" | "gelo" | "veneno" | "luz" | "sombra" | "raio" | "sangramento" | "vampirismo" | "critico" | "velocidade" | "mana" | "hp";
export const ENCHANT_COLOR: Record<Enchant, string> = {
  fogo: "#ff7040", gelo: "#7fd8ff", veneno: "#80e060", luz: "#fff0a0", sombra: "#a060ff", raio: "#ffe040",
  sangramento: "#ff4060", vampirismo: "#c04070", critico: "#ff9040", velocidade: "#80ffe0", mana: "#6080ff", hp: "#60ff80",
};
export type ItemQuality = "comum" | "bom" | "excelente" | "perfeito" | "obra-prima" | "lendario" | "divino";
export const QUALITY_MULT: Record<ItemQuality, number> = { "comum": 1, "bom": 1.15, "excelente": 1.35, "perfeito": 1.6, "obra-prima": 1.95, "lendario": 2.5, "divino": 3.2 };
export const QUALITY_COLOR: Record<ItemQuality, string> = { "comum":"#c8c8c8","bom":"#5ecf5e","excelente":"#5ea8ff","perfeito":"#c25ef0","obra-prima":"#ff8060","lendario":"#f0b040","divino":"#fff080" };
export type ExtItem = Item & {
  quality?: ItemQuality;
  enchant?: Enchant;
  gems?: string[];        // gem ids socketed
  slots?: number;         // gem slots
  evolution?: number;     // +0..+6 (Suprema/Mítica/Lendária/Divina)
  isPickaxe?: boolean;
  pickaxeTier?: number;   // 1..10
  isCraftable?: boolean;
};

