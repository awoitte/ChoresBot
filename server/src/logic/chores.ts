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
