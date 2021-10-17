import { Message } from '../models/chat'
import { Action, Nothing } from '../models/logic'
import log from '../logging/log'

export function messageHandler(message: Message): Action  {
    log(`TODO handling a message: "${message.text}"`)

    return Nothing
}