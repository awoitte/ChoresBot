import { Chore, ChoreCompletion } from '../models/chores'
import { User } from '../models/chat'
import { dayInMilliseconds, weekInMilliseconds, Weekdays } from '../models/time'
import { frequencyToString } from './time'
import log from '../logging/log'

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
    let description = `Chore "${chore.name}"
Frequency: ${frequencyToString(chore.frequency)}`

    if (chore.assigned === false) {
        description += `\nCurrently unassigned`
    } else {
        description += `\nCurrently assigned to @${chore.assigned.name}`
    }

    if (mostRecentCompletion !== undefined) {
        description += `\nMost recently completed at: ${mostRecentCompletion.at.toString()} by ${
            mostRecentCompletion.by.name
        }`
    } else {
        description += `\nNever completed`
    }

    if (chore.skippedBy !== undefined) {
        const skippedList = chore.skippedBy
            .map((user) => `@${user.name}`)
            .join(', ')
        description += `\nRecently skipped by ${skippedList}`
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

export function isChoreOverdue(
    chore: Chore,
    mostRecentCompletion: Date | undefined,
    now: Date
): boolean {
    const frequency = chore.frequency

    if (mostRecentCompletion === undefined) {
        if (frequency.kind === 'Once') {
            return frequency.date.getTime() < now.getTime()
        } else {
            //a recurring chore that has never been completed is always due
            return true
        }
    }

    if (mostRecentCompletion.getTime() > now.getTime()) {
        log(
            `Warning! Chore was somehow completed in the future. Chore "${
                chore.name
            }". Completed [${mostRecentCompletion.getTime()}]. Now [${now.getTime()}].`
        )
        return false
    }

    const completion = mostRecentCompletion // for brevity
    switch (frequency.kind) {
        case 'Daily': {
            const startOfDay = new Date(now.getTime())
            startOfDay.setHours(0)
            startOfDay.setMinutes(0)

            if (completion.getTime() > startOfDay.getTime()) {
                // already completed today
                return false
            }

            const startOfYesterday = new Date(
                startOfDay.getTime() - dayInMilliseconds
            )
            if (completion.getTime() < startOfYesterday.getTime()) {
                // if it wasn't completed yesterday it's always overdue
                return true
            }

            const timeDue = frequency.time
            const pastTheHour = timeDue.getHours() < now.getHours()
            const pastMinutesOnTheHour =
                timeDue.getHours() === now.getHours() &&
                timeDue.getMinutes() < now.getMinutes()
            // don't worry about seconds

            return pastTheHour || pastMinutesOnTheHour
        }
        case 'Weekly': {
            const dayNow = now.getDay()

            const startOfThisWeek = new Date(now.getTime()) // deep clone
            startOfThisWeek.setTime(now.getTime() - dayNow * dayInMilliseconds) // setDay(0)

            if (completion.getTime() > startOfThisWeek.getTime()) {
                // completed already this week
                return false
            }

            const startOfLastWeek = new Date(
                startOfThisWeek.getTime() - weekInMilliseconds
            )

            if (completion.getTime() < startOfLastWeek.getTime()) {
                return true
            }

            const dayDue = Weekdays.indexOf(frequency.weekday.toLowerCase())

            return dayDue <= dayNow
        }
        case 'Yearly': {
            // TODO
            return false
        }
        case 'Once': {
            // if we made it here then it's already been completed
            return false
        }
        default:
            throw new Error('unable to parse frequency')
    }
}
