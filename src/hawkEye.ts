import { Projectil } from './types'
import { Vec3 } from 'vec3'
import { v4 as uuidv4 } from 'uuid';

const currentProjectileDetected: Record<string, Projectil> = {}

export const detectProjectiles = (bot: import('mineflayer').Bot, projectile: string = 'arrow') => {
  const ArrayEntities = Object.values(bot.entities)
  const projectiles = ArrayEntities.filter((e) => e.name === projectile && e.type === "projectile")

  const updatedAt = Date.now()

  projectiles.forEach((e) => {
    if (!e.uuid) {
      e.uuid = uuidv4()
    }

    if (!currentProjectileDetected[e.uuid]) {
      currentProjectileDetected[e.uuid] = {
        uuid: e.uuid,
        entity: e,
        enabled: true,
        currentSpeed: 0,
        currentSpeedTime: Date.now(),
        previusPositions: [],
        updatedAt
      }
    } else {
      currentProjectileDetected[e.uuid].updatedAt = updatedAt
    }

    // if (currentProjectileDetected[e.uuid].previusPositions.length > 3) { currentProjectileDetected[e.uuid].previusPositions.shift() }
    currentProjectileDetected[e.uuid].previusPositions.push({
      at: Date.now(),
      pos: e.position.clone()
    })
  })

  Object.entries(currentProjectileDetected)
    .forEach(e => {
      const [uuid, arrow] = e
      if (arrow.updatedAt !== updatedAt) {
        delete currentProjectileDetected[uuid]
      }
    })

  const arrowsInAir: Array<Projectil> = []

  Object.entries(currentProjectileDetected)
    .filter(e => e[1].enabled)
    .forEach((e) => {

      const [uuid, projectil] = e
      const speed = new Vec3(0, 0, 0)

      const previusPositions = projectil.previusPositions

      const totalItemsToCatch = 3
      const start = previusPositions.length >= totalItemsToCatch ? previusPositions.length - totalItemsToCatch : 0
      const previusPositionsTocheck = previusPositions.slice(start)

      for (let i = 1; i < previusPositionsTocheck.length; i++) {
        const pos = previusPositionsTocheck[i]
        const prevPos = previusPositionsTocheck[i - 1]
        speed.x += Math.abs(pos.pos.x - prevPos.pos.x)
        speed.y += Math.abs(pos.pos.y - prevPos.pos.y)
        speed.z += Math.abs(pos.pos.z - prevPos.pos.z)
      }

      speed.x = speed.x / previusPositionsTocheck.length
      speed.y = speed.y / previusPositionsTocheck.length
      speed.z = speed.z / previusPositionsTocheck.length

      const currentSpeed = speed.x + speed.y + speed.z
      if (currentSpeed !== projectil.currentSpeed) {
        projectil.currentSpeed = currentSpeed <= 3 ? currentSpeed : 3
        projectil.currentSpeedTime = Date.now()
      }

      if (projectil.currentSpeed === 0 && Date.now() - projectil.currentSpeedTime > 1500) {
        projectil.enabled = false
      } else {
        arrowsInAir.push(projectil)
      }
    })

  return arrowsInAir

}
