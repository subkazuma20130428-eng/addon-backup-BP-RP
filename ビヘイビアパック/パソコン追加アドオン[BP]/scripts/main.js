import * as server from "@minecraft/server";
import * as ui from "@minecraft/server-ui";

server.world.afterEvents.itemUse.subscribe(ev => {
    if (ev.itemStack.typeId == "c:mausu"){
        let player = ev.source;
        show_form(player);
    }
});

function show_form(player){
    const form = new ui.ActionFormData();
    form.title("PC");
    form.button("ハッキング（周囲のドアにレッドストーン）");
    form.button("全員にメッセージ送信");
    form.button("戻る");
    form.show(player).then((response) => {
        switch(response.selection){
            case 0:
                hack_nearby_doors(player);
                break;
            case 1:
                player.sendMessage("全員にメッセージを送信しました。");
                server.world.sendMessage("管理者からのお知らせです！");
                break;
            case 2:
                // 戻る（何もしない or メニュー再表示など）
                break;
            default:
                player.sendMessage("何も選択していません。");
                break;
        }
    }).catch(error =>
        player.sendMessage("An error occurred: " + error.message)
    );
}

// 周囲5ブロック以内のドアの下にレッドストーンブロックを設置
function hack_nearby_doors(player) {
    const DOOR_IDS = [
        "minecraft:iron_door",
        "minecraft:wooden_door",
        "minecraft:birch_door",
        "minecraft:spruce_door",
        "minecraft:jungle_door",
        "minecraft:acacia_door",
        "minecraft:dark_oak_door",
        "minecraft:mangrove_door",
        "minecraft:bamboo_door",
        "minecraft:cherry_door",
        "minecraft:crimson_door",
        "minecraft:warped_door",
        "minecraft:pale_oak_door",
        "minecraft:copper_door",
        "minecraft:exposed_copper_door",
        "minecraft:weathered_copper_door",
        "minecraft:oxidized_copper_door"
    ];
    const radius = 5;
    const loc = player.location;
    let powered = 0;
    let poweredBlocks = [];

    // ハッキング進捗バー
    let percent = 0;
    let intervalId = server.system.runInterval(() => {
        percent += 10;
        let bar = "§4ハッキング中 " + percent + "% " + ".".repeat(percent / 10) + " ".repeat(10 - percent / 10);
        player.sendMessage(bar);
        if (percent >= 100) {
            server.system.clearRun(intervalId);

            // ドアの下にレッドストーンブロック設置
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dz = -radius; dz <= radius; dz++) {
                        const x = Math.floor(loc.x + dx);
                        const y = Math.floor(loc.y + dy);
                        const z = Math.floor(loc.z + dz);
                        const block = player.dimension.getBlock({x, y, z});
                        if (!block) continue;
                        if (DOOR_IDS.includes(block.typeId)) {
                            const underBlock = player.dimension.getBlock({x, y: y - 2, z});
                            if (underBlock && underBlock.typeId !== "minecraft:redstone_block") {
                                try {
                                    underBlock.setType("minecraft:redstone_block");
                                    poweredBlocks.push({x, y: y - 2, z, dimension: player.dimension});
                                    powered++;
                                } catch (e) {}
                            }
                        }
                    }
                }
            }
            if (powered > 0) {
                player.sendMessage(`ハッキング成功！周囲のドア${powered}個のシステムをダウンさせました！`);
                // 10秒後に草ブロックに戻し、ドアを閉じる
                server.system.runTimeout(() => {
                    for (const pos of poweredBlocks) {
                        const block = pos.dimension.getBlock({x: pos.x, y: pos.y, z: pos.z});
                        if (block && block.typeId === "minecraft:redstone_block") {
                            block.setType("minecraft:grass");
                        }
                        // ドアを閉じる
                        const doorBlock = pos.dimension.getBlock({x: pos.x, y: pos.y + 2, z: pos.z});
                        if (doorBlock && DOOR_IDS.includes(doorBlock.typeId)) {
                            try {
                                doorBlock.setPermutation(doorBlock.permutation.with("open_bit", false));
                            } catch (e) {}
                        }
                    }
                    player.sendMessage("システムが復旧してしまいました");
                }, 280); // 15秒
            } else {
                player.sendMessage("周囲5ブロック以内にハッキングできるドアはありませんでした。");
            }
        }
    }, 15); // 0.2秒ごとに進捗（合計2秒で100%）
}