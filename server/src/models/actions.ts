import { Message, User } from './chat'
import { Chore } from './chores'

export type Action =
    | SendMessage
    | CompleteChore
    | AddChore
    | ModifyChore
    | DeleteChore
    | AddUser
    | DeleteUser

export type SendMessage = {
    kind: 'SendMessage'
    message: Message
}

export type CompleteChore = {
    kind: 'CompleteChore'
    chore: Chore
    user: User
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

export type AddUser = {
    kind: 'AddUser'
    user: User
}

export type DeleteUser = {
    kind: 'DeleteUser'
    user: User
}
