import { Message, User } from '../models/chat'
import { Client, Intents, TextChannel } from 'discord.js'
import { userMention } from '@discordjs/builders'
import log from '../utility/log'
import { Chat } from '../models/chat'

export async function initChat(
    channelName: string,
    callback: (message: Message) => Promise<void>
): Promise<Chat> {
    const client = new Client({
        intents: [
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS
        ]
    })

    client.on('messageCreate', async (msg) => {
        if (
            msg.channel instanceof TextChannel &&
            msg.channel.name == channelName &&
            !msg.author.bot // if ChoresBot isn't the author
        ) {
            callback({
                text: msg.content,
                author: {
                    name: msg.author.tag,
                    id: msg.author.id
                }
            })
        }

        if (msg.content === 'ping') {
            msg.react('🏓').catch((reason) => {
                log(`failed to react: '${reason}'`)
            })
        }
    })

    return {
        login: async (token) => {
            client.on('ready', () => {
                log(`Logged in as "${client?.user?.tag}"!`)
            })

            client.login(token)
        },
        sendChatMessage: async (message) => {
            const guilds = await client.guilds.fetch()

            if (guilds.size === 0) {
                throw new Error('Not registered to any guilds/servers')
            }

            if (guilds.size != 1) {
                log(
                    `Warning: ChoresBot is registered to multiple guilds/servers, sending messages to all`
                )
            }

            for (const guildRef of guilds.values()) {
                const guild = await guildRef.fetch()
                const channels = await guild.channels.fetch()

                for (const channel of channels.values()) {
                    if (
                        channel instanceof TextChannel &&
                        channel.name == channelName
                    ) {
                        channel.send(message.text)
                    }
                }
            }
        }
    }
}

export function tagUser(user: User): string {
    return userMention(user.id)
}

export { bold, underscore, italic, inlineCode } from '@discordjs/builders'
