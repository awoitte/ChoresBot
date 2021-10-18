import { Message } from '../models/chat'
import { Client, Intents } from 'discord.js'
import log from '../logging/log'
import { isDebugFlagSet } from '../utility/debug'

export function sendChatMessage(message: Message): void {
    log(`TODO: sendChatMessage "${message.text}"`)
}

export function initClient(): Client {
    return new Client({
        intents: [
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS
        ]
    })
}

export function login(client: Client, token: string): void {
    client.on('ready', () => {
        log(`Logged in as "${client?.user?.tag}"!`)
    })

    if (!isDebugFlagSet()) {
        client.login(token)
    }
}

export function listenToChannel(
    channel: string,
    client: Client,
    callback: (a: Message) => void
): void {
    log(`TODO: listenToChannel "${channel}"`)

    client.on('messageCreate', async (msg) => {
        log(
            `Message recieved: [${msg.author.tag} in ${msg.guild?.name}] ${msg.content}`
        )

        callback({
            text: msg.content,
            author: {
                name: msg.author.tag,
                id: msg.author.id
            }
        })

        if (msg.content === 'ping') {
            msg.react('🏓').catch((reason) => {
                log(`failed to react: '${reason}'`)
            })
        }
    })

    client.on('messageUpdate', (oldMessage, newMessage) => {
        log(
            `messageUpdate: [${newMessage.author?.username}] from "${oldMessage.content}" to "${newMessage.content}"`
        )
    })

    client.on('messageReactionAdd', (reaction, user) => {
        log(`messageReactionAdd: [${user.username}] ${reaction.emoji}`)
    })

    client.on('messageReactionRemove', (reaction, user) => {
        log(`messageReactionRemove: [${user.username}] ${reaction.emoji}`)
    })
}
