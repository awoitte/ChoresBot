import { MaybeError } from '../models/utility'
import { User } from '../models/chat'
import { Chore } from '../models/chores'

export interface DB {
    getUsersWithLeastRecentCompletion: () => MaybeError<User[]>
    getOutstandingChores: () => MaybeError<Chore[]>
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
