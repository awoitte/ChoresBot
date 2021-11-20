import { ChoresBotUser, User } from '../models/chat'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { Command } from '../models/commands'
import { ReadOnlyDB } from '../models/db'
import { tagUser, inlineCode } from '../external/chat'
import log from '../utility/log'
import { bestMatch } from '../utility/strings'
import { frequencyToString, parseFrequency } from './time'
import {
    assignChoreActions,
    completeChoreActions,
    didYouMeanMessage
} from './actions'
import {
    skipChore,
    completeChore,
    findChoreForUser,
    describeChore,
    unassignChore
} from './chores'

// NOTE: If you add a new command, be sure to add it to the `AllCommands` array

export const PingCommand: Command = {
    callsigns: ['ping', '!ping'],
    summary:
        'Bot responds with "pong", useful diagnostic to check if ChoresBot is running.',
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
    callsigns: ['!request'],
    summary: 'Request a new chore early',
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
                            `${tagUser(
                                message.author
                            )} you are already assigned the chore "${
                                mostUrgentChore.name
                            }". ` +
                            `If you would like to skip you can use the ${inlineCode(
                                defaultCallsign(SkipCommand)
                            )} command`,
                        author: ChoresBotUser
                    }
                }
            ]
        }

        const assignableChores = await db.getUpcomingUnassignedChores()

        if (assignableChores.length == 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `✨ ${tagUser(
                            message.author
                        )} there are no upcoming chores ✨`,
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
                            `${tagUser(
                                message.author
                            )} unable to find you a suitable new chore. ` +
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
    callsigns: ['!skip'],
    summary:
        'Skip a chore, you will not be assigned to it again until another user completes it',
    helpText: `!skip

Skips your currently assigned chore. You will not be re-assigned this chore again until it has been completed.`,
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
                            `${tagUser(
                                message.author
                            )} you have no chores currently assigned. ` +
                            `If you would like to request a new chore you can use the ${inlineCode(
                                defaultCallsign(RequestCommand)
                            )} command`,
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
    callsigns: ['!complete', '!completed'],
    summary: 'Mark a chore as completed',
    helpText: `!complete chore-name

chore-name:
    Optional.
    The name of the chore you wish to complete. If no name is provided then your currently assigned chore is used.

Note: you do not need to be assigned to a chore to complete it`,
    handler: async (message, db, commandArgs) => {
        if (commandArgs.length === 0) {
            return completeAssignedChore(message.author, db)
        }

        return completeChoreByName(commandArgs, message.author, db)
    }
}

export const AddCommand: Command = {
    callsigns: ['!add'],
    summary: 'Add a new chore',
    helpText: `!add chore-name frequency

chore-name:
    The name of the chore. Shown when being assigned, completed, etc. Should be something that clearly describes the chore.
    Note: don't use the @ symbol in the name

frequency:
    How frequently the chore should be completed/assigned. Must be one of the following formats:
        Daily @ <time>
        Weekly @ <day>
        Monthly @ <day/time>
        Yearly @ <date>
        Once @ <date/time>

Notes:
- Adding a chore that already exists will override its frequency.
- Adding a chore that was deleted will make it available again. Previous completions will still be shown.

e.g.
!add walk the cat Daily @ 9:00 AM
!add flip the pool Weekly @ monday
!add make a pile Yearly @ Feb 12
!add floop the pig Once @ Nov 9 2:00 PM
!add clean kitchen fans Monthly @ 10th 10:00 AM`,
    minArgumentCount: 2,
    handler: async (message, db, commandArgs) => {
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
                    text: `➕ ${tagUser(
                        message.author
                    )} new chore '${choreName}' successfully added with frequency '${frequencyToString(
                        frequency
                    )}' ➕`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const DeleteCommand: Command = {
    callsigns: ['!delete'],
    minArgumentCount: 1,
    summary: 'Delete an existing chore',
    helpText: `!delete chore-name

chore-name:
    The name of the chore. Shown when being assigned, completed, etc.

Note: although the chore will no longer be accesible or assignable the database will still have records of it and its completions.`,
    handler: async (message, db, choreName) => {
        // check if chore exists, maybe it was misspelled
        let chore
        try {
            chore = await db.getChoreByName(choreName)
        } catch (e) {
            log(`error retrieving chore "${choreName}": ${e}`)
            // don't re-throw so user gets more specific message
        }

        if (chore === undefined) {
            return [
                didYouMeanMessage(
                    choreName,
                    await getClosestChoreName(choreName, db),
                    DeleteCommand,
                    message.author
                )
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
                    text: `➖ ${tagUser(
                        message.author
                    )} chore '${choreName}' successfully deleted ➖`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const InfoCommand: Command = {
    callsigns: ['!info'],
    summary: 'Get information on a chore',
    helpText: `!info chore-name

chore-name:
    Optional.
    The name of the chore you want info on. If no name is provided then your currently assigned chore is used.

Note: If a chore matching the name you supplied can't be found then the closest match will be shown instead. This can be helpful to check the spelling of a chore's name.`,
    handler: async (message, db, choreName) => {
        let chore

        if (choreName === '') {
            // no chore name supplied, use assigned chore
            const userAssignedChores = await db.getChoresAssignedToUser(
                message.author
            )

            if (userAssignedChores.length === 0) {
                return [
                    {
                        kind: 'SendMessage',
                        message: {
                            text: `${tagUser(
                                message.author
                            )} you have no chores assigned`,
                            author: ChoresBotUser
                        }
                    }
                ]
            }

            chore = userAssignedChores[0]
        } else {
            // check if chore exists, maybe it was misspelled
            try {
                chore = await db.getChoreByName(choreName)
            } catch (e) {
                log(`error retrieving chore "${choreName}": ${e}`)
                // don't re-throw so user gets more specific message
            }

            if (chore === undefined) {
                return [
                    didYouMeanMessage(
                        choreName,
                        await getClosestChoreName(choreName, db),
                        InfoCommand,
                        message.author
                    )
                ]
            }
        }

        const completions = await db.getAllChoreCompletions(chore.name)
        const mostRecentCompletion = completions.shift()

        return [
            {
                kind: 'SendMessage',
                message: {
                    text: describeChore(chore, mostRecentCompletion),
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const OptInCommand: Command = {
    callsigns: ['!opt-in'],
    summary:
        'Add yourself as a user of ChoresBot allowing chores to be assigned to you.',
    handler: async (message) => {
        return [
            {
                kind: 'AddUser',
                user: message.author
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `${tagUser(
                        message.author
                    )} thank you for opting in to ChoresBot!!! ✨💚`,
                    author: ChoresBotUser
                }
            }
        ]
    }
}

export const OptOutCommand: Command = {
    callsigns: ['!opt-out'],
    summary:
        'Remove yourself as a user of ChoresBot. You will no longer be assigned chores.',
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
                    text: `${tagUser(
                        message.author
                    )} successfully opted-out, you should no longer be assigned any chores 👋`,
                    author: ChoresBotUser
                }
            }
        )

        return actions
    }
}

export const HelpCommand: Command = {
    callsigns: ['!help'],
    summary: 'Get information on how to use a command',
    helpText: `!help command

command:
    Optional.
    The name of the command you would like help with. If none is provided then a summary of all commands will be given.
    Note: If the command name isn't found then the closest match will be used`,
    handler: async (message, db, commandName) => {
        if (commandName.length === 0) {
            const helpSummary = AllCommands.map(
                (command) => `${defaultCallsign(command)} - ${command.summary}`
            ).join('\n')
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: helpSummary,
                        author: ChoresBotUser
                    }
                }
            ]
        } else {
            const commandNames = AllCommands.map(defaultCallsign)
            const closestCommand = bestMatch(commandName, commandNames)
            const command = AllCommands.find(
                (command) => defaultCallsign(command) === closestCommand
            )

            if (command === undefined) {
                const errorText = `Cannot find closest matching command "${closestCommand}"`
                log(errorText)
                throw new Error(errorText)
            }

            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: command.helpText || command.summary,
                        author: ChoresBotUser
                    }
                }
            ]
        }
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
    OptOutCommand,
    HelpCommand
]

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
                        `${tagUser(
                            user
                        )} you have no chores currently assigned. ` +
                        `If you would like to request a new chore you can use the ${inlineCode(
                            defaultCallsign(RequestCommand)
                        )} command`,
                    author: ChoresBotUser
                }
            }
        ]
    }

    const completedChore: Chore = completeChore(userAssignedChores[0])

    return completeChoreActions(completedChore, user)
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
            didYouMeanMessage(
                choreName,
                await getClosestChoreName(choreName, db),
                CompleteCommand,
                completedBy
            )
        ]
    }

    const completedChore: Chore = completeChore(chore)

    return completeChoreActions(completedChore, completedBy)
}

// --- Utility ---

async function getClosestChoreName(
    requestedName: string,
    db: ReadOnlyDB
): Promise<string | undefined> {
    const chores = await db.getAllChoreNames()

    return bestMatch(requestedName, chores)
}

// --- Command "Methods" ---

export function defaultCallsign(command: Command): string {
    if (command.callsigns.length === 0) {
        throw new Error('All commands must have at least one callsign')
    }

    return command.callsigns[0]
}
