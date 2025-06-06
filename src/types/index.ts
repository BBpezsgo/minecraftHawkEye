import { Bot as MineflayerBot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { Entity } from 'prismarine-entity'
import { Block } from 'prismarine-block'
import { detectProjectiles } from '../hawkEye'
import getMasterGrade from '../hawkEyeEquations'
import { getPlayer } from '../botFunctions'
import { detectAim } from '../projectilRadar'
import { calculateArrowTrayectory } from '../calculateArrowTrayectory'

export type OptionsMasterGrade = {
    position: Vec3,
    isValid: boolean
}

export enum Weapons {
    bow = 'bow',
    crossbow = 'crossbow',
    trident = 'trident',
    ender_pearl = 'ender_pearl',
    snowball = 'snowball',
    egg = 'egg',
    splash_potion = 'splash_potion',
    bobber = 'bobber',
}

export type PropsOfWeapons = {
    GRAVITY: number
    BaseVo: number
    waitTime: number
    minDegree: number
    maxDegree: number
}

export const weaponsProps: Record<Weapons, PropsOfWeapons> = {
    bow: {
        BaseVo: 3,
        GRAVITY: 0.05,
        waitTime: 1200,
        minDegree: -89,
        maxDegree: 90,
    },
    crossbow: {
        BaseVo: 3.15,
        GRAVITY: 0.05,
        waitTime: 1200,
        minDegree: -89,
        maxDegree: 90,
    },
    trident: {
        BaseVo: 2.5,
        GRAVITY: 0.05,
        waitTime: 1200,
        minDegree: -89,
        maxDegree: 90,
    },
    ender_pearl: {
        BaseVo: 1.5,
        GRAVITY: 0.03,
        waitTime: 150,
        minDegree: -89,
        maxDegree: 90,
    },
    snowball: {
        BaseVo: 1.5,
        GRAVITY: 0.03,
        waitTime: 150,
        minDegree: -89,
        maxDegree: 90,
    },
    egg: {
        BaseVo: 1.5,
        GRAVITY: 0.03,
        waitTime: 150,
        minDegree: -89,
        maxDegree: 90,
    },
    splash_potion: {
        BaseVo: 0.4,
        GRAVITY: 0.03,
        waitTime: 150,
        minDegree: -89,
        maxDegree: 90,
    },
    bobber: {
        BaseVo: 1.1,
        GRAVITY: 0.08,
        waitTime: 150,
        minDegree: -89,
        maxDegree: 45,
    },
}

export type GetMasterGrade = {
    pitch: number,
    yaw: number,
    grade: number,
    nearestDistance: number,
    target: Vec3,
    arrowTrajectoryPoints: Array<Vec3>,
    blockInTrayect?: Block | null
}

export type HawkEye = {
    simplyShot: (yaw: number, pitch: number) => void
    getMasterGrade: (from: Entity | OptionsMasterGrade, speed: Vec3, weapon: Weapons) => ReturnType<typeof getMasterGrade>
    getPlayer: (name?: string) => ReturnType<typeof getPlayer>
    detectProjectiles: (projectile?: string) => ReturnType<typeof detectProjectiles>
    detectAim: () => ReturnType<typeof detectAim>
    calculateArrowTrayectory: (currentPos: Vec3, itemSpeed: number, pitch: number, yaw: number, ammunitionType?: Weapons) => ReturnType<typeof calculateArrowTrayectory>
}

export interface HawkEyeEvents {
    auto_shot_stopped: (target: Entity | OptionsMasterGrade) => void
    target_aiming_at_you: (entity: Entity, arrowTrajectory: Array<Vec3>) => void
    incoming_projectil: (projectil: Projectil, arrowTrajectory: Array<Vec3>) => void
}

export interface Bot extends MineflayerBot {
    test: {
        groundY: number,
        sayEverywhere: (msg: string) => void
        clearInventory: () => void
        becomeSurvival: () => void
        becomeCreative: () => void
        fly: (delta: Vec3) => Promise<void>
        resetState: () => Promise<void>
        placeBlock: (slot: number, position: Vec3) => void
        wait: (ms: number) => Promise<void>
    }
}

export const isEntity = (e: Entity | OptionsMasterGrade): e is Entity => {
    return "type" in e
}

export type Projectil = {
    uuid: string,
    entity: Entity,
    enabled: boolean,
    currentSpeed: number // Vo,
    currentSpeedTime: number
    previusPositions: Array<{
        at: number,
        pos: Vec3
    }>,
    updatedAt: number
}

export class Vec2 {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export type BoxColission = { start: Vec3, end: Vec3 }
