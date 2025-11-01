import { world, system } from "@minecraft/server";

let query = [];

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const block = event.block;

  if (block.typeId === "custom:tnt") {
    query.push({
      block: block,
      dimension: block.dimension,
    });
  }
});

const directions = [
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
    query2.push(query.shift());
  }

  while (query2.length > 0) {
    const now = query2.shift();
    const pos = now.block.location;
    const dim = now.dimension;

    for (let dir of directions) {
      const newPos = {
        x: pos.x + dir.x,
        y: pos.y + dir.y,
        z: pos.z + dir.z,
      };

      const blockAtNewPos = dim.getBlock(newPos);

      if (
        blockAtNewPos &&
        blockAtNewPos.typeId !== "minecraft:tnt" &&
        blockAtNewPos.typeId !== "minecraft:air"
      ) {
        dim.setBlockType(newPos, "minecraft:tnt");
        query.push({
          block: dim.getBlock(newPos),
          dimension: dim,
        });
      }
    }
  }
}); // 拡散速度（ms間隔、必要に応じて調整）
