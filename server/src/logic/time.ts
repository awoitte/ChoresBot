import { Frequency, Months } from '../models/time'
import { MaybeError } from '../models/utility'
import log from '../logging/log'

export function parseFrequency(value: string): MaybeError<Frequency> {
    const atSignIndex = value.indexOf('@')

    if (atSignIndex === -1) {
        return new Error('Frequency must include "@"')
    }

    const kind = value.slice(0, atSignIndex).trim().toLowerCase()
    const time = value.slice(atSignIndex + 1).trim()

    switch (kind) {
        case 'daily':
            return {
                kind: 'Daily',
                time: new Date(time)
            }
        case 'weekly':
            return {
                kind: 'Weekly',
                weekday: time
            }
        case 'yearly':
            return {
                kind: 'Yearly',
                date: new Date(time)
            }
        case 'once':
            return {
                kind: 'Once',
                date: new Date(time)
            }
        default:
            return new Error('Unable to parse frequency')
    }
}

export function frequencyToString(frequency: Frequency): string {
    switch (frequency.kind) {
        case 'Daily': {
            const hours = `${frequency.time.getHours()}:${frequency.time.getMinutes()}`
            return `${frequency.kind} @ ${hours}`
        }
        case 'Weekly': {
            return `${frequency.kind} @ ${frequency.weekday}`
        }
        case 'Yearly': {
            const month = Months[frequency.date.getMonth()]
            return `${frequency.kind} @ ${month}`
        }
        case 'Once': {
            const month = Months[frequency.date.getMonth()]
            return `${
                frequency.kind
            } @ ${month} ${frequency.date.getDate()} ${frequency.date.getFullYear()}`
        }
        default:
            log(`kind missing in frequencyToString`)
            return 'Unknown'
    }
}
