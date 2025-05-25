import { Vec3 } from 'vec3'
import { Block } from 'prismarine-block'

export const check = (bot: import('mineflayer').Bot, from: Vec3, to: Vec3): Block | null => {
  const range = from.distanceTo(to)
  const direction = to.minus(from)
  return bot.world.raycast(from, direction.normalize(), range)
}
