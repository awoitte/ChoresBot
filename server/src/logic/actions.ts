import { ChoresBotUser, User } from '../models/chat'
import { assignChore } from './chores'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'

export function completeChoreActions(completedChore: Chore): Action[] {
    return [
        {
            kind: 'ModifyChore',
            chore: completedChore
        },

        {
            kind: 'CompleteChore',
            chore: completedChore
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
                text: `@${user.name} please do the chore: "${chore.name}"`,
                author: ChoresBotUser
            }
        }
    ]
}
