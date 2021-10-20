import { User } from './chat'
import { Schedule } from './time'

export type Chore = {
    name: string
    assigned?: User | false
    frequency?: Schedule
    skippedBy?: User[]
}
