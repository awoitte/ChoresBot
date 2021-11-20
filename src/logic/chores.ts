import { Chore, ChoreCompletion } from '../models/chores'
import { User } from '../models/chat'
import { dayInMilliseconds, Weekdays } from '../models/time'
import { frequencyToString, formatDateTime } from './time'
import { bold } from '../external/chat'

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
        assigned: false,
        skippedBy: undefined
    }
}

export function assignChore(chore: Chore, user: User): Chore {
    return {
        ...chore,
        assigned: user
    }
}

export function unassignChore(chore: Chore): Chore {
    return {
        ...chore,
        assigned: false
    }
}

export function describeChore(
    chore: Chore,
    mostRecentCompletion: ChoreCompletion | undefined
): string {
    let description = `${bold('Chore')}: "${chore.name}"
${bold('Frequency')}: ${frequencyToString(chore.frequency)}`

    if (chore.assigned === false) {
        const nextDueDate = getChoreDueDate(chore, mostRecentCompletion?.at)
        if (nextDueDate) {
            description += `\n${bold(
                'Next scheduled assignment'
            )}: ${formatDateTime(nextDueDate, {
                dateStyle: 'short',
                timeStyle: 'short'
            })}`
        } else {
            description += bold(`\nNo future due date`)
        }
    } else {
        // Note: don't actually tag the user so we don't ping them
        description += `\n${bold('Currently assigned to')}: @${
            chore.assigned.name
        }`
    }

    if (mostRecentCompletion !== undefined) {
        description += `\n${bold(
            'Most recently completed at'
        )}: ${formatDateTime(mostRecentCompletion.at, {
            dateStyle: 'short'
        })} by ${mostRecentCompletion.by.name}`
    } else {
        description += bold(`\nNever completed`)
    }

    if (chore.skippedBy !== undefined) {
        const skippedList = chore.skippedBy
            .map((user) => `@${user.name}`)
            .join(', ')
        description += `\n${bold('Recently skipped by')}: ${skippedList}`
    }

    return description
}

export function findUserForChore(
    chore: Chore,
    users: User[]
): User | undefined {
    return users.find((user) => {
        return isUserEligibleForChore(chore, user)
    })
}

export function findChoreForUser(
    chores: Chore[],
    user: User
): Chore | undefined {
    return chores.find((chore) => {
        return isUserEligibleForChore(chore, user)
    })
}

function isUserEligibleForChore(chore: Chore, user: User): boolean {
    // check if a user has already skipped the chore
    if (chore.skippedBy !== undefined) {
        return chore.skippedBy.find((u) => u.id === user.id) === undefined
    }

    return true
}

export function getChoreDueDate(
    chore: Chore,
    mostRecentCompletion: Date | undefined
): Date | undefined {
    const frequency = chore.frequency

    if (mostRecentCompletion === undefined) {
        if (frequency.kind === 'Once') {
            return frequency.date
        } else {
            // a recurring chore that has never been completed is due ASAP
            // ASAP here represented by a date in the far-ish past (unix epoch)
            return new Date(0)
        }
    }

    const completion = mostRecentCompletion // for brevity
    switch (frequency.kind) {
        case 'Daily': {
            // due one day after the latest completion at the time specified
            const due = new Date(completion.getTime() + dayInMilliseconds)
            due.setHours(frequency.time.getHours())
            due.setMinutes(frequency.time.getMinutes())
            return due
        }
        case 'Weekly': {
            // due one week after latest completion on the day specified
            const weekday = Weekdays.indexOf(frequency.weekday)
            if (weekday === -1) {
                throw new Error('unable to parse weekday')
            }

            // weekdays are tricky as there's no way to directly set a date to a specific weekday
            // we'll need to advance one day at a time instead

            let due = new Date(completion.getTime())
            // advance until we're at the start of next week
            do {
                // use do...while to avoid false positive if completion was on weekday 0
                due = new Date(due.getTime() + dayInMilliseconds)
            } while (due.getDay() !== 0)

            while (due.getDay() != weekday) {
                // advance until we're at the proper weekday
                due = new Date(due.getTime() + dayInMilliseconds)
            }

            due.setHours(0)
            due.setMinutes(0)

            return due
        }
        case 'Monthly': {
            // due one month after latest completion on the day/time specified

            const due = new Date(completion.getTime())

            const completionMonth = completion.getMonth()
            if (completionMonth === 11) {
                // if last completion was in december we need to account for the year wrapping
                due.setMonth(0)
                due.setFullYear(completion.getFullYear() + 1)
            } else {
                due.setMonth(completion.getMonth() + 1)
            }

            due.setDate(frequency.date.getDate())
            due.setHours(frequency.date.getHours())
            due.setMinutes(frequency.date.getMinutes())

            return due
        }
        case 'Yearly': {
            // due one year after latest completion at the month/day/time specified
            const due = new Date(frequency.date.getTime())
            due.setFullYear(completion.getFullYear() + 1)
            return due
        }
        case 'Once': {
            // if we made it here then it's already been completed (and will never be due)
            return undefined
        }
        default:
            throw new Error('unable to parse frequency')
    }
}

export function isChoreOverdue(
    chore: Chore,
    mostRecentCompletion: Date | undefined,
    now: Date
): boolean {
    const dueDate = getChoreDueDate(chore, mostRecentCompletion)
    if (dueDate === undefined) {
        // it's never due, so it's not overdue
        return false
    }

    return now.getTime() > dueDate.getTime()
}
