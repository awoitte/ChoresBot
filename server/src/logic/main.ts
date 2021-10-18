import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { DB } from '../external/db'
import log from '../logging/log'

// messageHandler determines how to respond to chat messages
export function messageHandler(message: Message, db: DB): Action[] {
    log(`New message: [${message.author.name}] "${message.text}"`)

    const text = message.text.toLowerCase()

    if (text == 'ping') {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text: 'pong',
                    author: ChoresBotUser
                }
            }
        ]
    } else if (text === '!request') {
        const upcommingChores = db.getUpcommingChores()
        if (upcommingChores instanceof Error) {
            throw upcommingChores
        }

        if (upcommingChores.length > 0) {
            const mostUrgentChore = upcommingChores[0]

            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `@${message.author.name} the next upcomming unassigned chore is "${mostUrgentChore.name}"`,
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
                    author: ChoresBotUser
                }
            }
        ]
    }

    return []
}

// loop is called at a set interval and handles logic that isn't prompted by a chat message
export function loop(db: DB): Action[] {
    const actions: Action[] = []

    const outstandingChores = db.getOutstandingChores()

    if (outstandingChores instanceof Error) {
        log('Unable to get outstanding chores')
        throw outstandingChores
    }

    const assignableUsers = db.getUsersWithLeastRecentCompletion()

    if (assignableUsers instanceof Error) {
        log('Unable to get assignable users')
        throw assignableUsers
    }

    // do we have enough users free to assign all the chores? if not, only assign enough for all users
    const enoughUsersForChores =
        assignableUsers.length >= outstandingChores.length

    let numberOfChoresToAssign = outstandingChores.length
    if (!enoughUsersForChores) {
        numberOfChoresToAssign = assignableUsers.length
    }

    for (let i = 0; i < numberOfChoresToAssign; i++) {
        const chore = outstandingChores[i]
        const user = assignableUsers[i]

        chore.assigned = user

        actions.push({
            kind: 'ModifyChore',
            chore
        })

        actions.push({
            kind: 'SendMessage',
            message: {
                text: `@${user.name} please do the chore: "${chore.name}"`,
                author: ChoresBotUser
            }
        })
    }

    return actions
}
