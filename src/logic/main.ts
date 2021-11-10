import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/actions'
import { DB } from '../external/db'
import log from '../logging/log'
import { findUserForChore } from './chores'
import { AllCommandsByCallsign } from './commands'
import { assignChoreActions } from './actions'
import { isNowBetweenTimes } from './time'

// messageHandler determines how to respond to chat messages
export async function messageHandler(
    message: Message,
    db: DB
): Promise<Action[]> {
    log(`New message: [${message.author.name}] "${message.text}"`)

    const text = message.text.toLowerCase()

    for (const commandText in AllCommandsByCallsign) {
        if (
            !Object.prototype.hasOwnProperty.call(
                AllCommandsByCallsign,
                commandText
            )
        ) {
            // safegaurd to skip inherited properties
            continue
        }

        const command = AllCommandsByCallsign[commandText]

        if (!text.startsWith(commandText)) {
            continue
        }

        if (command.minArgumentCount !== undefined) {
            const words = message.text.trim().split(' ')
            const numberOfArguments = words.length - 1

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
            return await command.handler(message, db)
        } catch (error) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `Error running command "${command.callsign}" (see logs)`,
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
