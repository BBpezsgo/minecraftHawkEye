import { isEntity, OptionsMasterGrade, Projectil, Weapons, weaponsProps } from './types'
import { Vec3 } from 'vec3'
import getMasterGrade from './hawkEyeEquations'
import { Entity } from 'prismarine-entity'
import { v4 as uuidv4 } from 'uuid';
import { bot } from './loadBot'

let target: Entity | OptionsMasterGrade
let preparingShot: boolean
let preparingShotTime: number
let prevPlayerPositions: Array<Vec3> = []
let oneShot: boolean
let chargingArrow: boolean
let weapon: Weapons = Weapons.bow
let infoShot: ReturnType<typeof getMasterGrade>

export const autoAttack = (targetToAttack: Entity | OptionsMasterGrade, inputWeapon = Weapons.bow, isOneShot = false) => {
  if (!targetToAttack) {
    return false
  }
  oneShot = isOneShot

  target = targetToAttack
  preparingShot = false
  prevPlayerPositions = []
  weapon = inputWeapon

  bot.on('physicsTick', getGrades)
  bot.on('physicsTick', autoCalc)
  return true
}

export const stop = () => {

  bot.deactivateItem()
  bot.removeListener('physicsTick', getGrades)
  bot.removeListener('physicsTick', autoCalc)
  bot.emit('auto_shot_stopped', target)
}

const getGrades = () => {
  if (target === undefined || (isEntity(target) && !target.isValid)) {
    stop()
    return
  }

  if (prevPlayerPositions.length > 10) { prevPlayerPositions.shift() }

  const position = target.position.clone()

  prevPlayerPositions.push(position)

  const speed = new Vec3(0, 0, 0)

  for (let i = 1; i < prevPlayerPositions.length; i++) {
    const pos = prevPlayerPositions[i]
    const prevPos = prevPlayerPositions[i - 1]
    speed.x += pos.x - prevPos.x
    speed.y += pos.y - prevPos.y
    speed.z += pos.z - prevPos.z
  }

  speed.x = speed.x / prevPlayerPositions.length
  speed.y = speed.y / prevPlayerPositions.length
  speed.z = speed.z / prevPlayerPositions.length

  infoShot = getMasterGrade(target, speed, weapon)
}

const autoCalc = async () => {
  const waitTime = weaponsProps[weapon].waitTime

  const slotID = bot.getEquipmentDestSlot('hand')
  if (bot.inventory.slots[slotID] === null || bot.inventory.slots[slotID]?.name !== weapon) {
    const weaponFound = bot.inventory.items().find(item => item.name === weapon)
    if (weaponFound) {
      try {
        await bot.equip(weaponFound, 'hand')
        return
      } catch (err) {
        await sleep(500)
        return
      }
    } else {
      stop()
      return
    }
  }

  if (!preparingShot) {
    if (['bow', 'crossbow', 'trident'].includes(weapon)) {
      bot.activateItem()
    }
    preparingShot = true
    preparingShotTime = Date.now()
  }

  if (infoShot) {
    bot.look(infoShot.yaw, infoShot.pitch, true)

    if (preparingShot) {
      if (['bow', 'trident'].includes(weapon) && Date.now() - preparingShotTime > waitTime) {
        bot.deactivateItem()
        preparingShot = false
        if (oneShot) {
          stop()
        }
      }

      if (['snowball', 'ender_pearl', 'egg', 'splash_potion'].includes(weapon) && Date.now() - preparingShotTime > waitTime) {
        bot.swingArm('left')
        bot.activateItem()
        bot.deactivateItem()
        preparingShot = false
        if (oneShot) {
          stop()
        }
      }

      if (weapon === 'crossbow') {
        shotCrossbow()
      }
    }
  }
}

const shotCrossbow = () => {
  if (chargingArrow) {
    bot.activateItem()
    bot.deactivateItem()
    chargingArrow = false
    preparingShot = false
    if (oneShot) {
      stop()
    }
    return
  }

  if (bot.heldItem === null) {
    stop()
    return
  }

  // @ts-ignore pending to fix types from core
  const isEnchanted = bot.heldItem.nbt.value.Enchantments ? bot.heldItem.nbt.value.Enchantments.value.value.find(enchant => enchant.id.value === 'quick_charge') : undefined
  const shotIn = 1250 - ((isEnchanted ? isEnchanted.lvl.value : 0) * 250)

  if (weapon === 'crossbow' && !chargingArrow && Date.now() - preparingShotTime > shotIn) {
    bot.deactivateItem()
    chargingArrow = true
  }
}

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}




const currentProjectileDetected: Record<string, Projectil> = {}
export const detectProjectiles = (projectile: string = 'arrow') => {
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