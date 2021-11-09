import { Pool, PoolClient } from 'pg'

import { User } from '../models/chat'
import { Chore, ChoreCompletion } from '../models/chores'
import { dayInMilliseconds, Frequency } from '../models/time'
import { getChoreDueDate } from '../logic/chores'

import initDBQuery from '../queries/init-db'
import destroyDBQuery from '../queries/destroy-db'
import * as userQueries from '../queries/users'
import * as choresQueries from '../queries/chores'

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
    getUserByID: async () => {
        return undefined
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

    const db: PostgresDB = {
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

            return userRes.rows.map(rowToUser)
        },
        getUserByID: async (id) => {
            const userRes = await client.query(userQueries.getUserByID, [id])

            if (userRes.rowCount != 1) {
                return
            }

            return rowToUser(userRes.rows[0])
        },
        getAssignableUsersInOrderOfRecentCompletion: async () => {
            const userRes = await client.query(
                userQueries.getUnassignedUsersSortedByCompletions
            )

            return userRes.rows.map(rowToUser)
        },
        getOutstandingUnassignedChores: async () => {
            const now = new Date()
            return getUnassignedOutstandingChoresAsOfDate(client, db, now)
        },
        getUpcomingUnassignedChores: async () => {
            const now = new Date()
            const tomorrow = new Date(now.getTime() + dayInMilliseconds)
            return getUnassignedOutstandingChoresAsOfDate(client, db, tomorrow)
        },
        addChore: async (chore) => {
            await client.query(
                choresQueries.addChores,
                choreToQueryParams(chore)
            )

            await addChoreSkips(chore, client)
        },
        modifyChore: async (chore) => {
            await client.query(
                choresQueries.modifyChore,
                choreToQueryParams(chore)
            )

            await addChoreSkips(chore, client)
        },
        deleteChore: async (choreName) => {
            await client.query(choresQueries.deleteChore, [choreName])
        },
        getChoreByName: async (choreName) => {
            const choreRes = await client.query(choresQueries.getChoreByName, [
                choreName
            ])

            if (choreRes.rowCount != 1) {
                return
            }

            return await rowToChore(choreRes.rows[0], db)
        },
        getChoresAssignedToUser: async (user) => {
            const choresRes = await client.query(
                choresQueries.getChoresAssignedToUser,
                [user.id]
            )

            return await rowsToChores(choresRes.rows, db)
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
                by: {
                    name: row.name,
                    id: row.by
                },
                at: row.at
            }))
        }
    }

    return db
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
function choreToQueryParams(chore: Chore): any[] {
    let date, weekday, assigned
    if (chore.frequency.kind === 'Weekly') {
        weekday = chore.frequency.weekday
    } else if (chore.frequency.kind === 'Daily') {
        date = chore.frequency.time
    } else {
        date = chore.frequency.date
    }

    if (chore.assigned !== false) {
        assigned = chore.assigned.id
    }

    return [chore.name, assigned, chore.frequency.kind, date, weekday]
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
function rowToUser(row: any): User {
    return {
        name: row.name,
        id: row.id
    }
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function rowToChore(row: any, db: ReadOnlyDB): Promise<Chore> {
    let assigned: false | User = false
    if (row.assigned !== null) {
        const user = await db.getUserByID(row.assigned)

        if (user === undefined) {
            throw new Error('unable to find assigned user')
        }

        assigned = user
    }

    const chore: Chore = {
        name: row.name,
        assigned,
        frequency: parseFrequencyRowData(
            row.frequency_kind,
            row.frequency_weekday,
            row.frequency_date
        )
    }

    if (Array.isArray(row.skipped_by)) {
        const skips = row.skipped_by.filter((x: any) => x !== null)
        // null is returned if there aren't any skips

        if (skips.length > 0) {
            chore.skippedBy = []

            for (const userID of skips) {
                const user = await db.getUserByID(userID)
                if (user !== undefined) {
                    chore.skippedBy.push(user)
                }
            }
        }
    }

    return chore
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
async function rowsToChores(rows: any[], db: ReadOnlyDB): Promise<Chore[]> {
    const chores: Chore[] = []

    for (const row of rows) {
        chores.push(await rowToChore(row, db))
    }

    return chores
}

function parseFrequencyRowData(
    kind: string,
    weekday: string,
    date: Date
): Frequency {
    switch (kind) {
        case 'Daily':
            return {
                kind: 'Daily',
                time: date
            }
        case 'Weekly':
            return {
                kind: 'Weekly',
                weekday: weekday
            }
        case 'Yearly':
            return {
                kind: 'Yearly',
                date: date
            }
        case 'Once':
            return {
                kind: 'Once',
                date: date
            }
        default:
            throw new Error('unable to parse frequency')
    }
}

async function addChoreSkips(chore: Chore, client: PoolClient): Promise<void> {
    if (chore.skippedBy !== undefined) {
        for (const user of chore.skippedBy) {
            // query only adds if one doesn't already exist
            await client.query(choresQueries.addSkip, [chore.name, user.id])
        }
    }
}

async function getUnassignedOutstandingChoresAsOfDate(
    client: PoolClient,
    db: DB,
    date: Date
) {
    const unassignedRes = await client.query(
        choresQueries.getAllUnassignedChores
    )

    const unassignedChores = await rowsToChores(unassignedRes.rows, db)

    const upcomingChores: [Chore, Date][] = []
    for (const chore of unassignedChores) {
        const recentCompletionRes = await client.query(
            choresQueries.getMostRecentCompletionForChore,
            [chore.name]
        )
        let recentCompletion

        if (recentCompletionRes.rowCount >= 1) {
            recentCompletion = recentCompletionRes.rows[0].at
        }

        const dueDate = getChoreDueDate(chore, recentCompletion)
        if (dueDate === undefined) {
            continue
        }

        if (dueDate < date) {
            upcomingChores.push([chore, dueDate])
        }
    }

    upcomingChores.sort(
        (tupleA, tupleB) => tupleA[1].getTime() - tupleB[1].getTime()
    )

    return upcomingChores.map((tuple) => tuple[0])
}
