import assert from "node:assert/strict";
import test from "node:test";
import { BIOMES } from "./biomes";
import {
  FixedCaveFloor,
  FixedGrandDungeonFloor,
  FixedWorld,
} from "./fixedWorld";
import { FIXED_WORLD_SIZE, TILE } from "./types";

test("FixedWorld is completely deterministic across instances", () => {
  const w1 = new FixedWorld();
  const w2 = new FixedWorld();

  assert.equal(w1.size, FIXED_WORLD_SIZE);
  assert.equal(w1.cities.length, 40);
  assert.equal(w1.stairs.length, 40);

  for (let i = 0; i < w1.tiles.length; i += 37) {
    assert.equal(w1.tiles[i].kind, w2.tiles[i].kind);
    assert.equal(w1.tiles[i].biome, w2.tiles[i].biome);
  }
  assert.deepEqual(w1.cities, w2.cities);
  assert.deepEqual(w1.stairs, w2.stairs);
});

test("Central City of Asterion has safe walkable spawn, clear gates, and reachable Grand Staircase", () => {
  const w = new FixedWorld();
  const sx = Math.floor(w.spawn.x / TILE);
  const sy = Math.floor(w.spawn.y / TILE);

  assert.equal(sx, 160);
  assert.equal(sy, 164);
  assert.equal(w.isBlocked(sx, sy), false);

  // All 4 cardinal gates at radius 18 must be walkable iron gates (kind 10)
  for (const [gx, gy] of [
    [160, 142],
    [160, 178],
    [142, 160],
    [178, 160],
  ]) {
    assert.equal(w.get(gx, gy).kind, 10);
    assert.equal(w.isBlocked(gx, gy), false);
  }

  // Grand staircase must be walkable and at (160, 152)
  const gsx = Math.floor(w.grandStair.x / TILE);
  const gsy = Math.floor(w.grandStair.y / TILE);
  assert.equal(w.get(gsx, gsy).kind, 16);
  assert.equal(w.isBlocked(gsx, gsy), false);
});

test("All 40 biomes have a fixed city outpost and walkable cave staircase", () => {
  const w = new FixedWorld();
  for (const b of BIOMES) {
    const city = w.cities.find((c) => c.biome === b.id);
    assert.ok(city, `Missing city for biome ${b.id}`);
    const stair = w.stairs.find((s) => s.biome === b.id);
    assert.ok(stair, `Missing stair for biome ${b.id}`);
    const stx = Math.floor(stair.x / TILE);
    const sty = Math.floor(stair.y / TILE);
    assert.equal(w.isBlocked(stx, sty), false);
  }
});

test("FixedCaveFloor and FixedGrandDungeonFloor produce deterministic connected floors with valid stairs", () => {
  const c1 = new FixedCaveFloor(2, 2);
  const c2 = new FixedCaveFloor(2, 2);
  assert.deepEqual(c1.stairs, c2.stairs);
  assert.equal(c1.isBlocked(Math.floor(c1.spawn.x / TILE), Math.floor(c1.spawn.y / TILE)), false);
  assert.ok(c1.stairs.some((s) => s.kind === "up"));
  assert.ok(c1.stairs.some((s) => s.kind === "down"));

  const d1 = new FixedGrandDungeonFloor(15);
  const d2 = new FixedGrandDungeonFloor(15);
  assert.deepEqual(d1.stairs, d2.stairs);
  assert.equal(d1.isBlocked(Math.floor(d1.spawn.x / TILE), Math.floor(d1.spawn.y / TILE)), false);
});
