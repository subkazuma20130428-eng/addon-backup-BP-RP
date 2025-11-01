import { world, system } from "@minecraft/server";

let query = [];

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const block = event.block;

  if (block.typeId === "custom:fushoku") {
    query.push({
      block: block,
      dimension: block.dimension, // 追加
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
  while (query.length > 0) {
    const nowBlock = query.shift();
    query2.push(nowBlock);
  }

  while (query2.length > 0) {
    const nowBlock = query2.shift();
    const pos = nowBlock.block.location;
    const dimension = nowBlock.dimension; // 追加

    for (let dir of direction) {
      const newPos = {
        x: pos.x + dir.x,
        y: pos.y + dir.y,
        z: pos.z + dir.z,
      };

      const blockAtNewPos = dimension.getBlock(newPos);

      if (
        blockAtNewPos &&
        blockAtNewPos.typeId !== "custom:fushoku" &&
        blockAtNewPos.typeId !== "minecraft:air"
      ) {
        dimension.setBlockType(newPos, "custom:fushoku");
        query.push({
          block: blockAtNewPos,
          dimension: dimension, // 追加
        });
      }
    }

    system.runTimeout(() => {
      const now = dimension.getBlock(pos);
      if (now && now.typeId === "custom:fushoku") {
        dimension.setBlockType(pos, "minecraft:air");
      }
    });
  }
});
