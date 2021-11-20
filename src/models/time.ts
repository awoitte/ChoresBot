export type Daily = {
    kind: 'Daily'
    time: Date
}

export type Weekly = {
    kind: 'Weekly'
    weekday: string
}

export type Monthly = {
    kind: 'Monthly'
    date: Date
}

export type Yearly = {
    kind: 'Yearly'
    date: Date
}

export type Once = {
    kind: 'Once'
    date: Date
}

export type Frequency = Daily | Weekly | Monthly | Yearly | Once

// For use with Date.getDay()
export const Weekdays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
]

// For user with Date.getMonth()
export const Months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
]

export const hourInMilliseconds =
    1000 * // milliseconds per second
    60 * // seconds per minute
    60 // minutes per hour

export const dayInMilliseconds = hourInMilliseconds * 24 //hours per day

export const weekInMilliseconds = dayInMilliseconds * 7 // days per week
