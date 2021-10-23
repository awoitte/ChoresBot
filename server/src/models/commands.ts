import { Message } from './chat'
import { Action } from './logic'
import { DB } from '../external/db'

export type Command = {
    minArgumentCount?: number
    helpText?: string
    handler: (message: Message, db: DB) => Action[]
}
