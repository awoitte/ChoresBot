import { MaybeError } from '../models/utility'
import { User, ChoresBotUser } from '../models/chat'
import { Chore } from '../models/chores'

export interface DB {
    getUsersWithLeastRecentCompletion: () => MaybeError<User[]>
    getOutstandingChores: () => MaybeError<Chore[]>
    getUpcommingChores: () => MaybeError<Chore[]>
    addChore: (chore: Chore) => MaybeError<undefined>
    modifyChore: (chore: Chore) => MaybeError<undefined>
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
    }
}

//TODO: create actual DB implementation that talks to an external db
