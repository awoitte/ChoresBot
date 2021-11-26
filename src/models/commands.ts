import { Message } from './chat'
import { Action } from './actions'
import { ReadOnlyDB } from './db'
import { Config } from './config'

export type Command = {
    callsigns: string[]
    minArgumentCount?: number
    summary: string
    helpText?: string
    handler: (
        message: Message,
        config: Config,
        db: ReadOnlyDB,
        args: string
    ) => Promise<Action[]>
}
