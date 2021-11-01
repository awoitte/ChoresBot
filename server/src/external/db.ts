import { Pool } from 'pg'

import { User } from '../models/chat'
import { Chore, ChoreCompletion } from '../models/chores'

import initDBQuery from '../queries/init-db'
import destroyDBQuery from '../queries/destroy-db'
import * as userQueries from '../queries/users'
import * as choresQueries from '../queries/chores'

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

    getAllChoreCompletions: (choreName: string) => Promise<ChoreCompletion[]>
}

export interface DB extends ReadOnlyDB {
    addUser: (user: User) => Promise<void>
    deleteUser: (user: User) => Promise<void>

    addChore: (chore: Chore) => Promise<void>
    modifyChore: (chore: Chore) => Promise<void>
    deleteChore: (name: string) => Promise<void>

    addChoreCompletion: (choreName: string, user: User) => Promise<void>
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
    },
    getAllChoreCompletions: async () => {
        return []
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

    // Cleanup
    // https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
    process.stdin.resume() //so the program will not close instantly

    async function exitHandler() {
        await client.release()
        process.exit()
    }

    //do something when app is closing
    process.on('exit', exitHandler)

    //catches ctrl+c event
    process.on('SIGINT', exitHandler)

    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler)
    process.on('SIGUSR2', exitHandler)

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler)

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
        deleteUser: async (user) => {
            await client.query(userQueries.deleteUser, [user.id])
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
        addChore: async (chore) => {
            await client.query(choresQueries.addChores, [chore.name])
        },
        modifyChore: async () => {
            // TODO
            return undefined
        },
        deleteChore: async (choreName) => {
            await client.query(choresQueries.deleteChore, [choreName])
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
            const choresRes = await client.query(choresQueries.getAllChoreNames)

            return choresRes.rows.map((row) => row.name)
        },
        addChoreCompletion: async (choreName, user) => {
            await client.query(choresQueries.completeChore, [
                choreName,
                user.id
            ])
        },
        getAllChoreCompletions: async (choreName) => {
            const choresRes = await client.query(
                choresQueries.getChoreCompletions,
                [choreName]
            )

            return choresRes.rows.map((row) => ({
                choreName,
                by: row.by,
                at: row.at
            }))
        }
    }
}
