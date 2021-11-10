import { User } from '../models/chat'
import { Chore, ChoreCompletion } from '../models/chores'

export interface ReadOnlyDB {
    getAssignableUsersInOrderOfRecentCompletion: () => Promise<User[]>
    getAllUsers: () => Promise<User[]>
    getUserByID: (id: string) => Promise<User | void>

    // outstanding meaning past their scheduled time
    getOutstandingUnassignedChores: () => Promise<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcomingUnassignedChores: () => Promise<Chore[]>

    getChoreByName: (name: string) => Promise<Chore | void>
    getChoresAssignedToUser: (user: User) => Promise<Chore[]>
    getAllChoreNames: () => Promise<string[]>
    getAllAssignedChores: () => Promise<Chore[]>

    getAllChoreCompletions: (choreName: string) => Promise<ChoreCompletion[]>

    getConfigValue: (key: string) => Promise<string | null>
}

export interface DB extends ReadOnlyDB {
    addUser: (user: User) => Promise<void>
    deleteUser: (user: User) => Promise<void>

    addChore: (chore: Chore) => Promise<void>
    modifyChore: (chore: Chore) => Promise<void>
    deleteChore: (name: string) => Promise<void>

    addChoreCompletion: (choreName: string, user: User) => Promise<void>

    setConfigValue: (key: string, value: string) => Promise<void>
}
