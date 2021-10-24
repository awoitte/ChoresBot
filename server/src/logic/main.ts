import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import { DB } from '../external/db'
import log from '../logging/log'
import { assignChore, findUserForChore } from './chores'
import { AllCommandsByCallsign } from './commands'

// messageHandler determines how to respond to chat messages
export function messageHandler(message: Message, db: DB): Action[] {
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
            return command.handler(message, db)
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
