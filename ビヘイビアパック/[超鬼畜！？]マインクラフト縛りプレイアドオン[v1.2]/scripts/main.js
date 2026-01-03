import { world, system, EquipmentSlot } from "@minecraft/server";

// ===============================
// 変数
// ===============================
const wasOnGround = new Map();
const doubled = new Set();
const waterTime = new Map();
const waterWarn = new Map();

let zombieTimer = 0;
let tntTimer = 0;

// ===============================
// メインループ（1tick）
// ===============================
system.runInterval(() => {
  zombieTimer++;
  tntTimer++;

  for (const player of world.getPlayers()) {

// ===== ホットバー縛り（空きがあれば入れる）=====
const inv = player.getComponent("minecraft:inventory")?.container;
if (inv) {
  for (let slot = 9; slot < inv.size; slot++) {
    const item = inv.getItem(slot);
    if (!item) continue;

    let moved = false;

    // ホットバーの空きを探す
    for (let hotbar = 0; hotbar <= 8; hotbar++) {
      if (!inv.getItem(hotbar)) {
        inv.setItem(hotbar, item);
        inv.setItem(slot, null);
        moved = true;
        break;
      }
    }

    // ホットバーが満杯ならドロップ
    if (!moved) {
      const dir = player.getViewDirection();
      player.dimension.spawnItem(item, {
        x: player.location.x + dir.x * 3,
        y: player.location.y + 1,
        z: player.location.z + dir.z * 3
      });
      inv.setItem(slot, null);
    }
  }
}

    // ===== ジャンプダメージ =====
    const health = player.getComponent("minecraft:health");
    const onGround = player.isOnGround;
    const last = wasOnGround.get(player.id);

    if (health.currentValue > 1 && last === true && onGround === false) {
      player.applyDamage(1);
    }
    wasOnGround.set(player.id, onGround);

    // ===== 防具チェック =====
    const equip = player.getComponent("minecraft:equippable");
    const hasArmor =
      equip.getEquipment(EquipmentSlot.Head) ||
      equip.getEquipment(EquipmentSlot.Chest) ||
      equip.getEquipment(EquipmentSlot.Legs) ||
      equip.getEquipment(EquipmentSlot.Feet);

    // ===== fireタグ =====
    if (player.hasTag("fire") && !hasArmor) {
      player.setOnFire(1);
    }

    // ===== ゾンビ降下（30秒）=====
    if (zombieTimer >= 600) {
      for (let i = 0; i < 3; i++) {
        player.dimension.spawnEntity("minecraft:zombie", {
          x: player.location.x + (Math.random() * 6 - 3),
          y: player.location.y + 20,
          z: player.location.z + (Math.random() * 6 - 3)
        });
      }
    }

    // ===============================
    // 水システム（70秒 = 1400tick）
    // ===============================
    const t = (waterTime.get(player.id) ?? 0) + 1;
    waterTime.set(player.id, t);

    if (t >= 1400) {
      player.addEffect("slowness", 40, {
        amplifier: 1,
        showParticles: false
      });

      const w = (waterWarn.get(player.id) ?? 0) + 1;
      waterWarn.set(player.id, w);

      if (w >= 100) { // 5秒
        player.sendMessage("§c水入り瓶を飲みましょう！");
        waterWarn.set(player.id, 0);
      }
    } else {
      waterWarn.set(player.id, 0);
    }

    // ===== TNT（10秒ごと）=====
    if (tntTimer >= 200) {
      const { x, y, z } = player.location;
      player.dimension.runCommand(`summon tnt ${x} ${y + 10} ${z}`);
    }
  }

  if (zombieTimer >= 600) zombieTimer = 0;
  if (tntTimer >= 200) tntTimer = 0;

  // ===== MOB HP2倍 =====
  for (const entity of world.getAllEntities()) {
    if (entity.typeId === "minecraft:player") continue;
    if (doubled.has(entity.id)) continue;

    const hp = entity.getComponent("minecraft:health");
    if (!hp) continue;

    const max = hp.defaultValue * 2;
    hp.setMaxValue(max);
    hp.setCurrentValue(max);
    doubled.add(entity.id);
  }
}, 1);

// ===============================
// 水入り瓶を「飲み終わったら」
// ===============================
world.afterEvents.itemCompleteUse.subscribe(ev => {
  const player = ev.source;
  const item = ev.itemStack;

  if (!player || player.typeId !== "minecraft:player") return;
  if (item.typeId !== "minecraft:potion") return;

  player.removeEffect("slowness");
  waterTime.set(player.id, 0);
  waterWarn.set(player.id, 0);

  player.sendMessage("§b水を飲んだ！");
});
