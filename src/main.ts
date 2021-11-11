import express from 'express'

import { Chat } from './models/chat'
import { initChat } from './external/chat'

import { DB } from './models/db'
import { pgDB } from './external/db'

import log from './utility/log'

import { isDebugFlagSet } from './utility/debug'
import { asyncLoop } from './utility/async'

import { Action } from './models/actions'

import { emptyDB as mockDB, chat as mockChat } from './utility/mocks'

import { loop, messageHandler } from './logic/main'
import { parseTime } from './logic/time'
;(async () => {
    // --- Config ---
    const serverPort: string = process.env.PORT || '80'
    const dbConnectionString = process.env.POSTGRESQL_ADDON_URI || ''
    const frequencyString = process.env.FREQUENCY || '120'
    let frequency = parseInt(frequencyString, 10)
    if (isNaN(frequency)) {
        frequency = 120
    }
    const channel = process.env.DISCORD_CHANNEL || 'chores'
    const token = process.env.DISCORD_TOKEN || ''

    let morningTime: Date | undefined
    if (process.env.MORNING_TIME !== undefined) {
        morningTime = parseTime(process.env.MORNING_TIME)
    }
    if (morningTime === undefined) {
        // check `morningTime` is undefined instead of
        // `process.env.MORNING_TIME` to handle the case that
        // `MORNING_TIME` was set but was an invalid format
        morningTime = parseTime('7:00 AM')
    }

    let nightTime: Date | undefined
    if (process.env.NIGHT_TIME !== undefined) {
        nightTime = parseTime(process.env.NIGHT_TIME)
    }
    if (nightTime === undefined) {
        nightTime = parseTime('11:00 PM')
    }

    // --- Server ---
    const app = express()

    app.use(express.static('./client/dist'))

    app.listen(serverPort, () => {
        log(`Listening at http://localhost:${serverPort}`)
    })

    // --- External Services ---
    let db: DB
    let chat: Chat
    if (isDebugFlagSet()) {
        db = mockDB
        chat = mockChat
    } else {
        const pgdb = await pgDB(dbConnectionString)
        db = pgdb
        await pgdb.initDB()

        chat = await initChat(channel, async (msg) => {
            const actions = await messageHandler(msg, db).catch((e) => {
                log(`Error in message handler!: ${e}`)
                return []
            })

            log(`message actions: ${JSON.stringify(actions)}`)
            await performActions(actions, chat, db).catch((e) => {
                log(`Error performing actions!: ${e}`)
            })
        })

        await chat.login(token)
    }

    // --- Chat Bot ---
    asyncLoop(
        async () => {
            const actions = await loop(db, morningTime, nightTime).catch(
                (e) => {
                    log(`Error in main loop!: ${e}`)
                    return []
                }
            )

            log(`loop actions: ${JSON.stringify(actions)}`)
            await performActions(actions, chat, db).catch((e) => {
                log(`Error performing actions!: ${e}`)
            })

            return true // keep looping
        },
        frequency * 1000,
        false,
        true
    )
})()

async function performActions(
    actions: Action[],
    chat: Chat,
    db: DB
): Promise<void> {
    // Note: If one action fails the following actions won't be performed

    for (const action of actions) {
        switch (action.kind) {
            case 'SendMessage': {
                await chat.sendChatMessage(action.message)
                break
            }
            case 'CompleteChore': {
                await db.addChoreCompletion(action.chore.name, action.user)
                await db.modifyChore(action.chore)
                break
            }
            case 'AddChore': {
                await db.addChore(action.chore)
                break
            }
            case 'ModifyChore': {
                await db.modifyChore(action.chore)
                break
            }
            case 'DeleteChore': {
                await db.deleteChore(action.chore.name)
                break
            }
            case 'AddUser': {
                await db.addUser(action.user)
                break
            }
            case 'DeleteUser': {
                await db.deleteUser(action.user)
                break
            }
        }
    }
}
