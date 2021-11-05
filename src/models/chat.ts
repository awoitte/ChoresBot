export type Message = {
    text: string
    author: User
}

export type User = {
    name: string
    id: string
}

export const ChoresBotUser: User = {
    name: 'ChoresBot',
    id: ''
}
