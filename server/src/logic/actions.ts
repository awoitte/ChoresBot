import { ChoresBotUser, User } from '../models/chat'
import { assignChore } from './chores'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { tagUser } from '../external/chat'

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
