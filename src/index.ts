import { Bot } from "mineflayer"
import { Entity } from 'prismarine-entity';
import { Vec3 } from "vec3";
import { detectProjectiles } from './hawkEye'
import { getPlayer, simplyShot } from './botFunctions'
import getMasterGrade from './hawkEyeEquations'
import { detectAim } from './projectilRadar'
import { calculateArrowTrayectory } from "./calculateArrowTrayectory"
import { HawkEye, HawkEyeEvents, OptionsMasterGrade, Projectil, Weapons } from "./types";
export * from "./types"

declare module 'mineflayer' {
  interface Bot {
    hawkEye: HawkEye;
  }
  interface BotEvents extends HawkEyeEvents {
    auto_shot_stopped: (target: Entity | OptionsMasterGrade) => void;
    target_aiming_at_you: (entity: Entity, arrowTrajectory: Array<Vec3>) => void;
    incoming_projectil: (projectil: Projectil, arrowTrajectory: Array<Vec3>) => void;
  }
}

const inject = (bot: Bot) => {
  bot.hawkEye = {
    getMasterGrade: (...v) => getMasterGrade(bot, ...v),
    simplyShot: (...v) => simplyShot(bot, ...v),
    getPlayer: (...v) => getPlayer(bot, ...v),
    calculateArrowTrayectory: (...v) => calculateArrowTrayectory(bot, ...v),
    detectProjectiles: (...v) => detectProjectiles(bot, ...v),
    detectAim: (...v) => detectAim(bot, ...v),
  }
}

export default inject
