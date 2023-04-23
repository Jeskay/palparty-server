import {session} from 'telegraf'

export enum AvailableScene {
    Auth = "auth_scene",
    Verification = "verification_scene",
}

export const BotName = "PalPartyBot"

export const sessionMiddleware = session()