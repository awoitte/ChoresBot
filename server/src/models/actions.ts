import { Message } from './chat'
import { Chore } from './chores'

export type Action =
    | SendMessage
    | CompleteChore
    | AddChore
    | ModifyChore
    | DeleteChore

export type SendMessage = {
    kind: 'SendMessage'
    message: Message
}

export type CompleteChore = {
    kind: 'CompleteChore'
    chore: Chore
}

export type AddChore = {
    kind: 'AddChore'
    chore: Chore
}

export type ModifyChore = {
    kind: 'ModifyChore'
    chore: Chore
}

export type DeleteChore = {
    kind: 'DeleteChore'
    chore: Chore
}
