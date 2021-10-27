import { ChoresBotUser, User } from '../models/chat'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { Command } from '../models/commands'
import { frequencyToString, parseFrequency } from './time'
import { DB } from '../external/db'
import log from '../logging/log'
import {
    skipChore,
    completeChore,
    assignChore,
    findChoreForUser,
    describeChore
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
    handler: (message, db) => {
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

        const error = db.addChore({
            name: choreName,
            assigned: false,
            frequency
        })

        if (error) {
            log(error.message)
            throw error
        }

        return [
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
    handler: (message, db) => {
        const choreName = getArgumentsString(message.text, DeleteCommand)

        const error = db.deleteChore(choreName)

        if (error instanceof Error) {
            log(`error deleting chore "${choreName}": ${error.message}`)

            // check if chore exists, maybe it was misspelled
            const chore = db.getChoreByName(choreName)

            if (chore !== undefined) {
                // found the chore, the error was something else
                throw error
            }

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
                    text: `@${message.author.name} chore '${choreName}' successfully deleted`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const InfoCommand: Command = {
    callsign: '!info',
    handler: (message, db) => {
        const choreName = getArgumentsString(message.text, InfoCommand)

        if (choreName === '') {
            // no chore name supplied, list all chores

            const allChores = db.getAllChoreNames()

            if (allChores instanceof Error) {
                log(`error retrieving all chore names: ${allChores.message}`)
                throw allChores
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

        const chore = db.getChoreByName(choreName)

        if (chore instanceof Error) {
            log(`error retrieving chore "${choreName}": ${chore.message}`)
            throw chore
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

export const AllCommands: Command[] = [
    PingCommand,
    RequestCommand,
    SkipCommand,
    CompleteCommand,
    AddCommand,
    DeleteCommand,
    InfoCommand
]

export const AllCommandsByCallsign: Record<string, Command> =
    AllCommands.reduce<Record<string, Command>>((accumulator, command) => {
        accumulator[command.callsign] = command
        return accumulator
    }, {})

// --- Chore Completion ---
function completeAssignedChore(user: User, db: DB): Action[] {
    const userAssignedChores = db.getChoresAssignedToUser(user)
    if (userAssignedChores instanceof Error) {
        throw userAssignedChores
    }

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

function completeChoreByName(
    choreName: string,
    completedBy: User,
    db: DB
): Action[] {
    const chore = db.getChoreByName(choreName)

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

function completeChoreActions(completedChore: Chore): Action[] {
    const actions: Action[] = []

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

function getAllAssignableChores(db: DB): Chore[] {
    const outstandingChores = db.getOutstandingUnassignedChores()

    if (outstandingChores instanceof Error) {
        log('Unable to get outstanding chores')
        throw outstandingChores
    }

    const upcomingChores = db.getUpcomingUnassignedChores()

    if (upcomingChores instanceof Error) {
        throw upcomingChores
    }

    return [...outstandingChores, ...upcomingChores]
}

// --- Utility ---
function getArgumentsString(messageText: string, command: Command): string {
    return messageText.slice(command.callsign.length).trim()
}
