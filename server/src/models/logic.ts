import {Message} from './chat'
import {Chore} from './chores'
import { Schedule } from './time'

export type Action = SendMessage | CompleteChore | DeclineChore | AddChore | ModifyChore | DeleteChore

export type SendMessage = {
    kind: 'SendMessage'
    message: Message
}

export type CompleteChore = {
    kind: 'CompleteChore'
    chore: Chore
}

export type DeclineChore = {
    kind: 'DeclineChore'
    chore: Chore;
    permenant: boolean
}

export type AddChore = {
    kind: 'AddChore'
    chore: Chore
    schedule: Schedule
}

export type ModifyChore = {
    kind: 'ModifyChore'
    chore: Chore
    schedule: Schedule
}

export type DeleteChore = {
    kind: 'DeleteChore'
    chore: Chore
}
