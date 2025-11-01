var system = server.registerSystem(0, 0);

system.initialize = function() {
    // HUB掲示板を設置
    this.createBoard();
};

system.createBoard = function() {
    var dim = this.getDimension("overworld");
    var baseX = -171, baseY = 65, baseZ = 116;
    var lines = [
        "§l§f----- お知らせ -----",
        "§aようこそ！",
        "§e公式Discordはこちら ↓",
        "§9discord.gg/abc123",
        "§7最新情報をチェック！"
    ];

    for (var i = 0; i < lines.length; i++) {
        var entity = this.spawnEntity(dim, "minecraft:armor_stand", {x: baseX, y: baseY - i * 0.3, z: baseZ});
        this.setEntityNameTag(entity, lines[i]);
        this.setEntityTag(entity, "notice_board");
        this.makeEntityInvisible(entity);
        this.setEntityInvulnerable(entity);
    }
};

// ネームタグを設定
system.setEntityNameTag = function(entity, name) {
    entity.nameTag = name;
};

// 無敵化
system.setEntityInvulnerable = function(entity) {
    entity.setDynamicProperty("invulnerable", true);
};

// 透明化（小型化などの見た目調整は制限あり）
system.makeEntityInvisible = function(entity) {
    entity.setDynamicProperty("minecraft:invisible", true);
};

// Entity生成
system.spawnEntity = function(dim, type, pos) {
    return this.createEntity(type, pos, dim);
};
