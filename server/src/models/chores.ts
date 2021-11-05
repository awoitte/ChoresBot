import { User } from './chat'
import { Frequency } from './time'

export type Chore = {
    name: string
    assigned: User | false
    frequency: Frequency
    skippedBy?: User[]
}

export type ChoreCompletion = {
    choreName: string
    by: User
    at: Date
}
