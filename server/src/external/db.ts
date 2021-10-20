import { MaybeError } from '../models/utility'
import { User } from '../models/chat'
import { Chore } from '../models/chores'

export interface DB {
    getAssignableUsersInOrderOfRecentCompletion: () => MaybeError<User[]>

    // outstanding meaning past their scheduled time
    getOutstandingUnassignedChores: () => MaybeError<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcommingUnassignedChores: () => MaybeError<Chore[]>

    addChore: (chore: Chore) => MaybeError<undefined>
    modifyChore: (chore: Chore) => MaybeError<undefined>
    getChoresAssignedToUser: (user: User) => MaybeError<Chore[]>
}

export const mockDB: DB = {
    getAssignableUsersInOrderOfRecentCompletion: () => {
        return []
    },
    getOutstandingUnassignedChores: () => {
        return []
    },
    getUpcommingUnassignedChores: () => {
        return []
    },
    addChore: () => {
        return undefined
    },
    modifyChore: () => {
        return undefined
    },
    getChoresAssignedToUser: () => {
        return []
    }
}

//TODO: create actual DB implementation that talks to an external db
