import { mockDB } from '../external/db'
import { User } from '../models/chat'
import { Chore } from '../models/chores'
import { Frequency } from '../models/time'

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

export const upcomingChore: Chore = {
    name: 'walk the cat',
    assigned: user1,
    frequency: once
}

export const assignedChore: Chore = {
    name: 'floop the pig',
    assigned: user1,
    frequency: once
}

export const outstandingChore: Chore = {
    name: 'make a pile',
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

function getUpcomingUnassignedChores() {
    return [upcomingChore]
}

function getAssignableUsersInOrderOfRecentCompletion() {
    return [user1]
}

function getChoresAssignedToUser() {
    return [assignedChore]
}

function getOutstandingUnassignedChores() {
    return [outstandingChore]
}

function getChoreByName() {
    return genericChore
}

export const DBWithUpcoming = Object.assign({}, mockDB, {
    getUpcomingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

export const DBWithChoreAssigned = Object.assign({}, mockDB, {
    getChoresAssignedToUser
})

export const DBWithOutstandingChores = Object.assign({}, mockDB, {
    getOutstandingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

export const DBWithChoreByName = Object.assign({}, mockDB, {
    getChoreByName
})
