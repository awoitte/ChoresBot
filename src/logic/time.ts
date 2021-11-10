import { Frequency, Weekdays } from '../models/time'
import { MaybeError } from '../models/utility'
import { toTitleCase } from '../utility/strings'
import log from '../logging/log'
import moment from 'moment-timezone'

const locale = process.env.LOCALE || 'en-US'
const timeZone = process.env.TIMEZONE || 'America/New_York'

export function parseFrequency(value: string): MaybeError<Frequency> {
    const atSignIndex = value.indexOf('@')

    if (atSignIndex === -1) {
        return new Error('Frequency must include "@"')
    }

    const kind = value.slice(0, atSignIndex).trim().toLowerCase()
    const time = value.slice(atSignIndex + 1).trim()

    switch (kind) {
        case 'daily': {
            const parsedTime = parseTime(time)

            if (parsedTime === undefined) {
                return new Error(`unrecognized time of day`)
            }

            return {
                kind: 'Daily',
                time: parsedTime
            }
        }
        case 'weekly': {
            const timeLower = time.toLowerCase()

            if (Weekdays.indexOf(timeLower) === -1) {
                return new Error('Unrecognized weekday')
            }

            return {
                kind: 'Weekly',
                weekday: timeLower
            }
        }
        case 'yearly': {
            const parsedTime = parseDate(time)

            if (parsedTime === undefined) {
                return new Error(`unrecognized date`)
            }

            return {
                kind: 'Yearly',
                date: parsedTime
            }
        }
        case 'once': {
            const parsedTime = parseFullDateTime(time)

            if (parsedTime === undefined) {
                return new Error(`unrecognized date`)
            }

            return {
                kind: 'Once',
                date: parsedTime
            }
        }
        default: {
            return new Error('Unable to parse frequency')
        }
    }
}

export function frequencyToString(frequency: Frequency): string {
    switch (frequency.kind) {
        case 'Daily': {
            // the frequency time may have been created at a different daylight savings time status
            // so make a new `Date` at today's date with the time set manually to avoid offset shenanigans
            const time = new Date()
            time.setHours(frequency.time.getHours())
            time.setMinutes(frequency.time.getMinutes())

            return `${frequency.kind} @ ${formatDateTime(time, {
                timeStyle: 'short'
            })}`
        }
        case 'Weekly': {
            return `${frequency.kind} @ ${toTitleCase(frequency.weekday)}`
        }
        case 'Yearly': {
            return `${frequency.kind} @ ${formatDateTime(frequency.date, {
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            })}`
        }
        case 'Once': {
            return `${frequency.kind} @ ${formatDateTime(frequency.date, {
                dateStyle: 'medium',
                timeStyle: 'short'
            })}`
        }
        default:
            log(`kind missing in frequencyToString`)
            return 'Unknown'
    }
}

export function formatDateTime(
    date: Date,
    options?: Intl.DateTimeFormatOptions
): string {
    const fullOptions = Object.assign({}, { timeZone }, options)
    return Intl.DateTimeFormat(locale, fullOptions).format(date)
}

export function parseTime(time: string): Date | undefined {
    const validFormats = [
        'HH',
        'hh a',
        'HH:mm',
        'hh:mm a',
        'HH mm',
        'hh mm a',
        'HHmm',
        'hhmm a'
    ]
    const parsedTime = moment.tz(time, validFormats, timeZone)

    if (!parsedTime.isValid()) {
        return undefined
    }

    return parsedTime.toDate()
}

export function parseDate(date: string): Date | undefined {
    const validFormats = [
        'MMM Do',
        'MMM DD',
        'MMM Do YYYY',
        'MMM DD YYYY',
        'MM/DD',
        'MM-DD',
        'MM/DD/YYYY',
        'MM DD YYYY',
        'MM-DD-YYYY'
    ]
    const parsedDate = moment.tz(date, validFormats, timeZone)

    if (!parsedDate.isValid()) {
        return undefined
    }

    return parsedDate.toDate()
}

export function parseFullDateTime(dateTime: string): Date | undefined {
    // TODO: there's gotta be a better way
    const validFormats = [
        'MMM Do YYYY hh:mm a',
        'MMM DD YYYY hh:mm a',
        'MMM Do YYYY hh:mm a',
        'MMM DD YYYY hh:mm a',

        'MMM Do YYYY HH:mm',
        'MMM DD YYYY HH:mm',
        'MMM Do YYYY HH:mm',
        'MMM DD YYYY HH:mm',

        'MMM Do YYYY hh a',
        'MMM DD YYYY hh a',
        'MMM Do YYYY hhmm a',
        'MMM DD YYYY hhmm a',

        'MMM Do hh:mm a',
        'MMM DD hh:mm a',
        'MMM Do hh:mm a',
        'MMM DD hh:mm a',

        'MMM Do HH:mm',
        'MMM DD HH:mm',
        'MMM Do HH:mm',
        'MMM DD HH:mm',

        'MMM Do hh a',
        'MMM DD hh a',
        'MMM Do hhmm a',
        'MMM DD hhmm a',

        'HH',
        'hh a',
        'HH:mm',
        'hh:mm a',
        'HH mm',
        'hh mm a',
        'HHmm',
        'hhmm a',

        'MMM Do',
        'MMM DD',
        'MMM Do YYYY',
        'MMM DD YYYY',

        'MM/DD',
        'MM/DD hh:mm a',
        'MM/DD HH:mm',
        'MM/DD HHmm',
        'MM/DD HHmm a',

        'MM-DD',
        'MM-DD hh:mm a',
        'MM-DD HH:mm',
        'MM-DD HHmm',
        'MM-DD HHmm a',

        'MM/DD/YYYY',
        'MM/DD/YYYY hh:mm a',
        'MM/DD/YYYY HH:mm',
        'MM/DD/YYYY HHmm',
        'MM/DD/YYYY HHmm a',

        'MM DD YYYY',

        'MM-DD-YYYY',
        'MM-DD-YYYY hh:mm a',
        'MM-DD-YYYY HH:mm',
        'MM-DD-YYYY HHmm',
        'MM-DD-YYYY HHmm a'
    ]
    const parsedDateTime = moment.tz(dateTime, validFormats, timeZone)

    if (!parsedDateTime.isValid()) {
        return undefined
    }

    return parsedDateTime.toDate()
}

export function isNowBetweenTimes(start?: Date, end?: Date): boolean {
    const now = moment.tz(timeZone)
    let startTime
    if (start === undefined) {
        startTime = moment.tz(timeZone)
        startTime = startTime.hour(0)
        startTime = startTime.minute(0)
    } else {
        startTime = moment.tz(start, timeZone)
    }

    let endTime
    if (end === undefined) {
        endTime = moment.tz(timeZone)
        endTime = endTime.hour(23)
        endTime = endTime.minute(59)
    } else {
        endTime = moment.tz(end, timeZone)
    }

    const isAfterStart =
        now.hour() > startTime.hour() ||
        (now.hour() === startTime.hour() && now.minute() > startTime.minute())

    const isBeforeEnd =
        now.hour() < endTime.hour() ||
        (now.hour() === endTime.hour() && now.minute() < endTime.minute())

    return isAfterStart && isBeforeEnd
}
