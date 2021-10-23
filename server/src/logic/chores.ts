import { Chore } from '../models/chores'
import { User } from '../models/chat'

export function skipChore(chore: Chore, user: User): Chore {
    const skippedBy: User[] = []

    if (chore.skippedBy != undefined) {
        skippedBy.push(...chore.skippedBy)
    }

    if (skippedBy.find((u) => u.id === user.id) === undefined) {
        skippedBy.push(user)
    }

    return {
        ...chore,
        skippedBy,
        assigned: false
    }
}

export function completeChore(chore: Chore): Chore {
    return {
        ...chore,
        assigned: false
    }
}

export function assignChore(chore: Chore, user: User): Chore {
    return {
        ...chore,
        assigned: user
    }
}

export function findUserForChore(
    chore: Chore,
    users: User[]
): User | undefined {
    return users.find((user) => {
        return isUserEligableForChore(chore, user)
    })
}

export function findChoreForUser(
    chores: Chore[],
    user: User
): Chore | undefined {
    return chores.find((chore) => {
        return isUserEligableForChore(chore, user)
    })
}

function isUserEligableForChore(chore: Chore, user: User): boolean {
    // check if a user has already skipped the chore
    if (chore.skippedBy !== undefined) {
        return chore.skippedBy.find((u) => u.id === user.id) === undefined
    }

    return true
}
