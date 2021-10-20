import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { User } from '../models/chat'
import { DB } from '../external/db'
import log from '../logging/log'
import { skipChore, completeChore, assignChore } from './chores'

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
    } else if (text === '!complete') {
        return handleCompleteCommand(message, db)
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
        chore: skipChore(choreToSkip, message.author)
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
            chore: assignChore(mostUrgentChore, message.author)
        })

        actions.push({
            kind: 'SendMessage',
            message: {
                text:
                    `⏭ the chore "${choreToSkip.name}" has been successfully skipped. ` +
                    `@${message.author.name} please do the chore: "${mostUrgentChore.name}"`,
                author: ChoresBotUser
            }
        })
    } else {
        actions.push({
            kind: 'SendMessage',
            message: {
                text: `⏭ the chore "${choreToSkip.name}" has been successfully skipped`,
                author: ChoresBotUser
            }
        })
    }

    return actions
}

function handleCompleteCommand(message: Message, db: DB): Action[] {
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

    // complete the chore
    const completedChore: Chore = completeChore(userAssignedChores[0])

    actions.push({
        kind: 'ModifyChore',
        chore: completedChore
    })

    actions.push({
        kind: 'CompleteChore',
        chore: completedChore
    })

    actions.push({
        kind: 'SendMessage',
        message: {
            text: `✅ the chore "${completedChore.name}" has been successfully completed`,
            author: ChoresBotUser
        }
    })

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

    const assignableUsers = db.getAssignableUsersInOrderOfRecentCompletion()

    if (assignableUsers instanceof Error) {
        log('Unable to get assignable users')
        throw assignableUsers
    }

    while (outstandingChores.length > 0) {
        const chore = outstandingChores.pop()

        if (chore === undefined) {
            log(
                'impossible state reached, "outstandingChores" contained an undefined chore'
            )
            break
        }

        const user = findUserForChore(chore, assignableUsers)

        if (user === undefined) {
            log(`unable to find suitable user for the chore "${chore?.name}"`)
            continue
        }

        actions.push({
            kind: 'ModifyChore',
            chore: assignChore(chore, user)
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

function findUserForChore(chore: Chore, users: User[]): User | undefined {
    return users.find((user) => {
        if (chore.skippedBy === undefined) {
            // no need to check, take the first user
            return true
        }

        // check if a user has already skipped the chore
        return chore.skippedBy.find((u) => u.id === user.id) === undefined
    })
}
