import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { Command } from '../models/commands'
import { DB } from '../external/db'
import log from '../logging/log'
import {
    skipChore,
    completeChore,
    assignChore,
    findChoreForUser
} from './chores'

export const PingCommand: Command = {
    callsign: 'ping',
    handler: () => {
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
}

export const RequestCommand: Command = {
    callsign: '!request',
    handler: (message, db) => {
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

        const mostUrgentChore = findChoreForUser(
            assignableChores,
            message.author
        )

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
}

export const SkipCommand: Command = {
    callsign: '!skip',
    handler: (message, db) => {
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
}

export const CompleteCommand: Command = {
    callsign: '!complete',
    handler: (message, db) => {
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
}

export const AddCommand: Command = {
    callsign: '!add',
    helpText: '!add chore-name frequency',
    minArgumentCount: 1,
    handler: () => {
        console.log('TODO: !add command')
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
}

export const AllCommands: Command[] = [
    PingCommand,
    RequestCommand,
    SkipCommand,
    CompleteCommand,
    AddCommand
]

export const AllCommandsByCallsign: Record<string, Command> =
    AllCommands.reduce<Record<string, Command>>((accumulator, command) => {
        accumulator[command.callsign] = command
        return accumulator
    }, {})

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
