import { sfx } from "./audio";
import { PROFESSION_NAME, QUALITY_MULT, RARITY_COLOR } from "./biomes";
import { ORES } from "./mining";
import type {
  Enchant,
  GameState,
  Item,
  ItemQuality,
  OreKind,
  Profession,
} from "./types";

export type BenchType =
  | "bigorna" | "mesa_alquimia" | "mesa_joalheria" | "mesa_engenharia"
  | "altar_encantamento" | "bancada_carpintaria" | "fogao" | "tear";

export const PROFESSION_BENCH: Record<Profession, BenchType> = {
  ferreiro: "bigorna",
  alquimista: "mesa_alquimia",
  joalheiro: "mesa_joalheria",
  engenheiro: "mesa_engenharia",
  encantador: "altar_encantamento",
  carpinteiro: "bancada_carpintaria",
  cozinheiro: "fogao",
  tecelao: "tear",
};

export const BENCH_NAME: Record<BenchType, string> = {
  bigorna: "Bigorna de Dragonstone",
  mesa_alquimia: "Mesa de Alquimia",
  mesa_joalheria: "Bancada de Joalheria",
  mesa_engenharia: "Oficina de Engenharia",
  altar_encantamento: "Altar Rúnico",
  bancada_carpintaria: "Carpintaria Real",
  fogao: "Fornalha da Taverna",
  tear: "Tear Arcano",
};

export type Recipe = {
  id: string;
  name: string;
  profession: Profession;
  minLevel: number;
  materials: Partial<Record<OreKind, number>>;
  produces: { kind: "weapon" | "armor" | "potion" | "material"; basePower: number; slots?: number };
  xp: number;
  secret?: boolean;
  hidden?: boolean;
};

export const RECIPES: Recipe[] = [
  // Ferreiro
  { id: "espada_cobre",       name: "Espada de Cobre",       profession: "ferreiro", minLevel: 1,   materials: { cobre: 3, pedra: 1 }, produces: { kind: "weapon", basePower: 18, slots: 1 }, xp: 24 },
  { id: "espada_ferro",       name: "Espada de Ferro",       profession: "ferreiro", minLevel: 3,   materials: { ferro_enferrujado: 3, madeira_antiga: 1 }, produces: { kind: "weapon", basePower: 28, slots: 1 }, xp: 35 },
  { id: "machado_cobre",      name: "Machado de Guerra",     profession: "ferreiro", minLevel: 5,   materials: { cobre: 4, madeira_antiga: 2 }, produces: { kind: "weapon", basePower: 32, slots: 1 }, xp: 40 },
  { id: "espada_mithril",     name: "Espada de Mithril",     profession: "ferreiro", minLevel: 50,  materials: { mithril: 5, safira: 1 }, produces: { kind: "weapon", basePower: 130, slots: 2 }, xp: 220 },
  { id: "lamina_adamantita",  name: "Lâmina de Adamantita",  profession: "ferreiro", minLevel: 120, materials: { adamantita: 4, rubi_flamejante: 2, titanio: 2 }, produces: { kind: "weapon", basePower: 280, slots: 3 }, xp: 640 },
  { id: "espada_eclipse",     name: "Espada do Eclipse",     profession: "ferreiro", minLevel: 200, materials: { cristal_sombrio: 3, rubi_flamejante: 2, adamantita: 3 }, produces: { kind: "weapon", basePower: 540, slots: 4 }, xp: 1400, secret: true, hidden: true },
  { id: "peito_ferro",        name: "Peitoral de Ferro",     profession: "ferreiro", minLevel: 5,   materials: { ferro_enferrujado: 5 }, produces: { kind: "armor", basePower: 24, slots: 1 }, xp: 35 },
  { id: "peito_mithril",      name: "Peitoral de Mithril",   profession: "ferreiro", minLevel: 60,  materials: { mithril: 6, prata: 2 }, produces: { kind: "armor", basePower: 118, slots: 2 }, xp: 210 },

  // Carpinteiro
  { id: "arco_longo",         name: "Arco Longo",            profession: "carpinteiro", minLevel: 1,  materials: { madeira_antiga: 4, resina: 2 }, produces: { kind: "weapon", basePower: 24, slots: 1 }, xp: 30 },
  { id: "cajado_carvalho",    name: "Cajado de Carvalho",    profession: "carpinteiro", minLevel: 4,  materials: { madeira_antiga: 3, cristal_verde: 1 }, produces: { kind: "weapon", basePower: 28, slots: 1 }, xp: 34 },
  { id: "arco_ebano",         name: "Arco de Ébano",         profession: "carpinteiro", minLevel: 60, materials: { ebano: 4, resina: 2, prata: 1 }, produces: { kind: "weapon", basePower: 136, slots: 2 }, xp: 220 },

  // Alquimista
  { id: "pocao_menor",        name: "Poção Menor de Cura",   profession: "alquimista", minLevel: 1,   materials: { resina: 2, pedra: 1 }, produces: { kind: "potion", basePower: 50 }, xp: 22 },
  { id: "pocao_media",        name: "Poção de Cura",         profession: "alquimista", minLevel: 20,  materials: { cristal_verde: 2, prata: 1 }, produces: { kind: "potion", basePower: 110 }, xp: 65 },
  { id: "pocao_maior",        name: "Poção Maior",           profession: "alquimista", minLevel: 60,  materials: { safira: 1, prata: 2, cristal_verde: 3 }, produces: { kind: "potion", basePower: 240 }, xp: 165 },
  { id: "elixir_divino",      name: "Elixir Divino",         profession: "alquimista", minLevel: 200, materials: { alma_corrompida: 2, safira: 2, rubi_flamejante: 2 }, produces: { kind: "potion", basePower: 650 }, xp: 900, secret: true, hidden: true },

  // Joalheiro
  { id: "gema_safira",        name: "Safira Lapidada",       profession: "joalheiro", minLevel: 30,  materials: { safira: 1, quartzo: 2 }, produces: { kind: "material", basePower: 18 }, xp: 50 },
  { id: "gema_rubi",          name: "Rubi Lapidado",         profession: "joalheiro", minLevel: 70,  materials: { rubi_flamejante: 1, ouro: 1 }, produces: { kind: "material", basePower: 34 }, xp: 120 },
  { id: "gema_diamante",      name: "Diamante Talhado",      profession: "joalheiro", minLevel: 130, materials: { diamante_azul: 1, safira: 1 }, produces: { kind: "material", basePower: 65 }, xp: 260 },

  // Engenheiro
  { id: "bomba_ferro",        name: "Bomba de Ferro",        profession: "engenheiro", minLevel: 10,  materials: { ferro_enferrujado: 2, resina: 2 }, produces: { kind: "weapon", basePower: 42 }, xp: 45 },
  { id: "torreta_titanio",    name: "Canhão de Titânio",     profession: "engenheiro", minLevel: 100, materials: { titanio: 5, mithril: 2, cristal_verde: 3 }, produces: { kind: "weapon", basePower: 265, slots: 2 }, xp: 500 },

  // Encantador
  { id: "runa_fogo",          name: "Runa de Fogo",          profession: "encantador", minLevel: 20, materials: { rubi_flamejante: 1, cristal_verde: 2 }, produces: { kind: "material", basePower: 16 }, xp: 60 },
  { id: "runa_gelo",          name: "Runa de Gelo",          profession: "encantador", minLevel: 25, materials: { cristal_congelado: 1, safira: 1 }, produces: { kind: "material", basePower: 16 }, xp: 70 },
  { id: "runa_sombra",        name: "Runa de Sombra",        profession: "encantador", minLevel: 80, materials: { cristal_sombrio: 2, onix: 1 }, produces: { kind: "material", basePower: 24 }, xp: 180 },

  // Cozinheiro
  { id: "banquete_forca",     name: "Banquete da Força",     profession: "cozinheiro", minLevel: 15,  materials: { madeira_antiga: 1, cristal_verde: 1, resina: 1 }, produces: { kind: "potion", basePower: 80 }, xp: 45 },
  { id: "banquete_divino",    name: "Banquete Divino",       profession: "cozinheiro", minLevel: 140, materials: { ouro: 2, safira: 1, rubi_flamejante: 1 }, produces: { kind: "potion", basePower: 340 }, xp: 400 },

  // Tecelao
  { id: "manto_iniciado",     name: "Manto do Iniciado",     profession: "tecelao", minLevel: 1,   materials: { resina: 2, madeira_antiga: 1 }, produces: { kind: "armor", basePower: 16, slots: 1 }, xp: 24 },
  { id: "manto_arcano",       name: "Manto Arcano",          profession: "tecelao", minLevel: 40,  materials: { safira: 1, cristal_verde: 3, prata: 1 }, produces: { kind: "armor", basePower: 85, slots: 2 }, xp: 130 },
  { id: "manto_abissal",      name: "Manto Abissal",         profession: "tecelao", minLevel: 180, materials: { minerio_abissal: 2, cristal_sombrio: 3, alma_corrompida: 1 }, produces: { kind: "armor", basePower: 330, slots: 3 }, xp: 900, secret: true, hidden: true },
];

const QUALITY_ORDER: ItemQuality[] = [
  "comum", "bom", "excelente", "perfeito", "obra-prima", "lendario", "divino",
];

export function rollQuality(profLevel: number, minLevel: number, rng = Math.random): ItemQuality {
  const gap = profLevel - minLevel;
  const skill = Math.min(1, Math.max(0, gap / 120));
  const base = skill * 3.4;
  const jitter = (rng() - 0.5) * 1.6;
  let idx = Math.round(base + jitter);
  idx = Math.max(0, Math.min(QUALITY_ORDER.length - 1, idx));
  return QUALITY_ORDER[idx];
}

export function craftSuccessChance(profLevel: number, minLevel: number): number {
  const gap = profLevel - minLevel;
  const base = 0.65 + gap * 0.02;
  return Math.max(0.25, Math.min(0.99, base));
}

let cSeq = 0;
function makeCraftedItem(rec: Recipe, quality: ItemQuality): Item {
  cSeq++;
  const mult = QUALITY_MULT[quality];
  const power = Math.max(1, Math.round(rec.produces.basePower * mult));
  const color =
    quality === "divino" ? "#fff080" :
    quality === "lendario" ? "#f0b040" :
    quality === "obra-prima" ? "#ff8060" :
    quality === "perfeito" ? "#c25ef0" :
    quality === "excelente" ? "#5ea8ff" :
    quality === "bom" ? "#5ecf5e" : "#c8c8c8";
  const rarity =
    quality === "divino" || quality === "lendario" ? "lendário" :
    quality === "obra-prima" ? "épico" :
    quality === "perfeito" || quality === "excelente" ? "raro" : "comum";
  return {
    id: `c_${cSeq}`,
    name: rec.name,
    kind: rec.produces.kind,
    rarity,
    power,
    icon:
      rec.produces.kind === "weapon" ? "⚔" :
      rec.produces.kind === "armor" ? "🛡" :
      rec.produces.kind === "potion" ? "🧪" : "◈",
    color,
    quality,
    slots: rec.produces.slots ?? 0,
    gems: [],
    evolution: 0,
  };
}

export function canCraftRecipe(g: GameState, recipeId: string): { ok: boolean; reason?: string; recipe?: Recipe } {
  const rec = RECIPES.find(r => r.id === recipeId);
  if (!rec) return { ok: false, reason: "Receita desconhecida" };
  const prof = g.player.professions[rec.profession];
  if (prof.level < rec.minLevel) {
    return { ok: false, reason: `${PROFESSION_NAME[rec.profession]} ${rec.minLevel}+`, recipe: rec };
  }
  for (const [ore, need] of Object.entries(rec.materials)) {
    const have = g.player.materials[ore] ?? 0;
    if (have < (need as number)) {
      return { ok: false, reason: "Faltam materiais", recipe: rec };
    }
  }
  return { ok: true, recipe: rec };
}

export function craft(g: GameState, recipeId: string, log: (m: string, c?: string) => void): boolean {
  const check = canCraftRecipe(g, recipeId);
  if (!check.ok || !check.recipe) {
    log(check.reason ?? "Não pode fabricar", "#ff8060");
    return false;
  }
  const rec = check.recipe;
  const prof = g.player.professions[rec.profession];
  const chance = craftSuccessChance(prof.level, rec.minLevel);
  const success = Math.random() < chance;
  const critFail = !success && Math.random() < 0.4;
  const critSuccess = success && Math.random() < 0.08;

  for (const [ore, need] of Object.entries(rec.materials)) {
    const spend = critFail ? Math.floor((need as number) * 0.5) : (need as number);
    g.player.materials[ore] = Math.max(0, (g.player.materials[ore] ?? 0) - spend);
  }

  if (!success) {
    sfx.playPlayerHurt();
    log(`Falha ao fabricar ${rec.name}.`, "#ff8060");
    g.player.gainProfessionXp(rec.profession, Math.floor(rec.xp * 0.4), log);
    return false;
  }

  const baseQ = rollQuality(prof.level, rec.minLevel);
  const quality = critSuccess
    ? QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 1, QUALITY_ORDER.indexOf(baseQ) + 2)]
    : baseQ;
  const it = makeCraftedItem(rec, quality);
  if (g.player.inventory.length < 32) {
    g.player.inventory.push(it);
  } else {
    log("Inventário cheio!", "#ff8060");
  }
  sfx.playOreBreak();
  g.player.gainProfessionXp(rec.profession, rec.xp, log);
  log(`Forjou ${it.name} (${quality})!`, it.color);
  maybeDiscoverSecret(g, rec, log);
  return true;
}

function maybeDiscoverSecret(g: GameState, made: Recipe, log: (m: string, c?: string) => void) {
  for (const rec of RECIPES) {
    if (!rec.secret || !rec.hidden) continue;
    if (g.player.recipesKnown.has(rec.id)) continue;
    const secretMats = Object.keys(rec.materials) as OreKind[];
    const madeMats = Object.keys(made.materials) as OreKind[];
    const overlap = secretMats.filter(m => madeMats.includes(m)).length;
    if (overlap >= Math.max(2, Math.floor(secretMats.length / 2)) && Math.random() < 0.2) {
      g.player.recipesKnown.add(rec.id);
      log(`Receita secreta descoberta: ${rec.name}!`, "#c25ef0");
    }
  }
}

const ENCHANT_LIST: Enchant[] = [
  "fogo", "gelo", "veneno", "luz", "sombra", "raio",
  "sangramento", "vampirismo", "critico", "velocidade", "mana", "hp",
];

export function enchantItem(g: GameState, invIdx: number, log: (m: string, c?: string) => void): boolean {
  const it = g.player.inventory[invIdx];
  if (!it || (it.kind !== "weapon" && it.kind !== "armor")) {
    log("Apenas armas ou armaduras podem ser encantadas.", "#ff8060");
    return false;
  }
  const have = g.player.materials["cristal_verde"] ?? 0;
  if (have < 2) {
    log("Faltam 2 Cristais Verdes para encantar.", "#ff8060");
    return false;
  }
  g.player.materials["cristal_verde"] = have - 2;
  const prof = g.player.professions.encantador;
  const success = Math.random() < 0.55 + prof.level * 0.004;
  if (!success) {
    log(`Encantamento falhou em ${it.name}.`, "#ff8060");
    return false;
  }
  const el = ENCHANT_LIST[Math.floor(Math.random() * ENCHANT_LIST.length)];
  it.enchant = el;
  it.power = Math.floor(it.power * 1.15) + 4;
  sfx.playCast();
  log(`${it.name} recebeu encantamento de ${el}!`, "#c25ef0");
  g.player.gainProfessionXp("encantador", 40, log);
  return true;
}

export function socketGem(g: GameState, invIdx: number, gemOre: OreKind, log: (m: string, c?: string) => void): boolean {
  const it = g.player.inventory[invIdx];
  if (!it) return false;
  if (!it.slots || it.slots <= (it.gems?.length ?? 0)) {
    log("Item sem engaste de gema livre.", "#ff8060");
    return false;
  }
  const have = g.player.materials[gemOre] ?? 0;
  if (have < 1) {
    log("Gema indisponível.", "#ff8060");
    return false;
  }
  const meta = ORES[gemOre];
  if (!meta.gem) {
    log("Este material não é uma gema.", "#ff8060");
    return false;
  }
  g.player.materials[gemOre] = have - 1;
  it.gems = it.gems ?? [];
  it.gems.push(gemOre);
  it.power += Math.max(5, Math.floor(meta.xp * 0.6));
  it.color = RARITY_COLOR[it.rarity];
  sfx.playPickup();
  log(`Engastou ${meta.name} em ${it.name}!`, meta.color);
  g.player.gainProfessionXp("joalheiro", 30, log);
  return true;
}

export function evolveItem(g: GameState, invIdx: number, log: (m: string, c?: string) => void): boolean {
  const it = g.player.inventory[invIdx];
  if (!it || (it.kind !== "weapon" && it.kind !== "armor")) {
    log("Apenas armas/armaduras evoluem.", "#ff8060");
    return false;
  }
  const ev = it.evolution ?? 0;
  const cost = 3 + ev * 3;
  const needOre: OreKind =
    ev < 2 ? "ferro_enferrujado" : ev < 4 ? "mithril" : ev < 6 ? "adamantita" : "minerio_abissal";
  const have = g.player.materials[needOre] ?? 0;
  if (have < cost) {
    log(`Faltam ${cost} ${ORES[needOre].name} para evoluir.`, "#ff8060");
    return false;
  }
  g.player.materials[needOre] = have - cost;
  const success = Math.random() < 0.78 - ev * 0.05;
  if (!success) {
    log("Evolução falhou (materiais gastos).", "#ff8060");
    return false;
  }
  it.evolution = ev + 1;
  const label =
    it.evolution <= 2 ? "+".repeat(it.evolution) :
    it.evolution === 3 ? " Suprema" :
    it.evolution === 4 ? " Mítica" :
    it.evolution === 5 ? " Lendária" : " Divina";
  const baseName = it.name.replace(/\+.*$| Suprema$| Mítica$| Lendária$| Divina$/, "");
  it.name = `${baseName}${label}`;
  it.power = Math.floor(it.power * 1.3) + 6;
  sfx.playLevelUp();
  log(`${it.name} evoluiu!`, "#f0b040");
  return true;
}
