import { User } from '../models/chat'
import { Chore } from '../models/chores'

import { Pool } from 'pg'

export interface ReadOnlyDB {
    getAssignableUsersInOrderOfRecentCompletion: () => Promise<User[]>

    // outstanding meaning past their scheduled time
    getOutstandingUnassignedChores: () => Promise<Chore[]>

    // upcoming meaning before their scheduled time
    getUpcomingUnassignedChores: () => Promise<Chore[]>

    getChoreByName: (name: string) => Promise<Chore | undefined>
    getChoresAssignedToUser: (user: User) => Promise<Chore[]>
    getAllChoreNames: () => Promise<string[]>
}

export interface DB extends ReadOnlyDB {
    addUser: (user: User) => Promise<undefined>
    deleteUser: (user: User) => Promise<undefined>

    addChore: (chore: Chore) => Promise<undefined>
    modifyChore: (chore: Chore) => Promise<undefined>
    deleteChore: (name: string) => Promise<undefined>
}

export const mockDB: DB = {
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
    }
}

export async function pgDB(pool: Pool): Promise<DB> {
    pool.query('SELECT $1::text as message', ['Hello world!'])
    return {
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
        }
    }
}

export async function initPostgresDB(pool: Pool): Promise<void> {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        await client.query(`CREATE TABLE test (
            test_col INT
        )`)
    } catch (e) {
        client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

export async function destroyPostgresDB(pool: Pool): Promise<void> {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        await client.query(`DROP TABLE test`)
    } catch (e) {
        client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}
