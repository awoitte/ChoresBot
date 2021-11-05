import { mockDB } from '../external/db'
import { User } from '../models/chat'
import { Chore } from '../models/chores'
import { Frequency, hourInMilliseconds } from '../models/time'

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

function getOutstandingUnassignedChores() {
    return [overdueChore]
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
