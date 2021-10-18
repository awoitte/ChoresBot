export type Daily = {
    time: Date
}
export type Weekly = {
    day: DayOfWeek
    time: Date
}

export type Yearly = {
    date: Date
}

export type DayOfWeek =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday'

export type SpecificDate = {
    date: Date
}

export type Schedule = Daily | Weekly | Yearly | SpecificDate
