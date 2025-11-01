import { world, system, BlockPermutation } from "@minecraft/server"

const INTERVAL_SEC = 0.1 // 0.1秒ごとにチェック
const CHECK_RADIUS = 4   // プレイヤーの周囲半径4ブロック
const BREAK_DELAY_TICK = 100 // 5秒 = 100tick

system.runInterval(() => {
  const players = world.getAllPlayers()

  for (const player of players) {
    const dimension = player.dimension
    const loc = player.location
    const px = Math.floor(loc.x)
    const py = Math.floor(loc.y)
    const pz = Math.floor(loc.z)

    // プレイヤー周囲をスキャン
    for (let dx = -CHECK_RADIUS; dx <= CHECK_RADIUS; dx++) {
      for (let dy = -CHECK_RADIUS; dy <= CHECK_RADIUS; dy++) {
        for (let dz = -CHECK_RADIUS; dz <= CHECK_RADIUS; dz++) {
          const x = px + dx
          const y = py + dy
          const z = pz + dz

          const block = dimension.getBlock({ x, y, z })
          if (block && block.typeId === "minecraft:stone") {
            // 5秒後に石を壊す
            setTimeout(() => {
              if (dimension.getBlock({ x, y, z }).typeId === "minecraft:stone") {
                dimension.setBlockPermutation({ x, y, z }, BlockPermutation.resolve("minecraft:air"))
              }
            }, BREAK_DELAY_TICK * 50) // 1tick ≒ 50ms
          }
        }
      }
    }
  }
}, INTERVAL_SEC * 20)
