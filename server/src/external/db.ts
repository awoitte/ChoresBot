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
    deleteChore: (name: string) => MaybeError<undefined>

    getChoreByName: (name: string) => MaybeError<Chore | undefined>
    getChoresAssignedToUser: (user: User) => MaybeError<Chore[]>
    getAllChoreNames: () => MaybeError<string[]>
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
    deleteChore: () => {
        return undefined
    },
    getChoreByName: () => {
        return undefined
    },
    getChoresAssignedToUser: () => {
        return []
    },
    getAllChoreNames: () => {
        return []
    }
}

//TODO: create actual DB implementation that talks to an external db
