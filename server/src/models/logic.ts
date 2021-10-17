import {Message} from './chat'

export type Action = SendMessage | NothingType

export type SendMessage = {
    message: Message
}

export const Nothing = {}
type NothingType = Record<string, never>

