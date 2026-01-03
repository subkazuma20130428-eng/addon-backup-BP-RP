import { world, system, EquipmentSlot } from "@minecraft/server";

// ===============================
// 共通変数
// ===============================
const wasOnGround = new Map();
const doubled = new Set();
const waterTime = new Map();
const waterWarn = new Map(); // ★警告表示用
let zombieTimer = 0;

// ===============================
// メインループ（毎tick）
// ===============================
system.runInterval(() => {
  zombieTimer++;

  for (const player of world.getPlayers()) {

    // ===== ホットバー縛り =====
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (inv) {
      for (let slot = 9; slot < inv.size; slot++) {
        const item = inv.getItem(slot);
        if (!item) continue;

        const dir = player.getViewDirection();
        player.dimension.spawnItem(item, {
          x: player.location.x + dir.x * 3,
          y: player.location.y + 1,
          z: player.location.z + dir.z * 3
        });
        inv.setItem(slot, null);
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

    // ===== fireタグ持ちは燃える =====
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
    // 水システム（1分 = 1200tick）
    // ===============================
    const t = (waterTime.get(player.id) ?? 0) + 1;
    waterTime.set(player.id, t);

    // 鈍足付与
    if (t >= 1200 && !player.hasTag("water_ok")) {
      player.addEffect("slowness", 40, {
        amplifier: 1,
        showParticles: false
      });

      // ★警告表示（5秒おき）
      const w = (waterWarn.get(player.id) ?? 0) + 1;
      waterWarn.set(player.id, w);

      if (w >= 100) { // 5秒
        player.sendMessage("§c水入り瓶を飲みましょう！");
        waterWarn.set(player.id, 0);
      }
    } else {
      waterWarn.set(player.id, 0);
    }
  }

  if (zombieTimer >= 600) zombieTimer = 0;

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
// 水入り瓶を「飲んだら」回復
// ===============================
world.afterEvents.itemUse.subscribe(ev => {
  const player = ev.source;
  const item = ev.itemStack;

  if (!player || player.typeId !== "minecraft:player") return;
  if (item.typeId !== "minecraft:potion") return;

  // 鈍足解除 & タイマーリセット
  player.removeEffect("slowness");
  player.addTag("water_ok");
  waterTime.set(player.id, 0);
  waterWarn.set(player.id, 0);

  player.sendMessage("§b水を飲んだ！");
});

// ===============================
// 10秒ごとにTNTを降らせる
// ===============================
let tntTimer = 0;

system.runInterval(() => {
  tntTimer++;

  // 10秒 = 200tick
  if (tntTimer < 200) return;

  for (const player of world.getPlayers()) {
    const { x, y, z } = player.location;

    // プレイヤーの頭上にTNT
    player.dimension.runCommand(
      `summon tnt ${x} ${y + 10} ${z}`
    );
  }

  tntTimer = 0;
}, 1);

