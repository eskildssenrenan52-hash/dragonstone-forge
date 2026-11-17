import assert from "node:assert/strict";
import test from "node:test";
import { canCraftRecipe, craft, craftSuccessChance } from "./crafting";
import {
  allocAttr,
  computeDamage,
  newGame,
  resurrectInCity,
  serializeGameSave,
} from "./engine";
import { makePickaxe } from "./mining";
import { TILE } from "./types";

test("computeDamage enforces positive floor and defense mitigation", () => {
  assert.equal(computeDamage(50, 20), 37);
  assert.equal(computeDamage(4, 100), 1);
});

test("newGame initializes class stats, Asterion spawn, fixed veins, and starter pickaxe", () => {
  const g = newGame("magic");
  assert.equal(g.player.cls, "magic");
  assert.equal(Math.floor(g.player.pos.x / TILE), 160);
  assert.equal(Math.floor(g.player.pos.y / TILE), 164);
  assert.equal(g.player.equipped.pickaxe?.pickaxeTier, 1);
  assert.ok(g.veins.length > 50);
  assert.ok(g.discovered.has(1));
});

test("allocAttr increases attributes, maxHp/maxMp, and consumes attrPoints", () => {
  const g = newGame("melee");
  g.player.attrPoints = 2;
  const oldVit = g.player.attr.vit;
  const oldMaxHp = g.player.maxHp;
  allocAttr(g, "vit");
  assert.equal(g.player.attr.vit, oldVit + 1);
  assert.equal(g.player.maxHp, oldMaxHp + 6);
  assert.equal(g.player.attrPoints, 1);
});

test("crafting checks material counts and profession levels accurately", () => {
  const g = newGame("melee");
  assert.equal(canCraftRecipe(g, "espada_cobre").ok, false);
  g.player.materials.cobre = 5;
  g.player.materials.pedra = 2;
  assert.equal(canCraftRecipe(g, "espada_cobre").ok, true);
  assert.ok(craftSuccessChance(10, 1) > craftSuccessChance(1, 1));
  // Calling craft consumes materials even on fail/success without throwing
  craft(g, "espada_cobre", () => {});
  assert.ok((g.player.materials.cobre ?? 0) < 5);
});

test("makePickaxe builds higher tier pickaxes and serializeGameSave outputs valid JSON", () => {
  const pk = makePickaxe(5);
  assert.equal(pk.isPickaxe, true);
  assert.equal(pk.pickaxeTier, 5);
  assert.equal(pk.power, 34);

  const g = newGame("archer");
  const json = serializeGameSave(g);
  const parsed = JSON.parse(json);
  assert.equal(parsed.player.cls, "archer");
  assert.equal(parsed.player.level, 1);
});

test("resurrectInCity restores player to Asterion and clears defeatSnapshot", () => {
  const g = newGame("paladin");
  g.player.hp = 0;
  g.player.gold = 100;
  g.defeatSnapshot = {
    level: 3,
    kills: 12,
    bossKills: 1,
    goldLost: 15,
    regionName: "Planícies de Aurora",
    discoveredCount: 2,
  };
  resurrectInCity(g);
  assert.equal(g.defeatSnapshot, null);
  assert.equal(g.player.hp, g.player.maxHp);
  assert.equal(Math.floor(g.player.pos.x / TILE), 160);
  assert.equal(Math.floor(g.player.pos.y / TILE), 164);
});
