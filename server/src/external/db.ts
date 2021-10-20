import { MaybeError } from '../models/utility'
import { User } from '../models/chat'
import { Chore } from '../models/chores'

export interface DB {
    getUsersWithLeastRecentCompletion: () => MaybeError<User[]>

    // outstanding meaning past their scheduled time
    getOutstandingChores: () => MaybeError<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcommingChores: () => MaybeError<Chore[]>

    addChore: (chore: Chore) => MaybeError<undefined>
    modifyChore: (chore: Chore) => MaybeError<undefined>
    getChoresAssignedToUser: (user: User) => MaybeError<Chore[]>
}

export const mockDB: DB = {
    getUsersWithLeastRecentCompletion: () => {
        return []
    },
    getOutstandingChores: () => {
        return []
    },
    getUpcommingChores: () => {
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
