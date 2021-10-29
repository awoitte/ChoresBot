import { ChoresBotUser, User } from '../models/chat'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { Command } from '../models/commands'
import { ReadOnlyDB } from '../external/db'
import log from '../logging/log'
import { frequencyToString, parseFrequency } from './time'
import { assignChoreActions, completeChoreActions } from './actions'
import {
    skipChore,
    completeChore,
    findChoreForUser,
    describeChore,
    unassignChore
} from './chores'

export const PingCommand: Command = {
    callsign: 'ping',
    handler: async () => {
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
    handler: async (message, db) => {
        const userAssignedChores = await db.getChoresAssignedToUser(
            message.author
        )

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

        const assignableChores = await getAllAssignableChores(db)

        if (assignableChores.length == 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `@${message.author.name} there are no upcoming chores`,
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

        return assignChoreActions(mostUrgentChore, message.author)
    }
}

export const SkipCommand: Command = {
    callsign: '!skip',
    handler: async (message, db) => {
        const userAssignedChores = await db.getChoresAssignedToUser(
            message.author
        )

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

        // skip the chore
        const choreToSkip: Chore = userAssignedChores[0]

        return [
            {
                kind: 'ModifyChore',
                chore: skipChore(choreToSkip, message.author)
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `⏭ the chore "${choreToSkip.name}" has been successfully skipped`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const CompleteCommand: Command = {
    callsign: '!complete',
    handler: async (message, db) => {
        const commandArgs = getArgumentsString(message.text, CompleteCommand)

        if (commandArgs.length === 0) {
            return completeAssignedChore(message.author, db)
        }

        return completeChoreByName(commandArgs, message.author, db)
    }
}

export const AddCommand: Command = {
    callsign: '!add',
    helpText: `!add chore-name frequency

chore-name      The name of the chore. Shown when being assigned, completed, etc.
                Should be something that clearly describes the chore.
                Note: don't use the @ symbol in the name

frequency       How frequently the chore should be completed/assigned.
                Must be one of the following formats:
                    Daily @ <time>
                    Weekly @ <day>
                    Yearly @ <date>
                    Once @ <date/time>

e.g.
!add walk the cat Daily @ 9:00 AM
!add flip the pool Weekly @ monday
!add make a pile Yearly @ Feb 12
!add floop the pig Once @ Nov 9 2:00 PM`,
    minArgumentCount: 2,
    handler: async (message) => {
        const commandArgs = getArgumentsString(message.text, AddCommand)

        const words = commandArgs.split(' ')
        const atSignIndex = words.indexOf('@')

        // there must be a keyword before the @
        // and the name of the chore needs to be before the @
        // so the index must be at least 2
        if (atSignIndex === -1 || atSignIndex < 2) {
            log(`invalid command format for !add command: ${commandArgs}`)
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text:
                            AddCommand.helpText ||
                            'invalid format for !add command',
                        author: ChoresBotUser
                    }
                }
            ]
        }

        const choreName = words.slice(0, atSignIndex - 1).join(' ')
        const frequencyString = words.slice(atSignIndex - 1).join(' ')
        const frequency = parseFrequency(frequencyString)

        if (frequency instanceof Error) {
            log(`Error parsing frequency "${frequency.message}"`)
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: 'Error: unable to parse the frequency (see logs)',
                        author: ChoresBotUser
                    }
                }
            ]
        }

        return [
            {
                kind: 'AddChore',
                chore: {
                    name: choreName,
                    assigned: false,
                    frequency
                }
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `@${
                        message.author.name
                    } new chore '${choreName}' successfully added with frequency '${frequencyToString(
                        frequency
                    )}'`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const DeleteCommand: Command = {
    callsign: '!delete',
    minArgumentCount: 1,
    helpText: `!delete chore-name

chore-name      The name of the chore. Shown when being assigned, completed, etc.
                Note: make sure spelling and capitalization matches exactly`,
    handler: async (message, db) => {
        const choreName = getArgumentsString(message.text, DeleteCommand)

        // check if chore exists, maybe it was misspelled
        let chore
        try {
            chore = await db.getChoreByName(choreName)
        } catch (e) {
            log(`error retrieving chores: ${choreName}`)
            throw e
        }

        if (chore === undefined) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `@${message.author.name} Unable to find chore "${choreName}". Try using the !info command to verify the spelling.`,
                        author: ChoresBotUser
                    }
                }
            ]
        }

        return [
            {
                kind: 'DeleteChore',
                chore
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `@${message.author.name} chore '${choreName}' successfully deleted`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const InfoCommand: Command = {
    callsign: '!info',
    handler: async (message, db) => {
        const choreName = getArgumentsString(message.text, InfoCommand)

        if (choreName === '') {
            // no chore name supplied, list all chores

            let allChores
            try {
                allChores = await db.getAllChoreNames()
            } catch (e) {
                log(`error retrieving all chore names`)
                throw e
            }

            const allChoresList = allChores
                .map((chore) => `"${chore}"`)
                .join('\n')

            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `All Chores:\n${allChoresList}`,
                        author: ChoresBotUser
                    }
                }
            ]
        }

        let chore
        try {
            chore = await db.getChoreByName(choreName)
        } catch (e) {
            log(`error retrieving chore "${choreName}"`)
            throw e
        }

        if (chore === undefined) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `@${message.author.name} Unable to find chore "${choreName}". Try using the !info command to verify the spelling.`,
                        author: ChoresBotUser
                    }
                }
            ]
        }

        return [
            {
                kind: 'SendMessage',
                message: {
                    text: describeChore(chore),
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const OptInCommand: Command = {
    callsign: '!opt-in',
    handler: async (message) => {
        return [
            {
                kind: 'AddUser',
                user: message.author
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `@${message.author.name} thank you for opting in to ChoresBot!!! ✨💚`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const OptOutCommand: Command = {
    callsign: '!opt-out',
    handler: async (message, db) => {
        const actions: Action[] = []

        const userAssignedChores = await db.getChoresAssignedToUser(
            message.author
        )

        for (const chore of userAssignedChores) {
            actions.push({
                kind: 'ModifyChore',
                chore: unassignChore(chore)
            })
        }

        actions.push(
            {
                kind: 'DeleteUser',
                user: message.author
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `@${message.author.name} successfully opted-out, you should no longer be assigned any chores`,
                    author: ChoresBotUser
                }
            }
        )

        return actions
    }
}
export const AllCommands: Command[] = [
    PingCommand,
    RequestCommand,
    SkipCommand,
    CompleteCommand,
    AddCommand,
    DeleteCommand,
    InfoCommand,
    OptInCommand,
    OptOutCommand
]

export const AllCommandsByCallsign: Record<string, Command> =
    AllCommands.reduce<Record<string, Command>>((accumulator, command) => {
        accumulator[command.callsign] = command
        return accumulator
    }, {})

// --- Chore Completion ---
async function completeAssignedChore(
    user: User,
    db: ReadOnlyDB
): Promise<Action[]> {
    const userAssignedChores = await db.getChoresAssignedToUser(user)

    // check if the user has a chore assigned to complete
    if (userAssignedChores.length === 0) {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text:
                        `@${user.name} you have no chores currently assigned. ` +
                        `If you would like to request a new chore you can use the "!request" command`,
                    author: ChoresBotUser
                }
            }
        ]
    }

    const completedChore: Chore = completeChore(userAssignedChores[0])

    return completeChoreActions(completedChore)
}

async function completeChoreByName(
    choreName: string,
    completedBy: User,
    db: ReadOnlyDB
): Promise<Action[]> {
    const chore = await db.getChoreByName(choreName)

    if (chore instanceof Error) {
        throw chore
    }

    if (chore === undefined) {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text: `@${completedBy.name} Unable to find chore "${choreName}". Try using the !info command to verify the spelling.`,
                    author: ChoresBotUser
                }
            }
        ]
    }

    const completedChore: Chore = completeChore(chore)

    return completeChoreActions(completedChore)
}

async function getAllAssignableChores(db: ReadOnlyDB): Promise<Chore[]> {
    let outstandingChores
    try {
        outstandingChores = await db.getOutstandingUnassignedChores()
    } catch (e) {
        log('Unable to get outstanding chores')
        throw e
    }

    const upcomingChores = await db.getUpcomingUnassignedChores()

    return [...outstandingChores, ...upcomingChores]
}

// --- Utility ---
function getArgumentsString(messageText: string, command: Command): string {
    return messageText.slice(command.callsign.length).trim()
}
