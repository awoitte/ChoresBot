export type Message = {
    text: string
    channel: Channel
    author: User
}

// eg. "#main"
export type Channel = string

export type User = {
    name: string
    id: string
}

export const ChoresBotUser: User = {
    name: 'ChoresBot',
    id: ''
}
