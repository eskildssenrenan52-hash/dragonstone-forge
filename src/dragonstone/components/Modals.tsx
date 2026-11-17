import { gameColor } from "../game/uiColor";
import { GameButton } from "@/components/GameButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "../game/audio";
import {
  BIOMES,
  CLASS_INFO,
  ENCHANT_COLOR,
  PROFESSION_LIST,
  PROFESSION_NAME,
} from "../game/biomes";
import {
  BENCH_NAME,
  canCraftRecipe,
  craft,
  craftSuccessChance,
  enchantItem,
  evolveItem,
  PROFESSION_BENCH,
  RECIPES,
  socketGem,
} from "../game/crafting";
import {
  allocAttr,
  sellInventoryItem,
  useInventoryItem,
} from "../game/engine";
import {
  makePickaxe,
  miningStats,
  ORES,
  PICKAXE_TIERS,
} from "../game/mining";
import {
  FIXED_WORLD_SIZE,
  TILE,
  type GameState,
  type Item,
  type OreKind,
  type PanelId,
  type Profession,
} from "../game/types";
import { AnimatedSpritePreview, PixelIcon, PixelModalShell, type PixelIconName } from "./PixelUI";

function itemIcon(it: Item): PixelIconName {
  if (it.isPickaxe) return "pickaxe";
  if (it.kind === "weapon") return "sword";
  if (it.kind === "armor") return "shield";
  if (it.kind === "potion") return "potion";
  return "gem";
}

function logToGame(g: GameState, text: string, color = "var(--game-e8e8e8)") {
  g.log.unshift({ text, color, life: 7 });
  if (g.log.length > 6) g.log.pop();
}

export function GameModals({
  g,
  onClose,
  onSelectTab,
  onRefresh,
  onResume,
  onSaveNow,
  onRestart,
  onExitToTitle,
  onResurrect,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
  onRefresh: () => void;
  onResume: () => void;
  onSaveNow: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  onResurrect: () => void;
}) {
  if (g.defeatSnapshot) {
    return <DefeatModal g={g} onResurrect={onResurrect} />;
  }
  if (g.paused) {
    return (
      <PauseModal
        onResume={onResume}
        onSaveNow={onSaveNow}
        onRestart={onRestart}
        onExitToTitle={onExitToTitle}
      />
    );
  }
  if (g.panel === "none") return null;

  if (g.panel === "inventory") {
    return <InventoryModal g={g} onClose={onClose} onSelectTab={onSelectTab} onRefresh={onRefresh} />;
  }
  if (g.panel === "stats") {
    return <StatsModal g={g} onClose={onClose} onSelectTab={onSelectTab} onRefresh={onRefresh} />;
  }
  if (g.panel === "mining") {
    return <MiningModal g={g} onClose={onClose} onSelectTab={onSelectTab} onRefresh={onRefresh} />;
  }
  if (g.panel === "crafting") {
    return <CraftingModal g={g} onClose={onClose} onSelectTab={onSelectTab} onRefresh={onRefresh} />;
  }
  if (g.panel === "map") {
    return <WorldMapModal g={g} onClose={onClose} onSelectTab={onSelectTab} />;
  }
  if (g.panel === "help") {
    return <HelpModal onClose={onClose} onSelectTab={onSelectTab} />;
  }
  return null;
}

// ============================================================================
// 1. Inventory Modal (Equip, Use, Sell, Enchant, Socket Gem, Evolve)
// ============================================================================
function InventoryModal({
  g,
  onClose,
  onSelectTab,
  onRefresh,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
  onRefresh: () => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const p = g.player;
  const clampedIdx = Math.min(selectedIdx, Math.max(0, p.inventory.length - 1));
  const selectedItem = p.inventory[clampedIdx] ?? null;

  const availableGems = useMemo(() => {
    return (Object.keys(ORES) as OreKind[]).filter(
      (k) => ORES[k].gem && (p.materials[k] ?? 0) > 0,
    );
  }, [p.materials]);

  const [chosenGem, setChosenGem] = useState<OreKind | "">("");
  const activeGem = (chosenGem && (p.materials[chosenGem] ?? 0) > 0
    ? chosenGem
    : availableGems[0] ?? "") as OreKind | "";

  const slotsArray = Array.from({ length: 32 }, (_, i) => p.inventory[i] ?? null);

  return (
    <PixelModalShell
      title="Mochila do Aventureiro"
      subtitle={`${p.inventory.length}/32 espaços · ${p.gold} ouro · Encante, engaste gemas ou evolua itens`}
      activeTab="inventory"
      onSelectTab={onSelectTab}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Equipped Gear + 32-Slot Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Equipped Trio */}
          <div className="px-inset p-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--game-f4c85b)] mb-2">
              Equipamento Ativo
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { label: "Arma", item: p.equipped.weapon, fallback: "sword" },
                  { label: "Armadura", item: p.equipped.armor, fallback: "shield" },
                  { label: "Picareta", item: p.equipped.pickaxe, fallback: "pickaxe" },
                ] as const
              ).map((slot) => (
                <div key={slot.label} className="px-slot p-2 flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 px-inset flex items-center justify-center shrink-0">
                    <PixelIcon
                      name={slot.item ? itemIcon(slot.item) : slot.fallback}
                      size={18}
                      color={slot.item?.color ?? "var(--game-6a5c4d)"}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase text-[var(--game-a69276)] font-pixel-mono">
                      {slot.label}
                    </div>
                    <div
                      className="text-xs font-bold truncate"
                      style={{ color: slot.item?.color ?? "var(--game-7e6e5c)" }}
                    >
                      {slot.item ? slot.item.name : "Vazio"}
                    </div>
                    {slot.item && (
                      <div className="text-[10px] font-pixel-mono text-[var(--game-d4c3a4)]">
                        Poder {slot.item.power}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 32-Slot Inventory Grid */}
          <div className="px-inset p-3">
            <div className="grid grid-cols-8 gap-1.5">
              {slotsArray.map((it, idx) => {
                const isSel = it !== null && idx === clampedIdx;
                return (
                  <GameButton
                    key={idx}
                    type="button"
                    tabIndex={-1}
                    disabled={!it}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      if (it) setSelectedIdx(idx);
                    }}
                    title={it ? `${it.name} (${it.rarity})` : "Espaço vazio"}
                    className={`aspect-square flex flex-col items-center justify-center p-1 relative ${
                      isSel ? "px-slot-active" : "px-slot"
                    } ${it ? "cursor-pointer hover:brightness-115" : "opacity-55 cursor-default"}`}
                  >
                    {it && (
                      <>
                        <PixelIcon name={itemIcon(it)} size={20} color={it.color} />
                        <span className="font-pixel-mono text-[9px] font-bold text-[var(--game-f7ebd3)] leading-none mt-0.5">
                          {it.power}
                        </span>
                        {it.enchant && (
                          <span
                            className="absolute top-0.5 right-0.5 w-2 h-2 border border-[var(--game-080503)]"
                            style={{ backgroundColor: ENCHANT_COLOR[it.enchant] }}
                          />
                        )}
                      </>
                    )}
                  </GameButton>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Item Inspector & Upgrades */}
        <div className="lg:col-span-5">
          <div className="px-inset p-4 h-full flex flex-col justify-between gap-4">
            {selectedItem ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="px-slot-active p-2.5 shrink-0">
                      <PixelIcon name={itemIcon(selectedItem)} size={28} color={selectedItem.color} />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="font-display text-base font-bold leading-tight"
                        style={{ color: selectedItem.color }}
                      >
                        {selectedItem.name}
                      </h4>
                      <p className="font-pixel-mono text-[11px] uppercase text-[var(--game-bba88a)] mt-0.5">
                        {selectedItem.rarity} · {selectedItem.quality ?? "padrão"}
                      </p>
                    </div>
                  </div>

                  <div className="px-slot p-3 space-y-1.5 text-xs font-pixel-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--game-bba88a)]">Poder Base:</span>
                      <span className="text-[var(--game-f4c85b)] font-bold">+{selectedItem.power}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--game-bba88a)]">Valor de Venda:</span>
                      <span className="text-[var(--game-f4c85b)]">{Math.max(5, selectedItem.power * 2)}g</span>
                    </div>
                    {selectedItem.enchant && (
                      <div className="flex justify-between">
                        <span className="text-[var(--game-bba88a)]">Encantamento:</span>
                        <span
                          className="uppercase font-bold"
                          style={{ color: ENCHANT_COLOR[selectedItem.enchant] }}
                        >
                          {selectedItem.enchant}
                        </span>
                      </div>
                    )}
                    {(selectedItem.slots ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--game-bba88a)]">Engastes de Gema:</span>
                        <span className="text-[var(--game-8fcfff)]">
                          {selectedItem.gems?.length ?? 0}/{selectedItem.slots}
                        </span>
                      </div>
                    )}
                    {selectedItem.gems && selectedItem.gems.length > 0 && (
                      <div className="text-[11px] text-[var(--game-a0e8ff)] pt-1">
                        Gemas: {selectedItem.gems.map((gm) => ORES[gm as OreKind]?.name ?? gm).join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <GameButton
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        useInventoryItem(g, clampedIdx);
                        onRefresh();
                      }}
                      className="px-btn px-btn-emerald py-2 px-3 text-xs font-bold uppercase"
                    >
                      {selectedItem.kind === "potion"
                        ? "Beber Poção"
                        : selectedItem.kind === "material"
                          ? "Converter Ouro"
                          : "Equipar"}
                    </GameButton>

                    <GameButton
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        sellInventoryItem(g, clampedIdx);
                        onRefresh();
                      }}
                      className="px-btn px-btn-crimson py-2 px-3 text-xs font-bold uppercase"
                    >
                      Vender ({Math.max(5, selectedItem.power * 2)}g)
                    </GameButton>
                  </div>

                  {(selectedItem.kind === "weapon" || selectedItem.kind === "armor") &&
                    !selectedItem.isPickaxe && (
                      <div className="pt-2 border-t border-[var(--game-2b1f15)] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <GameButton
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              enchantItem(g, clampedIdx, (m, c) => logToGame(g, m, c));
                              onRefresh();
                            }}
                            className="px-btn px-btn-wood py-2 px-2 text-[11px] font-bold"
                          >
                            Encantar (2 Cristal Verde)
                          </GameButton>

                          <GameButton
                            type="button"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              evolveItem(g, clampedIdx, (m, c) => logToGame(g, m, c));
                              onRefresh();
                            }}
                            className="px-btn px-btn-gold py-2 px-2 text-[11px] font-bold"
                          >
                            Evoluir Item (+{selectedItem.evolution ?? 0})
                          </GameButton>
                        </div>

                        {(selectedItem.slots ?? 0) > (selectedItem.gems?.length ?? 0) && (
                          <div className="flex items-center gap-2">
                            <select
                              value={activeGem}
                              onChange={(e) => setChosenGem(e.target.value as OreKind)}
                              className="px-inset flex-1 px-2 py-1.5 text-xs text-[var(--game-f4e8cf)]"
                            >
                              {availableGems.length === 0 ? (
                                <option value="">Sem gemas mineradas</option>
                              ) : (
                                availableGems.map((gm) => (
                                  <option key={gm} value={gm}>
                                    {ORES[gm].name} ({p.materials[gm]})
                                  </option>
                                ))
                              )}
                            </select>
                            <GameButton
                              type="button"
                              tabIndex={-1}
                              disabled={!activeGem}
                              onClick={(e) => {
                                e.currentTarget.blur();
                                if (activeGem) {
                                  socketGem(g, clampedIdx, activeGem, (m, c) => logToGame(g, m, c));
                                  onRefresh();
                                }
                              }}
                              className="px-btn px-btn-wood px-3 py-1.5 text-xs font-bold shrink-0"
                            >
                              Engastar
                            </GameButton>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--game-9b896f)] py-8">
                <PixelIcon name="backpack" size={32} />
                <p className="text-sm mt-2">Sua mochila está vazia.</p>
                <p className="text-xs mt-1">Derrote criaturas ou forje equipamentos na bancada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 2. Stats Modal
// ============================================================================
function StatsModal({
  g,
  onClose,
  onSelectTab,
  onRefresh,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
  onRefresh: () => void;
}) {
  const p = g.player;
  const info = CLASS_INFO[p.cls];

  const attrs: Array<{ key: "str" | "agi" | "int" | "vit"; label: string; desc: string; color: string }> = [
    { key: "str", label: "Força (FOR)",       desc: "Amplia ataque físico corpo a corpo", color: "var(--game-e85040)" },
    { key: "agi", label: "Agilidade (AGI)",   desc: "Aumenta dano à distância e velocidade", color: "var(--game-5ed86a)" },
    { key: "int", label: "Inteligência (INT)",desc: "Potencializa magias, MP e regeneração", color: "var(--game-5aa8ff)" },
    { key: "vit", label: "Vitalidade (VIT)",  desc: "+6 HP máx e +1.4 defesa por ponto", color: "var(--game-f4c85b)" },
  ];

  return (
    <PixelModalShell
      title={`Ficha de ${info.name}`}
      subtitle={`Nível ${p.level} · ${info.role} · ${p.attrPoints} pontos disponíveis`}
      activeTab="stats"
      onSelectTab={onSelectTab}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 px-inset p-4 flex flex-col items-center text-center gap-3">
          <div className="px-slot-active p-3">
            <AnimatedSpritePreview cls={p.cls} size={88} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--game-f4c85b)]">{info.name}</h3>
            <p className="text-xs text-[var(--game-bba88a)]">{info.desc}</p>
          </div>
          <div className="w-full px-slot p-3 space-y-1.5 text-xs font-pixel-mono text-left">
            <div className="flex justify-between">
              <span className="text-[var(--game-bba88a)]">Ataque Total</span>
              <span className="text-[var(--game-ff7860)] font-bold">{p.atk()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--game-bba88a)]">Defesa Total</span>
              <span className="text-[var(--game-7cc2ff)] font-bold">{p.def()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--game-bba88a)]">Experiência</span>
              <span className="text-[var(--game-f4c85b)]">{p.xp}/{p.xpNext}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--game-bba88a)]">Abates / Chefes</span>
              <span className="text-[var(--game-f7ebd3)]">{g.kills} / {g.bossKills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--game-bba88a)]">Regiões Descobertas</span>
              <span className="text-[var(--game-5ed86a)]">{g.discovered.size}/40</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 px-inset p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase text-[var(--game-f4c85b)]">
              Atributos Primários
            </h3>
            <span className="font-pixel-mono text-xs text-[var(--game-5ed86a)]">
              Pontos livres: {p.attrPoints}
            </span>
          </div>

          <div className="space-y-2.5">
            {attrs.map((a) => (
              <div key={a.key} className="px-slot p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: a.color }}>
                    {a.label}: <span className="font-pixel-mono text-[var(--game-fff1d0)]">{p.attr[a.key]}</span>
                  </div>
                  <p className="text-xs text-[var(--game-bba88a)]">{a.desc}</p>
                </div>
                <GameButton
                  type="button"
                  tabIndex={-1}
                  disabled={p.attrPoints <= 0}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    allocAttr(g, a.key);
                    onRefresh();
                  }}
                  className="px-btn px-btn-gold px-3 py-1.5 font-pixel-mono text-xs font-extrabold shrink-0"
                >
                  +1
                </GameButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 3. Mining Modal
// ============================================================================
function MiningModal({
  g,
  onClose,
  onSelectTab,
  onRefresh,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
  onRefresh: () => void;
}) {
  const p = g.player;
  const st = miningStats(p.miningLevel);
  const currentTier = p.equipped.pickaxe?.pickaxeTier ?? 1;

  const ownedMaterials = (Object.keys(ORES) as OreKind[]).filter(
    (k) => (p.materials[k] ?? 0) > 0,
  );

  const handleEquipOrBuyPickaxe = (tier: number, reqLv: number, cost: number) => {
    const invIdx = p.inventory.findIndex((it) => it.isPickaxe && it.pickaxeTier === tier);
    if (invIdx >= 0) {
      useInventoryItem(g, invIdx);
      onRefresh();
      return;
    }
    if (p.miningLevel < reqLv || p.gold < cost) return;
    p.gold -= cost;
    const prev = p.equipped.pickaxe;
    p.equipped.pickaxe = makePickaxe(tier);
    if (prev && p.inventory.length < 32) {
      p.inventory.push(prev);
    }
    sfx.playOreBreak();
    logToGame(g, `Forjou e equipou ${p.equipped.pickaxe.name}!`, p.equipped.pickaxe.color);
    onRefresh();
  };

  return (
    <PixelModalShell
      title="Mineração & Jazidas"
      subtitle={`Mineração Nível ${p.miningLevel} (${p.miningXp}/${p.miningXpNext} XP) · Picareta Tier ${currentTier}`}
      activeTab="mining"
      onSelectTab={onSelectTab}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Mining Stats + Pickaxe Tiers */}
        <div className="lg:col-span-6 space-y-4">
          <div className="px-inset p-3 grid grid-cols-3 gap-2 font-pixel-mono text-xs">
            <div className="px-slot p-2">
              <div className="text-[10px] text-[var(--game-bba88a)]">VELOCIDADE</div>
              <div className="text-[var(--game-8fcfff)] font-bold">{Math.round(st.speed * 100)}%</div>
            </div>
            <div className="px-slot p-2">
              <div className="text-[10px] text-[var(--game-bba88a)]">CRÍTICO</div>
              <div className="text-[var(--game-f4c85b)] font-bold">{(st.crit * 100).toFixed(1)}%</div>
            </div>
            <div className="px-slot p-2">
              <div className="text-[10px] text-[var(--game-bba88a)]">CHANCE GEMA</div>
              <div className="text-[var(--game-60e0a0)] font-bold">{(st.gemChance * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="px-inset p-3 space-y-2 max-h-[340px] overflow-y-auto px-scroll">
            <h3 className="font-display text-xs font-bold uppercase text-[var(--game-f4c85b)]">
              Tiers de Picareta (1–10)
            </h3>
            {PICKAXE_TIERS.map((pk) => {
              const isEquipped = currentTier === pk.tier;
              const inBag = p.inventory.some((it) => it.isPickaxe && it.pickaxeTier === pk.tier);
              const goldCost = pk.tier === 1 ? 0 : pk.tier * pk.tier * 25;
              const canUpgrade =
                !isEquipped && (inBag || (p.miningLevel >= pk.miningLevel && p.gold >= goldCost));
              return (
                <div
                  key={pk.tier}
                  className={`p-2 flex items-center justify-between gap-2 ${
                    isEquipped ? "px-slot-active" : "px-slot"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelIcon name="pickaxe" size={18} color={pk.color} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: pk.color }}>
                        T{pk.tier} · {pk.name}
                      </div>
                      <div className="font-pixel-mono text-[10px] text-[var(--game-bba88a)]">
                        Poder {pk.power} · Req. Mineração {pk.miningLevel}
                      </div>
                    </div>
                  </div>
                  {isEquipped ? (
                    <span className="font-pixel-mono text-[10px] font-bold text-[var(--game-f4c85b)] px-2">
                      EQUIPADA
                    </span>
                  ) : (
                    <GameButton
                      type="button"
                      tabIndex={-1}
                      disabled={!canUpgrade}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleEquipOrBuyPickaxe(pk.tier, pk.miningLevel, goldCost);
                      }}
                      className="px-btn px-btn-gold px-2.5 py-1 font-pixel-mono text-[10px] font-bold shrink-0"
                    >
                      {inBag ? "Equipar" : `${goldCost}g`}
                    </GameButton>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Collected Ores & Gems */}
        <div className="lg:col-span-6 px-inset p-3 flex flex-col">
          <h3 className="font-display text-xs font-bold uppercase text-[var(--game-f4c85b)] mb-2">
            Minérios & Gemas Armazenados ({ownedMaterials.length}/28)
          </h3>
          {ownedMaterials.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--game-9b896f)] py-12">
              <PixelIcon name="gem" size={32} color="var(--game-60d080)" />
              <p className="text-sm mt-2">Nenhum minério no estoque ainda.</p>
              <p className="text-xs mt-1">
                Saia pelos portões de Asterion e clique diretamente nos veios brilhantes para minerar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto px-scroll max-h-[410px]">
              {ownedMaterials.map((k) => {
                const ore = ORES[k];
                const qty = p.materials[k] ?? 0;
                return (
                  <div key={k} className="px-slot p-2 flex items-center gap-2 min-w-0">
                    <span
                      className="w-3.5 h-3.5 border border-[var(--game-080503)] shrink-0"
                      style={{ backgroundColor: ore.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-[var(--game-f4e8cf)] truncate">
                        {ore.name}
                      </div>
                      <div className="font-pixel-mono text-[10px] text-[var(--game-f4c85b)]">
                        x{qty} {ore.gem ? "· Gema" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 4. Crafting & Forge Modal
// ============================================================================
function CraftingModal({
  g,
  onClose,
  onSelectTab,
  onRefresh,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
  onRefresh: () => void;
}) {
  const p = g.player;
  const activeProf = g.craftingTab;
  const profState = p.professions[activeProf];
  const benchName = BENCH_NAME[PROFESSION_BENCH[activeProf]];

  const recipes = RECIPES.filter(
    (r) =>
      r.profession === activeProf &&
      (!r.hidden || p.recipesKnown.has(r.id)),
  );

  const selectProf = (pr: Profession) => {
    g.craftingTab = pr;
    sfx.playClick();
    onRefresh();
  };

  return (
    <PixelModalShell
      title={benchName}
      subtitle={`${PROFESSION_NAME[activeProf]} Nível ${profState.level} (${profState.xp}/${profState.xpNext} XP)`}
      activeTab="crafting"
      onSelectTab={onSelectTab}
      onClose={onClose}
    >
      {/* 8 Profession Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PROFESSION_LIST.map((pr) => {
          const active = pr === activeProf;
          return (
            <GameButton
              key={pr}
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                selectProf(pr);
              }}
              className={`px-btn px-2.5 py-1.5 text-xs font-bold ${
                active ? "px-btn-gold" : "px-btn-wood"
              }`}
            >
              {PROFESSION_NAME[pr]}{" "}
              <span className="font-pixel-mono text-[10px] opacity-80">
                Nv.{p.professions[pr].level}
              </span>
            </GameButton>
          );
        })}
      </div>

      {/* Recipes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto px-scroll pr-1">
        {recipes.map((rec) => {
          const check = canCraftRecipe(g, rec.id);
          const chance = Math.round(craftSuccessChance(profState.level, rec.minLevel) * 100);
          return (
            <div key={rec.id} className="px-slot p-3 flex flex-col justify-between gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <PixelIcon
                      name={
                        rec.produces.kind === "weapon"
                          ? "sword"
                          : rec.produces.kind === "armor"
                            ? "shield"
                            : rec.produces.kind === "potion"
                              ? "potion"
                              : "gem"
                      }
                      size={16}
                      color={rec.secret ? "var(--game-c25ef0)" : "var(--game-f4c85b)"}
                    />
                    <h4 className="font-display text-sm font-bold text-[var(--game-fff1d0)]">
                      {rec.name}
                    </h4>
                  </div>
                  <p className="font-pixel-mono text-[10px] text-[var(--game-bba88a)] mt-0.5">
                    Poder Base {rec.produces.basePower} · Req. Nv.{rec.minLevel} · Sucesso {chance}%
                  </p>
                </div>
                {rec.secret && (
                  <span className="px-1.5 py-0.5 bg-[var(--game-451970)] border border-[var(--game-c25ef0)] font-pixel-mono text-[9px] text-[var(--game-f0d0ff)]">
                    SECRETA
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(rec.materials).map(([oreKey, need]) => {
                  const have = p.materials[oreKey] ?? 0;
                  const enough = have >= (need as number);
                  const meta = ORES[oreKey as OreKind];
                  return (
                    <span
                      key={oreKey}
                      className={`px-inset px-2 py-0.5 font-pixel-mono text-[10px] ${
                        enough ? "text-[var(--game-8ee89a)]" : "text-[var(--game-ff8080)]"
                      }`}
                    >
                      {meta?.name ?? oreKey}: {have}/{need}
                    </span>
                  );
                })}
              </div>

              <GameButton
                type="button"
                tabIndex={-1}
                disabled={!check.ok}
                onClick={(e) => {
                  e.currentTarget.blur();
                  craft(g, rec.id, (m, c) => logToGame(g, m, c));
                  onRefresh();
                }}
                className={`px-btn py-1.5 px-3 text-xs font-bold uppercase ${
                  check.ok ? "px-btn-gold" : "px-btn-wood"
                }`}
              >
                {check.ok ? "Forjar Item" : check.reason}
              </GameButton>
            </div>
          );
        })}
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 5. Interactive Fixed World Map Modal (320x320 Handcrafted Continent)
// ============================================================================
function WorldMapModal({
  g,
  onClose,
  onSelectTab,
}: {
  g: GameState;
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!offscreenRef.current) {
      const off = document.createElement("canvas");
      off.width = FIXED_WORLD_SIZE;
      off.height = FIXED_WORLD_SIZE;
      const octx = off.getContext("2d");
      if (!octx) return;
      for (let y = 0; y < FIXED_WORLD_SIZE; y++) {
        for (let x = 0; x < FIXED_WORLD_SIZE; x++) {
          const t = g.world.get(x, y);
          let col = "var(--game-153257)";
          if (t.kind === 1) col = "var(--game-194375)";
          else if (t.kind === 14) col = "var(--game-d6c8ad)";
          else if (t.kind === 13) col = "var(--game-8c7a62)";
          else if (t.kind === 17 || t.kind === 18) col = "var(--game-caa86a)";
          else if (t.kind === 3) col = "var(--game-d4b475)";
          else if (t.kind === 4) col = "var(--game-1f4e27)";
          else if (t.kind === 2) col = "var(--game-5d5a66)";
          else {
            const b = BIOMES.find((bm) => bm.id === t.biome);
            col = b ? b.color : "var(--game-4d8a4b)";
          }
          octx.fillStyle = gameColor(col);
          octx.fillRect(x, y, 1, 1);
        }
      }
      // Cities & Stairs
      for (const c of g.world.cities) {
        octx.fillStyle = gameColor("var(--game-f4c85b)");
        octx.fillRect(c.tx - 1, c.ty - 1, 3, 3);
      }
      for (const s of g.world.stairs) {
        const sx = Math.floor(s.x / TILE);
        const sy = Math.floor(s.y / TILE);
        octx.fillStyle = gameColor(s.kind === "grand" ? "var(--game-ffffff)" : "var(--game-5ce8ff)");
        octx.fillRect(sx - 1, sy - 1, 2, 2);
      }
      offscreenRef.current = off;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreenRef.current, 0, 0, canvas.width, canvas.height);

    // Draw player pulse reticle
    const px = (g.player.pos.x / TILE / FIXED_WORLD_SIZE) * canvas.width;
    const py = (g.player.pos.y / TILE / FIXED_WORLD_SIZE) * canvas.height;
    ctx.fillStyle = gameColor("var(--game-ffffff)");
    ctx.fillRect(Math.round(px) - 4, Math.round(py) - 4, 8, 8);
    ctx.strokeStyle = gameColor("var(--game-ff3848)");
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(px) - 6, Math.round(py) - 6, 12, 12);
  }, [g]);

  const ptx = Math.floor(g.player.pos.x / TILE);
  const pty = Math.floor(g.player.pos.y / TILE);

  return (
    <PixelModalShell
      title="Mapa Cartográfico de Asterion"
      subtitle={`Continente Fixo 320×320 · Descobertas: ${g.discovered.size}/40 regiões · Posição (${ptx}, ${pty})`}
      activeTab="map"
      onSelectTab={onSelectTab}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="px-inset p-2">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="pixelated w-full max-w-[460px] aspect-square border-2 border-[var(--game-080503)]"
            />
          </div>
          <div className="flex flex-wrap gap-4 mt-2.5 font-pixel-mono text-[11px] text-[var(--game-d5c5a6)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--game-ff3848)] border border-[var(--game-ffffff)] inline-block" /> Você
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--game-f4c85b)] inline-block" /> Cidades (40)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--game-5ce8ff)] inline-block" /> Cavernas ▼
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[var(--game-caa86a)] inline-block" /> Estradas Reais
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 px-inset p-3 flex flex-col">
          <h3 className="font-display text-xs font-bold uppercase text-[var(--game-f4c85b)] mb-2">
            Regiões & Postos Avançados
          </h3>
          <div className="space-y-1.5 overflow-y-auto px-scroll max-h-[450px] pr-1">
            {BIOMES.map((b) => {
              const found = g.discovered.has(b.id);
              const city = g.world.cities.find((c) => c.biome === b.id);
              return (
                <div
                  key={b.id}
                  className={`px-slot px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs ${
                    found ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 border border-[var(--game-080503)] shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--game-f4e8cf)] truncate">{b.name}</div>
                      <div className="font-pixel-mono text-[10px] text-[var(--game-bba88a)]">
                        {city?.name ?? "Posto"} {city ? `(${city.tx},${city.ty})` : ""}
                      </div>
                    </div>
                  </div>
                  <span className="font-pixel-mono text-[10px] text-[var(--game-f4c85b)] shrink-0">
                    Perigo {b.danger}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 6. Help Modal
// ============================================================================
function HelpModal({
  onClose,
  onSelectTab,
}: {
  onClose: () => void;
  onSelectTab: (tab: Exclude<PanelId, "none">) => void;
}) {
  const rows: Array<[string, string]> = [
    ["WASD / Setas", "Mover pelo continente fixo de Asterion (Shift corre)"],
    ["Clique Esquerdo", "Atacar inimigos na mira ou minerar jazidas minerais próximas"],
    ["Teclas 1 a 4", "Ativar as 4 habilidades exclusivas da sua classe"],
    ["I / C / N / B / M", "Abrir Mochila, Status, Mineração, Forja ou Mapa Mundi"],
    ["P / ESC", "Pausar o jogo ou fechar janelas abertas"],
    ["F5 / F9", "Salvar progresso manualmente / Carregar último save"],
    ["Escadarias ▼ ▲", "Pise sobre escadarias douradas em Asterion (100 andares) ou nas 40 regiões"],
  ];

  return (
    <PixelModalShell
      title="Guia de Asterion"
      subtitle="Comandos e regras do mundo fixo de Dragonstone Forge"
      activeTab="help"
      onSelectTab={onSelectTab}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-2.5">
        {rows.map(([k, desc]) => (
          <div key={k} className="px-slot p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-pixel-mono text-xs font-bold text-[var(--game-f4c85b)] shrink-0">{k}</span>
            <span className="text-xs text-[var(--game-dfd1b5)] sm:text-right">{desc}</span>
          </div>
        ))}
      </div>
    </PixelModalShell>
  );
}

// ============================================================================
// 7. Pause Modal
// ============================================================================
function PauseModal({
  onResume,
  onSaveNow,
  onRestart,
  onExitToTitle,
}: {
  onResume: () => void;
  onSaveNow: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--game-070506)]/80 pointer-events-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jogo Pausado"
        className="px-frame-gold w-full max-w-sm p-6 text-center space-y-5"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[var(--game-f4c85b)] uppercase tracking-wider">
            Jogo Pausado
          </h2>
          <p className="text-xs text-[var(--game-bba88a)] mt-1">
            A forja aguarda seu retorno em Asterion.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onResume();
            }}
            className="px-btn px-btn-gold py-2.5 font-display text-sm font-bold uppercase"
          >
            Continuar
          </GameButton>
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onSaveNow();
            }}
            className="px-btn px-btn-emerald py-2.5 font-display text-sm font-bold uppercase"
          >
            Salvar Agora (F5)
          </GameButton>
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="px-btn px-btn-wood py-2.5 font-display text-sm font-bold uppercase"
          >
            Reiniciar Aventura
          </GameButton>
          <GameButton
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onExitToTitle();
            }}
            className="px-btn px-btn-crimson py-2.5 font-display text-sm font-bold uppercase"
          >
            Tela Inicial
          </GameButton>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. Defeat / Resurrection Modal
// ============================================================================
function DefeatModal({
  g,
  onResurrect,
}: {
  g: GameState;
  onResurrect: () => void;
}) {
  const snap = g.defeatSnapshot;
  if (!snap) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--game-070506)]/85 pointer-events-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Derrota em Combate"
        className="px-frame-gold w-full max-w-md p-6 text-center space-y-5"
      >
        <div className="flex flex-col items-center gap-2">
          <PixelIcon name="skull" size={38} />
          <h2 className="font-display text-2xl font-extrabold text-[var(--game-ff6060)] uppercase tracking-wider">
            Você Caiu em Batalha
          </h2>
          <p className="text-xs text-[var(--game-cbb899)]">
            Tombado em <strong className="text-[var(--game-f4e8cf)]">{snap.regionName}</strong>
          </p>
        </div>

        <div className="px-inset p-3 grid grid-cols-2 gap-2 font-pixel-mono text-xs text-left">
          <div className="px-slot p-2">
            <div className="text-[10px] text-[var(--game-bba88a)]">NÍVEL</div>
            <div className="text-[var(--game-f4c85b)] font-bold">{snap.level}</div>
          </div>
          <div className="px-slot p-2">
            <div className="text-[10px] text-[var(--game-bba88a)]">ABATES / CHEFES</div>
            <div className="text-[var(--game-fff1d0)] font-bold">
              {snap.kills} / {snap.bossKills}
            </div>
          </div>
          <div className="px-slot p-2">
            <div className="text-[10px] text-[var(--game-bba88a)]">REGIÕES</div>
            <div className="text-[var(--game-5ed86a)] font-bold">{snap.discoveredCount}/40</div>
          </div>
          <div className="px-slot p-2">
            <div className="text-[10px] text-[var(--game-bba88a)]">OURO PERDIDO</div>
            <div className="text-[var(--game-ff8080)] font-bold">-{snap.goldLost}g</div>
          </div>
        </div>

        <GameButton
          type="button"
          data-start="true"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onResurrect();
          }}
          className="px-btn px-btn-gold w-full py-3 font-display text-sm font-extrabold uppercase tracking-wider"
        >
          Ressuscitar em Asterion
        </GameButton>
      </div>
    </div>
  );
}
