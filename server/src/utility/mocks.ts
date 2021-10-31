import { mockDB } from '../external/db'
import { User } from '../models/chat'
import { Chore } from '../models/chores'
import { Frequency } from '../models/time'

export const User1: User = {
    name: 'mockName',
    id: 'mockID'
}

export const User2: User = {
    name: 'mockUser2',
    id: 'mockUser2'
}

export const Once: Frequency = {
    kind: 'Once',
    date: new Date()
}

export const UpcomingChore: Chore = {
    name: 'walk the cat',
    assigned: User1,
    frequency: Once
}

export const AssignedChore: Chore = {
    name: 'floop the pig',
    assigned: User1,
    frequency: Once
}

export const OutstandingChore: Chore = {
    name: 'make a pile',
    assigned: User1,
    frequency: Once
}

export const GenericChore: Chore = {
    name: 'clean the dirt',
    assigned: User1,
    skippedBy: [User1],
    frequency: Once
}

function getUpcomingUnassignedChores() {
    return [UpcomingChore]
}

function getAssignableUsersInOrderOfRecentCompletion() {
    return [User1]
}

function getChoresAssignedToUser() {
    return [AssignedChore]
}

function getOutstandingUnassignedChores() {
    return [OutstandingChore]
}

function getChoreByName() {
    return GenericChore
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
