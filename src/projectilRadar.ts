
import { Box, Line, System, Vector } from "detect-collisions"
import { Vec3 } from "vec3"
import { BoxColission, Weapons } from "./types"
import { Entity } from 'prismarine-entity'
import { calculateArrowTrayectory } from "./calculateArrowTrayectory"
import { calculateDestinationByYaw, calculateImpactToBoundingBox, calculateYaw, calculayePitch, getBoxes } from "./mathHelper"
import { detectProjectiles } from './hawkEye'

const DISTANCE_VISION = 100

export const trajectoryCollisions = (bot: import('mineflayer').Bot, trajectory: Vec3[], entities: Entity[]) => {
    if (!bot.entity) return

    const boxes = entities.map(v => getEntityHitbox(v, 0.5))
    let prevArrow: Vec3 | undefined

    for (const trajectoryPoint of trajectory) {
        if (!prevArrow) {
            prevArrow = trajectoryPoint
            continue
        }

        for (const box of boxes) {
            const colission = calculateImpactToBoundingBox(prevArrow, trajectoryPoint, box)
            if (colission) {
                return true
            }
        }

        prevArrow = trajectoryPoint
    }

    return false
}

const radar = (bot: import('mineflayer').Bot) => {
    if (!bot.entity) return

    const detectedEntities = detectAim(bot)
    const botBoxes = getEntityHitbox(bot.entity, 0.5)
    let prevArrow: Vec3 | undefined

    Object.values(detectedEntities).forEach(e => {
        prevArrow = undefined

        e.prevTrajectory.forEach((arrowTrajectory) => {

            if (!prevArrow) {
                prevArrow = arrowTrajectory
                return
            }

            const colission = calculateImpactToBoundingBox(prevArrow, arrowTrajectory, botBoxes)

            if (colission) {
                bot.emit('target_aiming_at_you', e.entity, e.prevTrajectory)
            }

            prevArrow = arrowTrajectory
        })
    })

    const projectiles = detectProjectiles(bot)
    projectiles.forEach(p => {
        if (p.previusPositions.length < 2) return

        const lastItem = p.previusPositions[p.previusPositions.length - 1]
        const lastItem2 = p.previusPositions[p.previusPositions.length - 2]

        if (lastItem.pos.equals(lastItem2.pos)) {
            return
        }

        const yaw = calculateYaw(lastItem2.pos, lastItem.pos)
        const pitch = calculayePitch(lastItem2.pos, lastItem.pos)

        const arrowTrajectoryPoints = bot.hawkEye.calculateArrowTrayectory(lastItem.pos, p.currentSpeed, pitch, yaw, Weapons.bow).arrowTrajectoryPoints
        if (arrowTrajectoryPoints.length < 2) return

        for (let pi = 1; pi < arrowTrajectoryPoints.length; pi++) {
            const prevousArrow = arrowTrajectoryPoints[pi - 1]
            const currentArrow = arrowTrajectoryPoints[pi]

            const colission = calculateImpactToBoundingBox(prevousArrow, currentArrow, botBoxes)

            if (colission) {
                bot.emit('incoming_projectil', p, arrowTrajectoryPoints)
                return
            }

        }

    })
}

export const detectAim = (bot: import('mineflayer').Bot) => {
    const system = new System();
    const { boxXZ } = getBoxes(getEntityHitbox(bot.entity, 0.5))
    const entities = Object.values(bot.entities)
        // @ts-ignore metadata loading bow
        .filter((e) => (e.type === "player" && (e.metadata[8] === 1 || e.metadata[8] === 3) /* Is loading bow */) || (e.type === 'mob' && e.name === 'skeleton'))
        .filter(e => {
            if (e.name === 'skeleton' && e.position.distanceTo(bot.entity.position) > 16) return false
            if (e.name === 'skeleton' && e.position.distanceTo(bot.entity.position) <= 16) return true


            const eyePosition = e.position.offset(0, 1.6, 0)
            const lookingAt = calculateDestinationByYaw(eyePosition, e.yaw + Math.PI, DISTANCE_VISION)

            const rayXZStart: Vector = { x: eyePosition.x, y: eyePosition.z }
            const rayXZEnd: Vector = { x: lookingAt.x, y: lookingAt.z }

            const ray = new Line(rayXZStart, rayXZEnd)
            const colisionXZ = system.checkCollision(ray, boxXZ)
            return colisionXZ
        })

    const calculatedEntityTarget: Record<string, {
        uuid: string,
        entity: Entity,
        name: string,
        prevTrajectory: Array<Vec3>
    }> = {}

    entities
        .forEach((e) => {
            if (!e.uuid) return
            const calc = calculateArrowTrayectory(bot, e.position.offset(0, 1.6, 0), 3, e.pitch, e.yaw, Weapons.bow)
            calculatedEntityTarget[e.uuid] = {
                uuid: e.uuid,
                entity: e,
                name: e.type === "player" ? e.username ?? '' : e.name ?? '',
                prevTrajectory: calc.arrowTrajectoryPoints
            }
        })

    return calculatedEntityTarget
}

const getEntityHitbox = (entity: Entity, expand: number): BoxColission => {
    return {
        start: entity.position.offset((-entity.width / 2) - expand, -expand, (-entity.width / 2 - expand)),
        end: entity.position.offset((entity.width / 2) + expand, entity.height + expand, (entity.width / 2) + expand),
    }
}
