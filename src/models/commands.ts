import { Message } from './chat'
import { Action } from './actions'
import { ReadOnlyDB } from './db'

export type Command = {
    callsigns: string[]
    minArgumentCount?: number
    summary: string
    helpText?: string
    handler: (
        message: Message,
        db: ReadOnlyDB,
        args: string
    ) => Promise<Action[]>
}
