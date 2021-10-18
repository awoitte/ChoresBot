import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { DB } from '../external/db'
import log from '../logging/log'

export function messageHandler(message: Message, db: DB): Action[] {
    log(`TODO handling a message: "${message.text}"`)

    const text = message.text.toLowerCase()

    if (text == 'ping') {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text: 'pong',
                    channel: '',
                    author: ChoresBotUser
                }
            }
        ]
    } else if (text === '!request') {
        const upcommingChores = db.getUpcommingChores()

        if (upcommingChores.length > 0) {
            const mostUrgentChore = upcommingChores[0]

            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `@${message.author.name} the next upcomming unassigned chore is "${mostUrgentChore.name}"`,
                        channel: '',
                        author: ChoresBotUser
                    }
                }
            ]
        }

        return [
            {
                kind: 'SendMessage',
                message: {
                    text: `@${message.author.name} there are no upcomming chores`,
                    channel: '',
                    author: ChoresBotUser
                }
            }
        ]
    }

    return []
}
