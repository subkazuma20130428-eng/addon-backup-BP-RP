import { world, system, ItemUseAfterEvent } from "@minecraft/server";

// アイテム使用イベントを登録
world.afterEvents.itemUse.subscribe((event) => {
    const { source: player, itemStack } = event;

    // 棒を持っているかチェック
    if (itemStack.typeId === "minecraft:stick") {
        // プレイヤーの向いている方向を取得
        const viewDir = player.getViewDirection();

        // 50ブロック先の座標を計算
        const tpPos = {
            x: player.location.x + viewDir.x * 50,
            y: player.location.y + viewDir.y * 50,
            z: player.location.z + viewDir.z * 50
        };

        // テレポート実行
        player.teleport(tpPos, {
            dimension: player.dimension,
            keepVelocity: false
        });

        // 効果音を鳴らす（おまけ）
        player.dimension.playSound("random.enderman_portal", tpPos);
    }
});
