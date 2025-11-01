import { world, system } from "@minecraft/server";

let query = [];

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const block = event.block;

  if (block.typeId === "custom:mizu_tunami") {
    query.push({
      block: block,
      dimension: block.dimension,
    });
  }
});

const direction = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

let query2 = [];

system.runInterval(() => {
  // query を query2 に移す
  while (query.length > 0) {
    const nowBlock = query.shift();
    query2.push(nowBlock);
  }

  while (query2.length > 0) {
    const nowBlock = query2.shift();
    const pos = nowBlock.block.location;
    const dimension = nowBlock.dimension;

    for (let dir of direction) {
      const newPos = {
        x: pos.x + dir.x,
        y: pos.y + dir.y,
        z: pos.z + dir.z,
      };

      const blockAtNewPos = dimension.getBlock(newPos);

      if (blockAtNewPos && blockAtNewPos.typeId !== "minecraft:water") {
        dimension.setBlockType(newPos, "minecraft:water");
        query.push({
          block: dimension.getBlock(newPos),
          dimension: dimension,
        });
      }
    }
  }
},8); // 5msごとに実行（必要に応じて調整）
