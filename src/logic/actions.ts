import { ChoresBotUser, User } from '../models/chat'
import { assignChore } from './chores'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { tagUser, inlineCode } from '../external/chat'
import { Command } from '../models/commands'

export function completeChoreActions(
    completedChore: Chore,
    user: User
): Action[] {
    return [
        {
            kind: 'CompleteChore',
            chore: completedChore,
            user
        },

        {
            kind: 'SendMessage',
            message: {
                text: `✅ the chore "${completedChore.name}" has been successfully completed`,
                author: ChoresBotUser
            }
        }
    ]
}

export function assignChoreActions(chore: Chore, user: User): Action[] {
    return [
        {
            kind: 'ModifyChore',
            chore: assignChore(chore, user)
        },

        {
            kind: 'SendMessage',
            message: {
                text: `${tagUser(user)} please do the chore: "${chore.name}"`,
                author: ChoresBotUser
            }
        }
    ]
}

export function didYouMeanMessage(
    choreName: string,
    closestMatch: string | undefined,
    command: Command,
    taggedUser: User
): Action {
    if (closestMatch === undefined) {
        return {
            kind: 'SendMessage',
            message: {
                text: `${tagUser(
                    taggedUser
                )} Unable to find chore "${choreName}".`,
                author: ChoresBotUser
            }
        }
    }

    return {
        kind: 'SendMessage',
        message: {
            text: `${tagUser(
                taggedUser
            )} Unable to find chore "${choreName}". Did you mean ${inlineCode(
                `${command.callsign} ${closestMatch}`
            )}?`,
            author: ChoresBotUser
        }
    }
}
