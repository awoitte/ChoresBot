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

    const assignableChores = getAllAssignableChores(db)

    if (assignableChores.length == 0) {
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

    const mostUrgentChore = findChoreForUser(assignableChores, message.author)

    if (mostUrgentChore === undefined) {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text:
                        `@${message.author.name} unable to find you a suitable new chore. ` +
                        `This might happen if all available chores have been skipped`,
                    author: ChoresBotUser
                }
            }
        ]
    }

    const actions: Action[] = []

    actions.push({
        kind: 'ModifyChore',
        chore: assignChore(mostUrgentChore, message.author)
    })

    actions.push({
        kind: 'SendMessage',
        message: {
            text:
                `Thank you for requesting a chore early! ` +
                `@${message.author.name} you have been assigned the chore "${mostUrgentChore.name}"`,
            author: ChoresBotUser
        }
    })

    return actions
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
    const assignableChores = getAllAssignableChores(db)
    if (assignableChores instanceof Error) {
        throw assignableChores
    }

    const assignableChoresWithoutSkipped = assignableChores.filter(
        // filter out skipped chore manually as the db hasn't been updated yet
        (chore) => chore.name !== choreToSkip.name
    )

    const mostUrgentChore = findChoreForUser(
        assignableChoresWithoutSkipped,
        message.author
    )

    if (mostUrgentChore !== undefined) {
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

    const outstandingChores = db.getOutstandingUnassignedChores()

    if (outstandingChores instanceof Error) {
        log('Unable to get outstanding chores')
        throw outstandingChores
    }

    let assignableUsers = db.getAssignableUsersInOrderOfRecentCompletion()

    if (assignableUsers instanceof Error) {
        log('Unable to get assignable users')
        throw assignableUsers
    }

    while (outstandingChores.length > 0) {
        const chore = outstandingChores.shift()

        if (chore === undefined) {
            log(
                'impossible state reached, "outstandingChores" contained an undefined chore'
            )
            break
        }

        const selectedUser = findUserForChore(chore, assignableUsers)

        if (selectedUser === undefined) {
            log(`unable to find suitable user for the chore "${chore?.name}"`)
            continue
        }

        assignableUsers = assignableUsers.filter(
            (u) => u.id !== selectedUser.id
        )

        actions.push({
            kind: 'ModifyChore',
            chore: assignChore(chore, selectedUser)
        })

        actions.push({
            kind: 'SendMessage',
            message: {
                text: `@${selectedUser.name} please do the chore: "${chore.name}"`,
                author: ChoresBotUser
            }
        })
    }

    return actions
}

function findUserForChore(chore: Chore, users: User[]): User | undefined {
    return users.find((user) => {
        return isUserEligableForChore(chore, user)
    })
}

function findChoreForUser(chores: Chore[], user: User): Chore | undefined {
    return chores.find((chore) => {
        return isUserEligableForChore(chore, user)
    })
}

function isUserEligableForChore(chore: Chore, user: User): boolean {
    // check if a user has already skipped the chore
    if (chore.skippedBy !== undefined) {
        return chore.skippedBy.find((u) => u.id === user.id) === undefined
    }

    return true
}

function getAllAssignableChores(db: DB): Chore[] {
    const outstandingChores = db.getOutstandingUnassignedChores()

    if (outstandingChores instanceof Error) {
        log('Unable to get outstanding chores')
        throw outstandingChores
    }

    const upcommingChores = db.getUpcommingUnassignedChores()

    if (upcommingChores instanceof Error) {
        throw upcommingChores
    }

    return [...outstandingChores, ...upcommingChores]
}
