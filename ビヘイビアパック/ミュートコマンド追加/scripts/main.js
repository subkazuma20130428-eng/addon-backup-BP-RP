import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// --- Muteリスト管理 ---
function getMuteList() {
    let mute = world.getDynamicProperty("mute");
    if (typeof mute !== "string") mute = "[]";
    try {
        const list = JSON.parse(mute);
        if (!Array.isArray(list)) return [];
        return list;
    } catch {
        return [];
    }
}

function setMuteList(list) {
    world.setDynamicProperty("mute", JSON.stringify(list));
}

// --- コマンド登録 ---
system.beforeEvents.startup.subscribe(ev => {
    // muteコマンド（管理者が対象プレイヤーを指定）
    ev.customCommandRegistry.registerCommand({
        name: "c:mute",
        description: "指定したプレイヤーをミュートします。",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }]
    }, (r, p) => {
        if (r.sourceEntity.typeId !== "minecraft:player") return { status: -1 };
        if (p.length !== 1) return r.sourceEntity.sendMessage("§cプレイヤーは1人だけ指定してください。");

        const player = p[0];
        const mutes = getMuteList();
        if (mutes.includes(player.name)) {
            return r.sourceEntity.sendMessage(`§c${player.name}はすでにミュートされています。`);
        }
        mutes.push(player.name);
        setMuteList(mutes);

        r.sourceEntity.sendMessage(`§e${player.name}をミュートしました。`);
        player.sendMessage("§cあなたはミュートされました。");
    });

    // unmuteコマンド（管理者が対象プレイヤーを指定）
    ev.customCommandRegistry.registerCommand({
        name: "c:unmute",
        description: "指定したプレイヤーのミュートを解除します。",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [{ name: "target", type: CustomCommandParamType.PlayerSelector }]
    }, (r, p) => {
        if (r.sourceEntity.typeId !== "minecraft:player") return { status: -1 };
        if (p.length !== 1) return r.sourceEntity.sendMessage("§cプレイヤーは1人だけ指定してください。");

        const player = p[0];
        let mutes = getMuteList();
        const index = mutes.indexOf(player.name);
        if (index === -1) return r.sourceEntity.sendMessage(`§c${player.name}はミュートされていません。`);

        mutes.splice(index, 1);
        setMuteList(mutes);
        r.sourceEntity.sendMessage(`§a${player.name}のミュートを解除しました。`);
        player.sendMessage("§aあなたのミュートが解除されました。");
    });

    // mutelistコマンド
    ev.customCommandRegistry.registerCommand({
        name: "c:mutelist",
        description: "現在ミュートされているプレイヤーの一覧を表示します。",
        permissionLevel: CommandPermissionLevel.Admin
    }, (r) => {
        if (r.sourceEntity.typeId !== "minecraft:player") return { status: -1 };
        const admin = r.sourceEntity;

        system.run(() => {
            let mutes = getMuteList();
            const form = new ActionFormData().title("Muteリスト");

            if (mutes.length === 0) {
                form.body("現在ミュートされているプレイヤーはいません。");
            } else {
                mutes.forEach(name => form.button(name));
            }

            form.show(admin).then(resp => {
                if (resp.canceled) return;
                const selected = mutes[resp.selection];
                if (!selected) return;

                const confirm = new ActionFormData()
                    .title(`${selected}を選択中`)
                    .body("このプレイヤーのミュートを解除しますか？")
                    .button("はい").button("いいえ");

                confirm.show(admin).then(res => {
                    if (res.canceled) return;
                    if (res.selection === 0) {
                        mutes = getMuteList();
                        const idx = mutes.indexOf(selected);
                        if (idx !== -1) {
                            mutes.splice(idx, 1);
                            setMuteList(mutes);
                            admin.sendMessage(`§a${selected}のミュートを解除しました。`);
                        }
                    }
                });
            });
        });
    });
});

// --- チャット制御 ---
world.beforeEvents.chatSend.subscribe(ev => {
    const mutes = getMuteList();
    if (mutes.includes(ev.sender.name)) {
        ev.cancel = true;
        ev.sender.sendMessage("§cあなたは現在ミュートされています。");
    }
});
