import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { DB } from '../external/db'
import log from '../logging/log'

// messageHandler determines how to respond to chat messages
export function messageHandler(message: Message, db: DB): Action[] {
    log(`New message: [${message.author.name}] "${message.text}"`)

    const text = message.text.toLowerCase()

    if (text == 'ping') {
        return handlePingCommand()
    } else if (text === '!request') {
        return handleRequestCommand(message, db)
    } else if (text === '!skip') {
        return handleSkipCommand(message, db)
    }

    return []
}

function handlePingCommand(): Action[] {
    return [
        {
            kind: 'SendMessage',
            message: {
                text: 'pong',
                author: ChoresBotUser
            }
        }
    ]
}

function handleRequestCommand(message: Message, db: DB): Action[] {
    const userAssignedChores = db.getChoresAssignedToUser(message.author)
    if (userAssignedChores instanceof Error) {
        throw userAssignedChores
    }

    if (userAssignedChores.length > 0) {
        const mostUrgentChore = userAssignedChores[0]

        return [
            {
                kind: 'SendMessage',
                message: {
                    text:
                        `@${message.author.name} you are already assigned the chore "${mostUrgentChore.name}". ` +
                        `If you would like to skip you can use the "!skip" command`,
                    author: ChoresBotUser
                }
            }
        ]
    }

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

function handleSkipCommand(message: Message, db: DB): Action[] {
    const userAssignedChores = db.getChoresAssignedToUser(message.author)
    if (userAssignedChores instanceof Error) {
        throw userAssignedChores
    }

    // check if the user is able to skip
    if (userAssignedChores.length === 0) {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text:
                        `@${message.author.name} you have no chores currently assigned. ` +
                        `If you would like to request a new chore you can use the "!request" command`,
                    author: ChoresBotUser
                }
            }
        ]
    }

    const actions: Action[] = []

    // skip the chore
    const choreToSkip: Chore = userAssignedChores[0]

    actions.push({
        kind: 'ModifyChore',
        chore: {
            ...choreToSkip,
            assigned: false
        }
    })

    // check for other chores that can be assigned instead
    const upcommingChores = db.getUpcommingChores()
    if (upcommingChores instanceof Error) {
        throw upcommingChores
    }

    if (upcommingChores.length > 0) {
        const mostUrgentChore = upcommingChores[0]
        actions.push({
            kind: 'ModifyChore',
            chore: {
                ...mostUrgentChore,
                assigned: message.author
            }
        })

        actions.push({
            kind: 'SendMessage',
            message: {
                text:
                    `the chore "${choreToSkip.name}" has been successfully skipped. ` +
                    `@${message.author.name} please do the chore: "${mostUrgentChore.name}"`,
                author: ChoresBotUser
            }
        })
    } else {
        actions.push({
            kind: 'SendMessage',
            message: {
                text: `the chore "${choreToSkip.name}" has been successfully skipped`,
                author: ChoresBotUser
            }
        })
    }

    return actions
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

        actions.push({
            kind: 'ModifyChore',
            chore: {
                ...chore,
                assigned: user
            }
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
