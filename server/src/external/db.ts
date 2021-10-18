import { MaybeError } from '../models/utility'
import { User, ChoresBotUser } from '../models/chat'
import { Chore } from '../models/chores'

export interface DB {
    getUserWithLeastRecentCompletion: () => User
    getOutstandingChores: () => Chore[]
    getUpcommingChores: () => Chore[]
    addChore: (chore: Chore) => void
    modifyChore: (chore: Chore) => MaybeError
}

export const mockDB: DB = {
    getUserWithLeastRecentCompletion: () => {
        return ChoresBotUser
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
