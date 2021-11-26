import { DB } from '../models/db'
import { PostgresDB, pgDB } from '../external/db'
import { Chat, User } from '../models/chat'
import { Chore } from '../models/chores'
import { Config } from '../models/config'
import { Frequency, Months, hourInMilliseconds } from '../models/time'

export const config: Config = {
    debug: false,
    verbose: false,
    clientUrlRoot: 'localhost',
    discordChannel: 'chores'
}

export const beforeDST: Date = new Date()
beforeDST.setFullYear(2021)
beforeDST.setMonth(Months.indexOf('November'))
beforeDST.setDate(6)

export const afterDST: Date = new Date(beforeDST.getTime())
afterDST.setDate(7)

export const user1: User = {
    name: 'mockName',
    id: 'mockID'
}

export const user2: User = {
    name: 'mockUser2',
    id: 'mockUser2'
}

export const user3: User = {
    name: 'mockUser3',
    id: 'mockUser3'
}

export const once: Frequency = {
    kind: 'Once',
    date: new Date()
}

export const assignedChore: Chore = {
    name: 'floop the pig',
    assigned: user1,
    frequency: once
}

export const genericChore: Chore = {
    name: 'clean the dirt',
    assigned: false,
    frequency: once
}

export const skippedChore: Chore = {
    name: 'polish the plants',
    assigned: false,
    skippedBy: [user1, user2, user3],
    frequency: once
}

const overdueDate = new Date()
overdueDate.setTime(overdueDate.getTime() - hourInMilliseconds)

const overdue: Frequency = {
    kind: 'Once',
    date: overdueDate
}

export const overdueChore: Chore = Object.assign({}, genericChore, {
    name: 'make a pile',
    frequency: overdue,
    assigned: false
})

const moreOverdueDate = new Date(overdueDate.getTime() - hourInMilliseconds)

const moreOverdue: Frequency = {
    kind: 'Once',
    date: moreOverdueDate
}

export const moreOverdueChore: Chore = Object.assign({}, genericChore, {
    name: 'make more piles',
    frequency: moreOverdue,
    assigned: false
})

const upcomingDate = new Date()
upcomingDate.setTime(upcomingDate.getTime() + hourInMilliseconds)

const upcoming: Frequency = {
    kind: 'Once',
    date: upcomingDate
}

export const upcomingChore: Chore = Object.assign({}, genericChore, {
    name: 'upcoming',
    frequency: upcoming,
    assigned: false
})

const furtherUpcomingDate = new Date(
    upcomingDate.getTime() + hourInMilliseconds
)

const furtherUpcoming: Frequency = {
    kind: 'Once',
    date: furtherUpcomingDate
}

export const furtherUpcomingChore: Chore = Object.assign({}, genericChore, {
    name: 'further upcoming',
    frequency: furtherUpcoming,
    assigned: false
})

function getUpcomingUnassignedChores() {
    return [upcomingChore]
}

function getAssignableUsersInOrderOfRecentCompletion() {
    return [user1]
}

function getChoresAssignedToUser() {
    return [assignedChore]
}

function getAllAssignedChores() {
    return [assignedChore]
}

function getOutstandingUnassignedChores() {
    return [overdueChore]
}

function getChoreByName() {
    return genericChore
}

function getAllChoreNames() {
    return [genericChore.name]
}

export const emptyDB: DB = {
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
        return genericChore
    },
    getChoresAssignedToUser: async () => {
        return []
    },
    getAllChoreNames: async () => {
        return [genericChore.name]
    },
    getAllAssignedChores: async () => {
        return []
    },
    addChoreCompletion: async () => {
        return undefined
    },
    getAllChoreCompletions: async () => {
        return []
    },
    getConfigValue: async () => {
        return null
    },
    setConfigValue: async () => {
        return undefined
    }
}

export const DBWithUpcoming = Object.assign({}, emptyDB, {
    getUpcomingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

export const DBWithChoreAssigned = Object.assign({}, emptyDB, {
    getChoresAssignedToUser,
    getAllAssignedChores
})

export const DBWithOutstandingChores = Object.assign({}, emptyDB, {
    getOutstandingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

export const DBWithChoreByName = Object.assign({}, emptyDB, {
    getChoreByName
})

export const DBWithAllChoreNames = Object.assign({}, emptyDB, {
    getAllChoreNames
})

export async function withTestDB(
    callback: (db: PostgresDB) => Promise<void>
): Promise<void> {
    const connectionString = process.env.CHORES_BOT_TEST_DB

    if (connectionString === undefined) {
        console.log(
            'No environment variable set for CHORES_BOT_TEST_DB. Please set this to the postgresql connection string to use for database testing.'
        )
    } else {
        const db: PostgresDB = await pgDB(connectionString)

        await db.destroyEntireDB() // if prior tests crashed there might be bad data to clean up

        await callback(db)
    }
}

export const chat: Chat = {
    login: async () => {
        return
    },
    sendChatMessage: async (message) => {
        console.log(message.text)
    }
}
