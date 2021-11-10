import { Pool, PoolClient } from 'pg'

import { DB, ReadOnlyDB } from '../models/db'

import { User } from '../models/chat'
import { Chore } from '../models/chores'
import { dayInMilliseconds, Frequency } from '../models/time'
import { getChoreDueDate } from '../logic/chores'

import initDBQuery from '../queries/init-db'
import destroyDBQuery from '../queries/destroy-db'

import * as userQueries from '../queries/users'
import * as choresQueries from '../queries/chores'
import * as migrationQueries from '../queries/migrations'
import * as configQueries from '../queries/config'

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
            await performMigrations(client)
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
        getAllAssignedChores: async () => {
            const choresRes = await client.query(
                choresQueries.getAllAssignedChores
            )

            return await rowsToChores(choresRes.rows, db)
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
        },
        getConfigValue: async (key) => {
            const response = await client.query(configQueries.getValue, [key])

            if (response.rowCount === 0) {
                return null
            }

            return response.rows[0].value
        },
        setConfigValue: async (key, value) => {
            await client.query(configQueries.setValue, [key, value])
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

    // store as a tuple so we can conveniently sort by the Date
    const choresWithDueDate: [Chore, Date][] = []
    for (const chore of unassignedChores) {
        const mostRecentCompletionRes = await client.query(
            choresQueries.getMostRecentCompletionForChore,
            [chore.name]
        )

        let mostRecentCompletion

        if (mostRecentCompletionRes.rowCount >= 1) {
            mostRecentCompletion = mostRecentCompletionRes.rows[0].at
        }

        const dueDate = getChoreDueDate(chore, mostRecentCompletion)
        if (dueDate === undefined) {
            continue
        }

        if (dueDate < date) {
            choresWithDueDate.push([chore, dueDate])
        }
    }

    choresWithDueDate.sort(
        (tupleA, tupleB) => tupleA[1].getTime() - tupleB[1].getTime()
    )

    return choresWithDueDate.map((tuple) => tuple[0])
}

async function performMigrations(client: PoolClient): Promise<void> {
    const migrationIndexRes = await client.query(
        migrationQueries.getMigrationIndex
    )

    if (
        migrationIndexRes === undefined ||
        migrationIndexRes.rows.length !== 1 ||
        migrationIndexRes.rows[0] === undefined ||
        migrationIndexRes.rows[0].index === undefined
    ) {
        throw new Error('unable to parse db migrations')
    }

    const appliedMigrationsIndex = migrationIndexRes.rows[0].index

    let unappliedMigrationsIndex
    if (appliedMigrationsIndex === null) {
        // no migrations performed yet
        unappliedMigrationsIndex = 0
    } else {
        unappliedMigrationsIndex = appliedMigrationsIndex + 1
    }

    try {
        await client.query('BEGIN')

        // Note: this for loop skips itself if we already applied the last migration
        for (
            let i = unappliedMigrationsIndex;
            i < migrationQueries.Migrations.length;
            i++
        ) {
            await client.query(migrationQueries.Migrations[i])
            await client.query(migrationQueries.addMigrationIndex, [i])
        }

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    }
}
