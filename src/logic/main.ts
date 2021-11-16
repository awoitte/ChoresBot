import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/actions'
import { DB } from '../models/db'
import log from '../utility/log'
import { findUserForChore } from './chores'
import { AllCommands, defaultCallsign } from './commands'
import { assignChoreActions, reminderAction } from './actions'
import {
    isDateAfter,
    isNowBetweenTimes,
    isTimeAfter,
    parseDate,
    toParseableDateString
} from './time'

const reminderTimeConfigKey = 'reminder_time'

// messageHandler determines how to respond to chat messages
export async function messageHandler(
    message: Message,
    db: DB
): Promise<Action[]> {
    log(`New message: [${message.author.name}] "${message.text}"`)

    const text = message.text.toLowerCase()

    for (const command of AllCommands) {
        let args: string | undefined

        for (const callsign of command.callsigns) {
            if (text.startsWith(callsign)) {
                const potentialArgs = text.slice(callsign.length).trim()

                // prefer callsigns that match more of the text and thus have shorter args
                // e.g. prefer "!completed" over "!complete" so the d isn't accidentally
                // parsed as an arg
                if (args === undefined || potentialArgs.length < args.length) {
                    args = potentialArgs
                }
            }
        }

        if (args === undefined) {
            // even if the command has no args it should still be set to an empty string
            // thus we can use it as a flag to check if a command name match was found
            continue
        }

        if (command.minArgumentCount !== undefined) {
            let numberOfArguments

            if (args.trim() === '') {
                numberOfArguments = 0
            } else {
                const words = args.trim().split(' ')
                numberOfArguments = words.length
            }

            if (numberOfArguments < command.minArgumentCount) {
                return [
                    {
                        kind: 'SendMessage',
                        message: {
                            author: ChoresBotUser,
                            text:
                                command.helpText ||
                                'this command needs more arguments'
                        }
                    }
                ]
            }
        }

        try {
            return await command.handler(message, db, args)
        } catch (error) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `Error running command "${defaultCallsign(
                            command
                        )}" (see logs)`,
                        author: ChoresBotUser
                    }
                }
            ]
        }
    }

    return []
}

// loop is called at a set interval and handles logic that isn't prompted by a chat message
export async function loop(
    db: DB,
    morningTime?: Date,
    nightTime?: Date
): Promise<Action[]> {
    const actions: Action[] = []

    if (!isNowBetweenTimes(morningTime, nightTime)) {
        const lastReminder = await db.getConfigValue(reminderTimeConfigKey)

        if (isReminderTime(db, lastReminder, nightTime)) {
            const now = new Date()
            const assignedChores = await db.getAllAssignedChores()

            await db.setConfigValue(
                reminderTimeConfigKey,
                toParseableDateString(now)
            )
            actions.push(...reminderAction(assignedChores))
        }

        return actions
    }

    let outstandingChores
    try {
        outstandingChores = await db.getOutstandingUnassignedChores()
    } catch (e) {
        log('Unable to get outstanding chores')
        throw e
    }

    let assignableUsers
    try {
        assignableUsers = await db.getAssignableUsersInOrderOfRecentCompletion()
    } catch (e) {
        log('Unable to get assignable users')
        throw e
    }

    for (const chore of outstandingChores) {
        const selectedUser = findUserForChore(chore, assignableUsers)

        if (selectedUser === undefined) {
            log(`unable to find suitable user for the chore "${chore?.name}"`)
            continue
        }

        assignableUsers = assignableUsers.filter(
            (u) => u.id !== selectedUser.id
        )

        actions.push(...assignChoreActions(chore, selectedUser))
    }

    return actions
}

function isReminderTime(
    db: DB,
    lastReminder: string | null,
    nightTime?: Date
): boolean {
    const now = new Date()

    if (nightTime !== undefined && isTimeAfter(now, nightTime)) {
        if (lastReminder === null) {
            // a reminder has never been sent before
            return true
        }

        const lastReminderParsed = parseDate(lastReminder)
        if (lastReminderParsed === undefined) {
            throw new Error(
                `unable to parse last reminder time as a date: ${lastReminder}`
            )
        }

        return isDateAfter(now, lastReminderParsed)
    }

    return false
}
