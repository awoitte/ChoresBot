export type Daily = {
    kind: 'Daily'
    time: Date
}
export type Weekly = {
    kind: 'Weekly'
    weekday: string
}

export type Yearly = {
    kind: 'Yearly'
    date: Date
}

export type Once = {
    kind: 'Once'
    date: Date
}

export type Frequency = Daily | Weekly | Yearly | Once

// For use with Date.getDay()
export const Weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
]

// For user with Date.getMonth()
export const Months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]
