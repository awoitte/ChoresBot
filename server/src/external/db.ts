import { MaybeError } from '../models/utility'
import { User } from '../models/chat'
import { Chore } from '../models/chores'

export interface ReadOnlyDB {
    getAssignableUsersInOrderOfRecentCompletion: () => MaybeError<User[]>

    // outstanding meaning past their scheduled time
    getOutstandingUnassignedChores: () => MaybeError<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcomingUnassignedChores: () => MaybeError<Chore[]>

    getChoreByName: (name: string) => MaybeError<Chore | undefined>
    getChoresAssignedToUser: (user: User) => MaybeError<Chore[]>
    getAllChoreNames: () => MaybeError<string[]>
}

export interface DB extends ReadOnlyDB {
    addUser: (user: User) => MaybeError<undefined>
    deleteUser: (user: User) => MaybeError<undefined>

    addChore: (chore: Chore) => MaybeError<undefined>
    modifyChore: (chore: Chore) => MaybeError<undefined>
    deleteChore: (name: string) => MaybeError<undefined>
}

export const mockDB: DB = {
    addUser: () => {
        return undefined
    },
    deleteUser: () => {
        return undefined
    },
    getAssignableUsersInOrderOfRecentCompletion: () => {
        return []
    },
    getOutstandingUnassignedChores: () => {
        return []
    },
    getUpcomingUnassignedChores: () => {
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
