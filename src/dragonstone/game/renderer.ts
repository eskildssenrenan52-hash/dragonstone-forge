import { BIOMES } from "./biomes";
import { coordHash, type FixedCaveFloor, type FixedGrandDungeonFloor } from "./fixedWorld";
import { getEnemyFrame, getMinionFrame, getPlayerFrame } from "./pixelSprites";
import { TILE, type GameState } from "./types";
import {
  drawAlchemistStall5x,
  drawChest5x,
  drawCityMonument5x,
  drawDragonFountain5x,
  drawForgeStation5x,
  drawGrandStair5x,
  drawIronGate5x,
  drawStair5x,
  drawSteelPillar5x,
  drawTorch5x,
  drawTree5x,
  drawVein5x,
  getCityFloorTile,
  getGroundTile,
  getRoadTile,
  getSandTile,
  getWallTile,
  getWaterFrame,
  getBridgeTile,
  renderDynamicLighting,
  type PointLight,
} from "./worldTextures";

// ============================================================================
// Master 60 FPS Canvas2D World, Sprite, VFX & Dynamic Lighting Renderer
// ============================================================================

export function renderGame(ctx: CanvasRenderingContext2D, g: GameState, w: number, h: number) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#08090f";
  ctx.fillRect(0, 0, w, h);

  // Camera shake from decaying trauma^2
  const shakeMag = g.trauma * g.trauma * 12;
  const shakeX = shakeMag > 0.2 ? Math.sin(g.time * 65) * shakeMag : 0;
  const shakeY = shakeMag > 0.2 ? Math.cos(g.time * 73) * shakeMag : 0;
  const camX = Math.round(g.camera.x - w / 2 + shakeX);
  const camY = Math.round(g.camera.y - h / 2 + shakeY);

  const inCave = !!g.activeCaveBiome;
  const inGrand = g.activeGrandFloor > 0;
  const map = g.activeMap;

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(map.size - 1, Math.ceil((camX + w) / TILE) + 1);
  const y1 = Math.min(map.size - 1, Math.ceil((camY + h) / TILE) + 1);

  const waterFrame = Math.floor(g.time * 4) % 4;
  const lights: PointLight[] = [];

  // Always illuminate around the player
  lights.push({
    x: g.player.pos.x,
    y: g.player.pos.y,
    radius: inCave || inGrand ? 210 : 185,
    color: g.player.cls === "magic" ? "#70b8ff" : g.player.cls === "necro" ? "#c070ff" : "#ffd080",
    intensity: 0.95,
  });

  // 1. Pass: Terrain tiles + Collect dynamic lights + Deferred tall props
  const tallDraws: Array<() => void> = [];

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = map.get(x, y);
      const sx = x * TILE - camX;
      const sy = y * TILE - camY;
      const variant = Math.floor(coordHash(x, y, 17) * 4);
      const biomeId = inCave ? g.activeCaveBiome! : t.biome || 1;

      if (inCave || inGrand) {
        const floorNum = inGrand ? g.activeGrandFloor : (map as FixedCaveFloor).floor;
        if (t.kind === 2 || t.kind === 9 || t.kind === 14) {
          ctx.drawImage(getWallTile(biomeId, t.kind === 9, false, floorNum), sx, sy);
          if (t.kind === 9) {
            lights.push({ x: sx + camX + 24, y: sy + camY + 24, radius: 75, color: "#b870ff", intensity: 0.45 });
          }
          continue;
        }
        // Subterranean cobblestone floor
        const floorBg = inGrand
          ? (floorNum > 66 ? "#1b121c" : floorNum > 33 ? "#191c26" : "#22201d")
          : BIOMES.find(b => b.id === biomeId)?.caveTheme.floor ?? "#202028";
        ctx.fillStyle = floorBg;
        ctx.fillRect(sx, sy, TILE, TILE);
        if (coordHash(x, y, 91) > 0.72) {
          ctx.fillStyle = "rgba(255,255,255,0.035)";
          ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        }
        if (t.kind === 8) {
          tallDraws.push(() => drawTorch5x(ctx, sx, sy, x, y, g.time));
          const flick = 0.82 + Math.sin(g.time * 11 + x * 3 + y) * 0.14;
          lights.push({ x: x * TILE + 24, y: y * TILE + 18, radius: 175, color: "#ff9a38", intensity: flick });
        } else if (t.kind === 10) {
          drawIronGate5x(ctx, sx, sy);
        } else if (t.kind === 11) {
          tallDraws.push(() => drawSteelPillar5x(ctx, sx, sy));
        } else if (t.kind === 12) {
          const chest = inGrand ? (map as FixedGrandDungeonFloor).chests.find(c => c.x === x && c.y === y) : undefined;
          const isSec = chest?.secret ?? false;
          tallDraws.push(() => drawChest5x(ctx, sx, sy, g.time, isSec));
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 90, color: isSec ? "#d070ff" : "#ffd060", intensity: 0.6 });
        } else if (t.kind === 6 || t.kind === 7) {
          drawStair5x(ctx, sx, sy, t.kind === 6, g.time);
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 110, color: t.kind === 6 ? "#f4c85b" : "#70d0ff", intensity: 0.6 });
        }
        continue;
      }

      // Overworld tile rendering
      if (t.kind === 1) {
        ctx.drawImage(getWaterFrame(waterFrame), sx, sy);
        // Crisp shoreline bevel if land is directly north
        if (map.get(x, y - 1).kind !== 1) {
          ctx.fillStyle = "rgba(180, 235, 255, 0.35)";
          ctx.fillRect(sx, sy, TILE, 3);
        }
      } else if (t.kind === 18) {
        ctx.drawImage(getBridgeTile(), sx, sy);
      } else if (t.kind === 17) {
        ctx.drawImage(getRoadTile(variant), sx, sy);
      } else if (t.kind === 13 || t.kind === 8 || t.kind === 10 || t.kind === 11 || t.kind === 15 || t.kind === 16 || t.kind === 19 || t.kind === 20) {
        ctx.drawImage(getCityFloorTile(variant), sx, sy);
        if (t.kind === 8) {
          tallDraws.push(() => drawTorch5x(ctx, sx, sy, x, y, g.time));
          const flick = 0.85 + Math.sin(g.time * 10 + x * 2 + y) * 0.14;
          lights.push({ x: x * TILE + 24, y: y * TILE + 18, radius: 165, color: "#ff9a38", intensity: flick });
        } else if (t.kind === 10) {
          drawIronGate5x(ctx, sx, sy);
        } else if (t.kind === 11) {
          tallDraws.push(() => drawSteelPillar5x(ctx, sx, sy));
        } else if (t.kind === 15) {
          tallDraws.push(() => drawDragonFountain5x(ctx, sx, sy, g.time));
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 170, color: "#68d8ff", intensity: 0.78 });
        } else if (t.kind === 16) {
          drawGrandStair5x(ctx, sx, sy, g.time);
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 150, color: "#ffd868", intensity: 0.85 });
        } else if (t.kind === 19) {
          tallDraws.push(() => drawForgeStation5x(ctx, sx, sy, g.time));
          lights.push({ x: x * TILE + 18, y: y * TILE + 26, radius: 160, color: "#ff6e20", intensity: 0.92 });
        } else if (t.kind === 20) {
          tallDraws.push(() => drawAlchemistStall5x(ctx, sx, sy, g.time));
          lights.push({ x: x * TILE + 24, y: y * TILE + 20, radius: 120, color: "#60f0a8", intensity: 0.68 });
        }
      } else if (t.kind === 14) {
        ctx.drawImage(getWallTile(biomeId, false, true, 0), sx, sy);
      } else if (t.kind === 2) {
        ctx.drawImage(getGroundTile(biomeId, variant), sx, sy);
        tallDraws.push(() => ctx.drawImage(getWallTile(biomeId, false, false, 0), sx, sy));
      } else if (t.kind === 3) {
        ctx.drawImage(getSandTile(biomeId, variant), sx, sy);
      } else {
        ctx.drawImage(getGroundTile(biomeId, variant), sx, sy);
        if (t.kind === 4) {
          tallDraws.push(() => drawTree5x(ctx, sx, sy, biomeId, x, y, g.time));
        } else if (t.kind === 5) {
          tallDraws.push(() => drawCityMonument5x(ctx, sx, sy, biomeId, g.time));
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 140, color: "#ffd878", intensity: 0.65 });
        } else if (t.kind === 6 || t.kind === 7) {
          drawStair5x(ctx, sx, sy, t.kind === 6, g.time);
          lights.push({ x: x * TILE + 24, y: y * TILE + 24, radius: 110, color: "#ffd060", intensity: 0.65 });
        } else {
          // Subtle ambient micro-decor (bushes/mushrooms/crystals)
          const hDecor = coordHash(x, y, 511);
          if (hDecor > 0.93) {
            const dx = sx + 12 + coordHash(x, y, 512) * 24;
            const dy = sy + 14 + coordHash(x, y, 513) * 20;
            if (biomeId === 20 || biomeId === 36) {
              ctx.fillStyle = "#e8d8c0";
              ctx.fillRect(dx - 1, dy, 3, 5);
              ctx.fillStyle = biomeId === 20 ? "#a080ff" : "#c070e0";
              ctx.fillRect(dx - 4, dy - 4, 9, 5);
              lights.push({ x: dx + camX, y: dy + camY, radius: 64, color: "#a080ff", intensity: 0.4 });
            } else if (biomeId === 13 || biomeId === 37) {
              ctx.fillStyle = "#88c8ff";
              ctx.fillRect(dx - 2, dy - 6, 4, 8);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(dx - 1, dy - 5, 1, 3);
              lights.push({ x: dx + camX, y: dy + camY, radius: 60, color: "#88c8ff", intensity: 0.4 });
            } else {
              ctx.fillStyle = "#2b4f26";
              ctx.fillRect(dx - 5, dy - 2, 10, 6);
              ctx.fillStyle = "#48883e";
              ctx.fillRect(dx - 4, dy - 4, 8, 5);
            }
          }
        }
      }
    }
  }

  // 2. Pass: Ore Veins & Loot
  for (const v of g.veins) {
    const sx = v.pos.x - camX;
    const sy = v.pos.y - camY;
    if (sx < -60 || sy < -60 || sx > w + 60 || sy > h + 60) continue;
    drawVein5x(ctx, v, sx, sy, g.time);
    if (v.ore === "rubi_flamejante" || v.ore === "safira" || v.ore === "diamante_azul" || v.ore === "cristal_meteorico" || v.ore === "cristal_sombrio") {
      lights.push({ x: v.pos.x, y: v.pos.y, radius: 72, color: "#a0d0ff", intensity: 0.45 });
    }
  }

  for (const l of g.loot) {
    const sx = l.pos.x - camX;
    const sy = l.pos.y - camY;
    if (sx < -40 || sy < -40 || sx > w + 40 || sy > h + 40) continue;
    const bob = Math.sin(g.time * 4 + l.bobOffset) * 3;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#140e0a";
    ctx.fillRect(sx - 10, sy - 10 + bob, 20, 20);
    ctx.fillStyle = l.item.color;
    ctx.fillRect(sx - 8, sy - 8 + bob, 16, 16);
    ctx.fillStyle = "#140e0a";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(l.item.icon, sx, sy + 1 + bob);
    lights.push({ x: l.pos.x, y: l.pos.y, radius: 48, color: l.item.color, intensity: 0.42 });
  }

  // 3. Pass: Tall world props (trees, braziers, forge, fountain, pillars)
  for (const fn of tallDraws) fn();

  // 4. Pass: Enemy Telegraphs (underneath characters for clarity)
  for (const e of g.enemies) {
    if (e.windup <= 0 || !e.telegraphKind) continue;
    const sx = e.pos.x - camX;
    const sy = e.pos.y - camY;
    const pct = 1 - e.windup / Math.max(0.1, e.windupMax);
    if (e.telegraphKind === "slam") {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 72, 90, ${0.45 + pct * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 84, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 60, 80, ${0.15 + pct * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 84 * pct, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (e.telegraphTarget) {
      const tx = e.telegraphTarget.x - camX;
      const ty = e.telegraphTarget.y - camY;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 80, 90, ${0.4 + pct * 0.5})`;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5. Pass: Minions, Enemies, Player (Kaetram-style animated sprites!)
  for (const m of g.player.minions) {
    const sx = m.pos.x - camX;
    const sy = m.pos.y - camY;
    if (sx < -60 || sy < -60 || sx > w + 60 || sy > h + 60) continue;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 14, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const spr = getMinionFrame(g.time, m.walkCycle, m.attackAnim > 0);
    ctx.drawImage(spr, Math.round(sx - 22), Math.round(sy - 26), 44, 44);
  }

  for (const e of g.enemies) {
    const sx = e.pos.x - camX;
    const sy = e.pos.y - camY;
    if (sx < -80 || sy < -80 || sx > w + 80 || sy > h + 80) continue;

    const sprScale = e.isBoss ? 68 : 48;
    const alpha = e.koTimer > 0 ? Math.max(0, e.koTimer / 0.34) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + (e.isBoss ? 22 : 14), e.radius, e.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss ground sigil
    if (e.isBoss && e.koTimer <= 0) {
      const pulse = 0.5 + Math.sin(g.time * 4) * 0.3;
      ctx.strokeStyle = `rgba(244, 200, 91, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy + 4, e.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      lights.push({ x: e.pos.x, y: e.pos.y, radius: 130, color: "#ff5060", intensity: 0.72 });
    }

    const { canvas: spr, flipX } = getEnemyFrame(e, g.time);
    ctx.translate(Math.round(sx), Math.round(sy));
    if (e.koTimer > 0) {
      ctx.rotate((1 - alpha) * 0.8);
    }
    ctx.scale((flipX ? -1 : 1) * e.squashX, e.squashY);
    if (e.hitFlash > 0) {
      ctx.filter = "brightness(2.8) saturate(0.2)";
    }
    ctx.drawImage(spr, -sprScale / 2, -sprScale / 2 - 4, sprScale, sprScale);
    ctx.restore();

    // Enemy nameplate & HP bar
    if (e.koTimer <= 0 && (e.hp < e.maxHp || e.isBoss)) {
      const bw = e.isBoss ? 68 : 38;
      const bh = e.isBoss ? 6 : 4;
      const bx = Math.round(sx - bw / 2);
      const by = Math.round(sy - sprScale / 2 - 12);
      ctx.fillStyle = "#080604";
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = e.isBoss ? "#ff3850" : "#44d464";
      ctx.fillRect(bx, by, Math.round((bw * Math.max(0, e.hp)) / e.maxHp), bh);
      if (e.isBoss) {
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#080604";
        ctx.fillText(e.name, sx + 1, by - 5);
        ctx.fillStyle = "#f4c85b";
        ctx.fillText(e.name, sx, by - 6);
      }
    }
  }

  // Player sprite
  const p = g.player;
  const psx = Math.round(p.pos.x - camX);
  const psy = Math.round(p.pos.y - camY);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.beginPath();
  ctx.ellipse(psx, psy + 15, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const { canvas: pSpr, flipX: pFlip } = getPlayerFrame(
    p.cls,
    p.facingDir,
    p.action,
    g.time,
    p.actionTimer,
    p.walkCycle,
  );
  ctx.translate(psx, psy);
  ctx.scale((pFlip ? -1 : 1) * p.squashX, p.squashY);
  if (p.hitFlash > 0) {
    ctx.filter = "brightness(2.5) saturate(0.4)";
  }
  ctx.drawImage(pSpr, -26, -30, 52, 52);
  ctx.restore();

  // Invulnerability / shield aura
  if (p.invuln > 0.6) {
    ctx.strokeStyle = "rgba(255, 240, 140, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(psx, psy, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. Pass: Slash Arcs, Shockwaves, Projectiles, Pooled Particles
  for (const arc of g.slashArcs) {
    const sx = arc.x - camX;
    const sy = arc.y - camY;
    const alpha = Math.max(0, arc.life / arc.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = arc.heavy ? 8 : 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(sx, sy, arc.radius * (0.85 + (1 - alpha) * 0.22), arc.angle - arc.arc / 2, arc.angle + arc.arc / 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, arc.radius * (0.85 + (1 - alpha) * 0.22), arc.angle - arc.arc / 3, arc.angle + arc.arc / 3);
    ctx.stroke();
    ctx.restore();
  }

  for (const wv of g.shockwaves) {
    const sx = wv.x - camX;
    const sy = wv.y - camY;
    ctx.save();
    ctx.globalAlpha = Math.max(0, wv.life / wv.maxLife);
    ctx.strokeStyle = wv.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, wv.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const pr of g.projectiles) {
    const sx = pr.pos.x - camX;
    const sy = pr.pos.y - camY;
    lights.push({ x: pr.pos.x, y: pr.pos.y, radius: 64, color: pr.color, intensity: 0.65 });
    ctx.save();
    ctx.fillStyle = pr.color;
    if (pr.kind === "arrow") {
      const ang = Math.atan2(pr.vel.y, pr.vel.x);
      ctx.translate(sx, sy);
      ctx.rotate(ang);
      ctx.fillStyle = "#8a5a2b";
      ctx.fillRect(-10, -1, 16, 2);
      ctx.fillStyle = pr.color;
      ctx.fillRect(4, -3, 6, 6);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Pooled particles
  for (const pt of g.particles) {
    if (!pt.active) continue;
    const sx = pt.x - camX;
    const sy = pt.y - camY;
    if (sx < -16 || sy < -16 || sx > w + 16 || sy > h + 16) continue;
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(sx - pt.size / 2), Math.round(sy - pt.size / 2), Math.ceil(pt.size), Math.ceil(pt.size));
  }
  ctx.globalAlpha = 1;

  // Falling meteors
  for (const m of g.meteors) {
    const sx = m.x - camX;
    const sy = m.y - camY;
    lights.push({ x: m.x, y: m.y, radius: 130, color: "#ff7830", intensity: 0.9 });
    ctx.fillStyle = "#ff6820";
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff098";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Pass: Real-time Dynamic Lighting
  renderDynamicLighting(ctx, g, camX, camY, w, h, lights);

  // 8. Pass: Overworld Landmark & City Labels (crisp pixel tags above lighting)
  if (!inCave && !inGrand) {
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    for (const lm of g.world.landmarks) {
      const sx = lm.x - camX;
      const sy = lm.y - camY - 30;
      if (sx < -120 || sy < -40 || sx > w + 120 || sy > h + 40) continue;
      const tw = ctx.measureText(lm.name).width + 16;
      ctx.fillStyle = "rgba(12, 9, 7, 0.84)";
      ctx.fillRect(Math.round(sx - tw / 2), Math.round(sy - 11), Math.round(tw), 18);
      ctx.strokeStyle = lm.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(sx - tw / 2) + 0.5, Math.round(sy - 11) + 0.5, Math.round(tw) - 1, 17);
      ctx.fillStyle = "#f7ead0";
      ctx.fillText(lm.name, Math.round(sx), Math.round(sy + 2));
    }
  }

  // 9. Pass: Floating Damage & Pickup Numbers
  ctx.textAlign = "center";
  for (const f of g.floaters) {
    const sx = Math.round(f.x - camX);
    const sy = Math.round(f.y - camY);
    const alpha = Math.min(1, (f.life / f.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(13 * f.scale)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "#080604";
    ctx.fillText(f.text, sx + 1, sy + 1);
    ctx.fillText(f.text, sx - 1, sy);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, sx, sy);
  }
  ctx.globalAlpha = 1;
}
