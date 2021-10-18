import { ChoresBotUser, Message } from '../models/chat'
import { Action } from '../models/logic'
import log from '../logging/log'

export function messageHandler(message: Message): Action[]  {
    log(`TODO handling a message: "${message.text}"`)

    if(message.text.toLowerCase() == "ping") {
        return [{
            kind: 'SendMessage',
            message: {
                text: 'pong',
                channel: '',
                author: ChoresBotUser
            }}]
    }

    return []
}