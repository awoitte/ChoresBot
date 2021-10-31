import { Pool } from 'pg'

import { User } from '../models/chat'
import { Chore } from '../models/chores'

import initDBQuery from '../queries/init-db'
import destroyDBQuery from '../queries/destroy-db'
import * as userQueries from '../queries/users'

export interface ReadOnlyDB {
    getAssignableUsersInOrderOfRecentCompletion: () => Promise<User[]>
    getAllUsers: () => Promise<User[]>

    // outstanding meaning past their scheduled time
    getOutstandingUnassignedChores: () => Promise<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcomingUnassignedChores: () => Promise<Chore[]>

    getChoreByName: (name: string) => Promise<Chore | void>
    getChoresAssignedToUser: (user: User) => Promise<Chore[]>
    getAllChoreNames: () => Promise<string[]>
}

export interface DB extends ReadOnlyDB {
    addUser: (user: User) => Promise<void>
    deleteUser: (user: User) => Promise<void>

    addChore: (chore: Chore) => Promise<void>
    modifyChore: (chore: Chore) => Promise<void>
    deleteChore: (name: string) => Promise<void>

    addChoreCompletion: (name: string) => Promise<void>
}

export const mockDB: DB = {
    getAllUsers: async () => {
        return []
    },
    addUser: async () => {
        return undefined
    },
    deleteUser: async () => {
        return undefined
    },
    getAssignableUsersInOrderOfRecentCompletion: async () => {
        return []
    },
    getOutstandingUnassignedChores: async () => {
        return []
    },
    getUpcomingUnassignedChores: async () => {
        return []
    },
    addChore: async () => {
        return undefined
    },
    modifyChore: async () => {
        return undefined
    },
    deleteChore: async () => {
        return undefined
    },
    getChoreByName: async () => {
        return undefined
    },
    getChoresAssignedToUser: async () => {
        return []
    },
    getAllChoreNames: async () => {
        return []
    },
    addChoreCompletion: async () => {
        return undefined
    }
}

export interface PostgresDB extends DB {
    initDB: () => Promise<void>
    release: () => Promise<void>
    destroyEntireDB: () => Promise<void>
}

export async function pgDB(connectionString: string): Promise<PostgresDB> {
    const pool = new Pool({
        connectionString
    })
    const client = await pool.connect()

    return {
        release: async () => {
            await client.release()
        },
        initDB: async () => {
            await client.query(initDBQuery)
        },
        destroyEntireDB: async () => {
            await client.query(destroyDBQuery)
        },
        addUser: async (user) => {
            await client.query(userQueries.addUser, [user.name, user.id])
        },
        deleteUser: async () => {
            // TODO
            return undefined
        },
        getAllUsers: async () => {
            const userRes = await client.query(userQueries.getAllUsers)

            return userRes.rows.map((row) => ({
                name: row.name,
                id: row.id
            }))
        },
        getAssignableUsersInOrderOfRecentCompletion: async () => {
            // TODO
            return []
        },
        getOutstandingUnassignedChores: async () => {
            // TODO
            return []
        },
        getUpcomingUnassignedChores: async () => {
            // TODO
            return []
        },
        addChore: async () => {
            // TODO
            return undefined
        },
        modifyChore: async () => {
            // TODO
            return undefined
        },
        deleteChore: async () => {
            // TODO
            return undefined
        },
        getChoreByName: async () => {
            // TODO
            return undefined
        },
        getChoresAssignedToUser: async () => {
            // TODO
            return []
        },
        getAllChoreNames: async () => {
            // TODO
            return []
        },
        addChoreCompletion: async () => {
            // TODO
            return undefined
        }
    }
}
