import type {
  Biome,
  CaveTheme,
  Enchant,
  Item,
  ItemQuality,
  PlayerClass,
  Profession,
  Rarity,
} from "./types";

function ct(
  label: string,
  floor: string,
  wall: string,
  accent: string,
  monsters: string[],
  boss: string,
): CaveTheme {
  return { label, floor, wall, accent, monsters, boss };
}

export const BIOMES: Biome[] = [
  { id: 1,  name: "Planícies de Aurora",    color: "#6fb85f", accent: "#3d7a3a", danger: 1,  monsters: ["Lobo Cinzento", "Bandido", "Javali"],              boss: "Alfa da Alvorada",    caveTheme: ct("Toca da Alvorada", "#3a3a2a", "#1a1a12", "#8fae60", ["Lobo Sombrio", "Rato Grande", "Salteador Oculto"], "Matriarca dos Lobos") },
  { id: 2,  name: "Floresta Esmeralda",     color: "#2f6a3a", accent: "#1e4a26", danger: 3,  monsters: ["Aranha Gigante", "Treant Jovem", "Elfo Sombrio"],  boss: "Guardião Esmeralda",    caveTheme: ct("Ninho da Floresta", "#1a2a1a", "#0a180a", "#4faf60", ["Aranha das Raízes", "Broto Corrompido", "Traça Verde"], "Aranha-Mãe Esmeralda") },
  { id: 3,  name: "Deserto Escarlate",      color: "#d09550", accent: "#8f5a2a", danger: 5,  monsters: ["Escorpião Real", "Múmia", "Salteador"],            boss: "Faraó Esquecido",    caveTheme: ct("Tumba do Faraó", "#3a2818", "#1a1008", "#c08a40", ["Múmia Antiga", "Escaravelho Ígneo", "Sacerdote Sepulto"], "Faraó Ressurgido") },
  { id: 4,  name: "Montanhas de Ferro",     color: "#8a8a92", accent: "#4a4a52", danger: 7,  monsters: ["Golem de Pedra", "Ogro", "Anão Renegado"],         boss: "Colosso de Ferro",    caveTheme: ct("Mina de Ferro", "#2a2a30", "#12121a", "#8090a0", ["Kobold Mineiro", "Golem Menor", "Aranha Metálica"], "Forjador Colossal") },
  { id: 5,  name: "Pântano Sombrio",        color: "#4a5a3a", accent: "#22331f", danger: 9,  monsters: ["Zumbi Afogado", "Bruxa", "Serpente Venenosa"],     boss: "Hidra do Pântano",    caveTheme: ct("Cripta do Lodo", "#1a2018", "#08100a", "#5a8040", ["Verme Podre", "Bruxa Menor", "Slime Tóxico"], "Hidra Enraizada") },
  { id: 6,  name: "Tundra Boreal",          color: "#c4d8dc", accent: "#7a9098", danger: 11, monsters: ["Urso Polar", "Lobo Gelado", "Espectro Ártico"],    boss: "Imperador do Gelo",    caveTheme: ct("Caverna Congelada", "#2a3a40", "#12181c", "#a8c8d8", ["Espectro Ártico", "Aranha do Gelo", "Draugr"], "Rei do Permafrost") },
  { id: 7,  name: "Cordilheira Glacial",    color: "#a8c8d8", accent: "#5a7080", danger: 13, monsters: ["Grifo Gelado", "Yeti", "Arqueiro Boreal"],         boss: "Dragão Boreal",    caveTheme: ct("Câmara do Dragão", "#20303a", "#0a1418", "#98b0c0", ["Filhote Draconiano", "Yeti Cavernícola", "Espírito Gelado"], "Dragão Ancestral") },
  { id: 8,  name: "Selva Tropical",         color: "#3d8a3a", accent: "#1f5020", danger: 6,  monsters: ["Onça", "Naga", "Caçador de Cabeças"],              boss: "Altar da Selva",    caveTheme: ct("Templo da Naga", "#1a2818", "#08140a", "#5aa060", ["Naga das Sombras", "Onça Espectral", "Ídolo Vivo"], "Sacerdotisa Naga") },
  { id: 9,  name: "Floresta Carmesim",      color: "#8a3a3a", accent: "#4a1010", danger: 14, monsters: ["Lobisomem", "Fada Rubra", "Cervo Sombrio"],        boss: "Guardião Rubi",    caveTheme: ct("Covil Sangrento", "#2a1010", "#100404", "#c04040", ["Lobisomem Menor", "Vampiro Jovem", "Fada Corrompida"], "Alfa Escarlate") },
  { id: 10, name: "Vulcões de Obsidiana",   color: "#5a2020", accent: "#2a0a0a", danger: 18, monsters: ["Elemental de Lava", "Demônio Menor", "Salamandra"], boss: "Titã de Obsidiana",    caveTheme: ct("Forja Vulcânica", "#2a0808", "#100404", "#e05020", ["Diabrete", "Elemental Ígneo", "Salamandra Fundida"], "Senhor do Magma") },
  { id: 11, name: "Costa Tempestuosa",      color: "#8ab0c8", accent: "#3a5060", danger: 4,  monsters: ["Corsário", "Kraken Jovem", "Homem-Peixe"],         boss: "Almirante Fantasma",    caveTheme: ct("Gruta Marinha", "#1a2830", "#080f14", "#60a0c0", ["Homem-Peixe", "Marujo Afogado", "Polvo Menor"], "Capitão Naufragado") },
  { id: 12, name: "Arquipélago das Marés",  color: "#5aa8c8", accent: "#204a60", danger: 8,  monsters: ["Pirata", "Sereia Sombria", "Tubarão Colossal"],    boss: "Leviatã das Marés",    caveTheme: ct("Fossa das Marés", "#0a1a24", "#040a10", "#4090b0", ["Sereia Sombria", "Anguíla Elétrica", "Casco Amaldiçoado"], "Leviatã Menor") },
  { id: 13, name: "Cavernas de Cristal",    color: "#a89ad8", accent: "#4a3a80", danger: 10, monsters: ["Golem de Cristal", "Aranha de Ametista", "Minerador Louco"], boss: "Rainha de Cristal",    caveTheme: ct("Geoda Profunda", "#2a2040", "#100818", "#a880ff", ["Cristal Andante", "Larva de Ametista", "Ecoador"], "Coração de Cristal") },
  { id: 14, name: "Penhascos Celestiais",   color: "#c8d8e8", accent: "#6a7a90", danger: 16, monsters: ["Águia Real", "Servo Angelical", "Gárgula"],        boss: "Serafim Caído",    caveTheme: ct("Santuário Suspenso", "#2a303a", "#101418", "#c8d0e0", ["Gárgula Menor", "Coro Distorcido", "Anjo Menor"], "Herald Caído") },
  { id: 15, name: "Vale dos Ventos",        color: "#a8c890", accent: "#5a7040", danger: 5,  monsters: ["Elemental de Ar", "Wyvern Jovem", "Ladrão do Vento"], boss: "Roc Ancião",    caveTheme: ct("Câmara Sussurrante", "#20281c", "#0c100a", "#a0c088", ["Espírito Sibilante", "Morcego Cortante", "Assobio Vivo"], "Vórtice Ancião") },
  { id: 16, name: "Campos Dourados",        color: "#e0c060", accent: "#907028", danger: 2,  monsters: ["Espantalho Vivo", "Rato Gigante", "Camponês Amaldiçoado"], boss: "Ceifador Dourado",    caveTheme: ct("Adega Amaldiçoada", "#302818", "#100c08", "#d8b040", ["Rato Amaldiçoado", "Espantalho Menor", "Camponês Podre"], "Ceifador Menor") },
  { id: 17, name: "Ruínas Imperiais",       color: "#a89078", accent: "#5a4830", danger: 12, monsters: ["Cavaleiro Fantasma", "Estátua Viva", "Legionário"], boss: "Imperador Espectral",    caveTheme: ct("Catacumbas Imperiais", "#28201a", "#100c08", "#c0a080", ["Legionário Espectral", "Escravo Amaldiçoado", "Estátua Menor"], "Senador Cadavérico") },
  { id: 18, name: "Reino Subterrâneo",      color: "#605068", accent: "#2a2030", danger: 15, monsters: ["Anão Ancião", "Trol das Cavernas", "Dweller"],     boss: "Rei das Profundezas",    caveTheme: ct("Profundezas do Trono", "#181420", "#080610", "#807090", ["Verme das Rochas", "Trol Menor", "Dweller Cego"], "Trono Fundo") },
  { id: 19, name: "Mar de Cinzas",          color: "#706860", accent: "#302a24", danger: 17, monsters: ["Fenix Menor", "Cão Ígneo", "Espírito de Fumaça"], boss: "Fênix Ancestral",    caveTheme: ct("Cratera Fumegante", "#201814", "#0c0806", "#c0806a", ["Cão de Cinzas", "Salamandra Menor", "Espectro Fumaça"], "Fênix Menor") },
  { id: 20, name: "Bosque Luminescente",    color: "#5a4a90", accent: "#2a1f4a", danger: 12, monsters: ["Fada Corrompida", "Cogumelo Andante", "Vagalume Gigante"], boss: "Rainha Bioluminescente",    caveTheme: ct("Micélio Profundo", "#141028", "#080418", "#a880f0", ["Cogumelo Explosivo", "Vagalume Sombrio", "Micomorfe"], "Rainha do Micélio") },
  { id: 21, name: "Ilha das Tempestades",   color: "#4a5a80", accent: "#1a2440", danger: 19, monsters: ["Elemental de Raio", "Marinheiro Amaldiçoado", "Harpia"], boss: "Senhor das Tempestades",    caveTheme: ct("Câmara do Trovão", "#101828", "#060a14", "#80a0f0", ["Elemental Voltaico", "Harpia Menor", "Marujo Voltaico"], "Coração da Tempestade") },
  { id: 22, name: "Fortaleza Abandonada",   color: "#585868", accent: "#282838", danger: 20, monsters: ["Cavaleiro Caído", "Necromante", "Lich Aprendiz"],  boss: "Rei Caído",    caveTheme: ct("Masmorra do Rei", "#181820", "#080810", "#a0a0c0", ["Cavaleiro Esqueleto", "Aprendiz Lich", "Servo Necro"], "Príncipe Amaldiçoado") },
  { id: 23, name: "Cânion Rubro",           color: "#c0603a", accent: "#7a3018", danger: 11, monsters: ["Basilisco", "Bandoleiro", "Escorpião Vermelho"],   boss: "Wyrm do Cânion",    caveTheme: ct("Fenda do Wyrm", "#301810", "#100806", "#d0603a", ["Basilisco Jovem", "Escorpião Menor", "Bandoleiro Oculto"], "Wyrm Menor") },
  { id: 24, name: "Picos Celestes",         color: "#d0dae8", accent: "#7080a0", danger: 21, monsters: ["Dragão Alado", "Monge Ancião", "Roc"],             boss: "Deus dos Ventos",    caveTheme: ct("Câmara do Ventos", "#20282e", "#0c1014", "#c0d0e8", ["Monge Espectral", "Wyvern Jovem", "Roc Jovem"], "Ancião dos Ventos") },
  { id: 25, name: "Jardim Ancestral",       color: "#80c080", accent: "#3a6a3a", danger: 14, monsters: ["Ninfa", "Espinho Vivo", "Guardião Floral"],        boss: "Espírito Ancestral",    caveTheme: ct("Raízes Ancestrais", "#182818", "#080c08", "#80d080", ["Raiz Faminta", "Ninfa Menor", "Broto Espinhado"], "Coração Ancião") },
  { id: 26, name: "Cidade Perdida",         color: "#98908a", accent: "#4a4038", danger: 16, monsters: ["Cidadão Amaldiçoado", "Cão de Guerra", "Ladrão Fantasma"], boss: "Prefeito Corrompido",    caveTheme: ct("Esgotos Perdidos", "#20201c", "#0c0c08", "#a89880", ["Rato Amaldiçoado", "Ladrão Espectral", "Cidadão Podre"], "Contramestre Espectral") },
  { id: 27, name: "Abismo Infinito",        color: "#2a2038", accent: "#100818", danger: 24, monsters: ["Aberrante", "Tentáculo", "Devorador"],             boss: "Coisa do Abismo",    caveTheme: ct("Fenda Impossível", "#100818", "#040208", "#6040a0", ["Tentáculo Menor", "Olho Flutuante", "Voraz Cego"], "Devorador Menor") },
  { id: 28, name: "Reino das Sombras",      color: "#1a1a2a", accent: "#080810", danger: 26, monsters: ["Sombra", "Assassino Sombrio", "Umbra"],             boss: "Rei das Sombras",    caveTheme: ct("Vazio Sombrio", "#080810", "#020208", "#4a4a6a", ["Sombra Vazia", "Assassino Umbra", "Eco Sombrio"], "Príncipe Sombrio") },
  { id: 29, name: "Plano Astral",           color: "#5a3a90", accent: "#2a1a4a", danger: 28, monsters: ["Vigia Astral", "Estrela Caída", "Fragmento Cósmico"], boss: "Sentinela Cósmico",    caveTheme: ct("Nexo Astral", "#181028", "#080418", "#a080ff", ["Fragmento Menor", "Vigia Menor", "Eco Astral"], "Sentinela Menor") },
  { id: 30, name: "Trono dos Criadores",    color: "#e0c078", accent: "#a08040", danger: 30, monsters: ["Anjo do Alvorecer", "Herald Divino", "Serafim"],   boss: "O Criador",    caveTheme: ct("Câmara Divina", "#302818", "#100c08", "#f0d090", ["Herald Menor", "Serafim Menor", "Coro Divino"], "Arauto do Criador") },
  { id: 31, name: "Deserto de Sal",         color: "#e8e0c8", accent: "#a89870", danger: 6,  monsters: ["Cristalino Salino", "Nômade Cego", "Escorpião Branco"], boss: "Rainha do Sal",    caveTheme: ct("Caverna Salina", "#302818", "#100c08", "#e8dcb0", ["Cristal Salino", "Verme das Salinas", "Espectro do Sal"], "Coração Salino") },
  { id: 32, name: "Terras Radioativas",     color: "#8ac040", accent: "#4a6018", danger: 22, monsters: ["Mutante", "Ghoul Verde", "Cão Deformado"],         boss: "Aberração Prima",    caveTheme: ct("Bunker Radioativo", "#18201a", "#080c08", "#a0ff40", ["Ghoul Menor", "Rato Mutante", "Servo Radioativo"], "Núcleo Vivo") },
  { id: 33, name: "Cemitério Fúnebre",      color: "#5a5060", accent: "#2a2030", danger: 13, monsters: ["Esqueleto Guerreiro", "Cão Necrótico", "Necrofago"], boss: "Coveiro Eterno",    caveTheme: ct("Cripta Ossuária", "#181420", "#080610", "#c0b0d0", ["Esqueleto Menor", "Ghoul Sepulto", "Espectro Cadavérico"], "Lich Ancião") },
  { id: 34, name: "Ilhas Flutuantes",       color: "#8ac0e0", accent: "#3a6080", danger: 15, monsters: ["Wyvern Menor", "Servo do Vento", "Piloto Aéreo"],  boss: "Skywhale Ancião",    caveTheme: ct("Câmara Suspensa", "#182028", "#080c10", "#a0d0f0", ["Servo do Vento", "Espírito Nublado", "Djinn Menor"], "Djinn Ancião") },
  { id: 35, name: "Grutas de Mercúrio",     color: "#b0b8c0", accent: "#5a6068", danger: 19, monsters: ["Elemental Líquido", "Espelho Vivo", "Alquimista Amaldiçoado"], boss: "Prisma do Mercúrio",    caveTheme: ct("Lago de Mercúrio", "#181820", "#080810", "#d0d8e0", ["Poça Líquida", "Espelho Menor", "Reflexo Sombrio"], "Titã do Mercúrio") },
  { id: 36, name: "Planalto Fúngico",       color: "#a880c0", accent: "#4a2a60", danger: 10, monsters: ["Mycon", "Esporo Andante", "Guardião do Fungo"],    boss: "Colônia-Mãe",    caveTheme: ct("Micélio das Sombras", "#181020", "#080418", "#c090e0", ["Esporo Explosivo", "Mycon Menor", "Sombra Fúngica"], "Rainha Fúngica") },
  { id: 37, name: "Ruínas Cristalinas",     color: "#c0e0e8", accent: "#5080a0", danger: 17, monsters: ["Estátua de Prisma", "Guardião Ancião", "Vidro Vivo"], boss: "Arquiteto de Vidro",    caveTheme: ct("Sanctum de Vidro", "#182028", "#080c10", "#c0e8f0", ["Fragmento Andante", "Guardião Menor", "Prisma Sombrio"], "Sanctum Ancião") },
  { id: 38, name: "Vastidão Voraz",         color: "#603838", accent: "#301818", danger: 23, monsters: ["Devorador Menor", "Boca Andante", "Tentáculo Faminto"], boss: "Fauces do Mundo",    caveTheme: ct("Estômago do Mundo", "#201010", "#0c0606", "#a04040", ["Órgão Vivo", "Verme Digestivo", "Ácido Andante"], "Fauces Menores") },
  { id: 39, name: "Bosque Espectral",       color: "#3a5a5a", accent: "#182828", danger: 20, monsters: ["Assombração", "Cervo Espectral", "Wisp Sombrio"],  boss: "Senhora dos Espectros",    caveTheme: ct("Cripta Espectral", "#141c1c", "#080e0e", "#80c0c0", ["Wisp Menor", "Aparição", "Servo Espectral"], "Espectro Ancestral") },
  { id: 40, name: "Núcleo do Mundo",        color: "#c04010", accent: "#601808", danger: 30, monsters: ["Elemental Primal", "Coração de Magma", "Titã Menor"], boss: "Coração do Mundo",    caveTheme: ct("Câmara do Núcleo", "#200806", "#100404", "#ff6020", ["Chama Primal", "Servo do Núcleo", "Elemental Fundido"], "Núcleo Ancião") },
];

export const CITY_NAMES: Record<number, string> = {
  1: "Asterion",
  2: "Elvengarde",
  3: "Solmara",
  4: "Ferrondh",
  5: "Murkholme",
  6: "Nivalis",
  7: "Skyreach",
  8: "Verdanor",
  9: "Sanguemera",
  10: "Emberforge",
  11: "Portstorm",
  12: "Marésia",
  13: "Cristallum",
  14: "Aetheris",
  15: "Ventaria",
  16: "Trigal",
  17: "Imperia",
  18: "Undralar",
  19: "Cinderfall",
  20: "Lumenglade",
  21: "Fulminis",
  22: "Vanheim",
  23: "Cânios",
  24: "Kaelstone",
  25: "Verdanthal",
  26: "Perdisia",
  27: "Voidhaven",
  28: "Umbralis",
  29: "Astraeon",
  30: "Zenithar",
  31: "Saltmere",
  32: "Radgrad",
  33: "Ossuária",
  34: "Aeronis",
  35: "Mercúria",
  36: "Fungara",
  37: "Prismath",
  38: "Voracis",
  39: "Espectra",
  40: "Ignis-Core",
};

export const CLASS_INFO: Record<
  PlayerClass,
  {
    name: string;
    role: string;
    sprite: string;
    desc: string;
    accent: string;
    base: { str: number; agi: number; int: number; vit: number; hp: number; mp: number };
  }
> = {
  melee:   { name: "Guerreiro",   role: "Vanguarda Pesada",  sprite: "guerreiro",  desc: "Corte amplo, guarda de ferro e impacto brutal.", accent: "#e85040", base: { str: 9, agi: 6, int: 3, vit: 8, hp: 130, mp: 30 } },
  magic:   { name: "Mago",        role: "Arcanista Ígneo",   sprite: "mago",       desc: "Raios arcanos, bolas de fogo e teleporte.",      accent: "#5aa8ff", base: { str: 3, agi: 5, int: 10, vit: 4, hp: 80,  mp: 90 } },
  paladin: { name: "Paladino",    role: "Templário Sagrado", sprite: "paladino",   desc: "Golpes consagrados que curam e protegem.",       accent: "#f4c85b", base: { str: 7, agi: 4, int: 6, vit: 7, hp: 110, mp: 60 } },
  necro:   { name: "Necromante",  role: "Senhor das Almas",  sprite: "necromante", desc: "Drena energia vital e invoca esqueletos.",       accent: "#b56eff", base: { str: 3, agi: 4, int: 11, vit: 5, hp: 90, mp: 100 } },
  archer:  { name: "Arqueiro",    role: "Patrulheiro Ágil",  sprite: "arqueiro",   desc: "Disparos rápidos, recuo e chuva de flechas.",    accent: "#5ed86a", base: { str: 5, agi: 11, int: 4, vit: 5, hp: 95, mp: 45 } },
};

export const PROFESSION_LIST: Profession[] = [
  "ferreiro", "alquimista", "joalheiro", "engenheiro",
  "encantador", "carpinteiro", "cozinheiro", "tecelao",
];

export const PROFESSION_NAME: Record<Profession, string> = {
  ferreiro: "Ferreiro",
  alquimista: "Alquimista",
  joalheiro: "Joalheiro",
  engenheiro: "Engenheiro",
  encantador: "Encantador",
  carpinteiro: "Carpinteiro",
  cozinheiro: "Cozinheiro",
  tecelao: "Tecelão",
};

export const RARITY_COLOR: Record<Rarity, string> = {
  comum: "#c8c8c8",
  incomum: "#5ecf5e",
  raro: "#5ea8ff",
  épico: "#c25ef0",
  lendário: "#f0b040",
};

export const RARITY_MULT: Record<Rarity, number> = {
  comum: 1,
  incomum: 1.4,
  raro: 1.9,
  épico: 2.6,
  lendário: 3.6,
};

export const ENCHANT_COLOR: Record<Enchant, string> = {
  fogo: "#ff7040",
  gelo: "#7fd8ff",
  veneno: "#80e060",
  luz: "#fff0a0",
  sombra: "#a060ff",
  raio: "#ffe040",
  sangramento: "#ff4060",
  vampirismo: "#c04070",
  critico: "#ff9040",
  velocidade: "#80ffe0",
  mana: "#6080ff",
  hp: "#60ff80",
};

export const QUALITY_MULT: Record<ItemQuality, number> = {
  comum: 1,
  bom: 1.15,
  excelente: 1.35,
  perfeito: 1.6,
  "obra-prima": 1.95,
  lendario: 2.5,
  divino: 3.2,
};

export const QUALITY_COLOR: Record<ItemQuality, string> = {
  comum: "#c8c8c8",
  bom: "#5ecf5e",
  excelente: "#5ea8ff",
  perfeito: "#c25ef0",
  "obra-prima": "#ff8060",
  lendario: "#f0b040",
  divino: "#fff080",
};

export function rollRarity(luck = 0, rng = Math.random): Rarity {
  const r = rng() * 100 - luck * 0.25;
  if (r < 2) return "lendário";
  if (r < 8) return "épico";
  if (r < 22) return "raro";
  if (r < 50) return "incomum";
  return "comum";
}

let itemSeq = 0;
export function makeItem(kind: Item["kind"], tier: number, rarity: Rarity, rng = Math.random): Item {
  itemSeq++;
  const baseNames = {
    weapon: ["Espada", "Machado", "Lança", "Adaga", "Cajado", "Arco", "Martelo", "Foice"],
    armor: ["Elmo", "Peitoral", "Grevas", "Manto", "Escudo", "Botas", "Braçadeiras"],
    potion: ["Poção Menor", "Poção", "Poção Maior", "Elixir", "Néctar"],
    material: ["Minério", "Erva", "Couro", "Osso", "Cristal", "Essência", "Escama"],
  };
  const suffix = [
    "de Ferro", "do Vento", "das Sombras", "da Aurora", "do Trovão",
    "do Vazio", "Rúnico", "Ancestral", "do Dragão", "Estelar",
  ];
  const n = baseNames[kind][Math.floor(rng() * baseNames[kind].length)];
  const s = kind === "material" ? "" : " " + suffix[Math.min(suffix.length - 1, Math.max(0, tier - 1 + Math.floor(rng() * 3)))];
  const power = Math.round((5 + tier * 4) * RARITY_MULT[rarity] * (kind === "potion" ? 3 : 1));
  const glyph = kind === "weapon" ? "⚔" : kind === "armor" ? "🛡" : kind === "potion" ? "🧪" : "◈";
  const slots = (kind === "weapon" || kind === "armor") && (rarity === "raro" || rarity === "épico" || rarity === "lendário")
    ? (rarity === "lendário" ? 3 : rarity === "épico" ? 2 : 1)
    : 0;
  return {
    id: `it_${itemSeq}`,
    name: `${n}${s}`,
    kind,
    rarity,
    power,
    icon: glyph,
    color: RARITY_COLOR[rarity],
    slots,
    gems: [],
    evolution: 0,
  };
}
