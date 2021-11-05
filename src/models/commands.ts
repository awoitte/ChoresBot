import { Message } from './chat'
import { Action } from './actions'
import { ReadOnlyDB } from '../external/db'

export type Command = {
    callsign: string
    minArgumentCount?: number
    helpText?: string
    handler: (message: Message, db: ReadOnlyDB) => Promise<Action[]>
}
