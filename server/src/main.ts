import express from 'express'

import { initChat, Chat } from './external/chat'
import { DB, mockDB, pgDB } from './external/db'

import log from './logging/log'

import { isDebugFlagSet } from './utility/debug'
import { asyncLoop } from './utility/async'

import { Action } from './models/actions'

import { loop, messageHandler } from './logic/main'

import {
    token,
    channel,
    frequency,
    dbConnectionString,
    port
} from './config.json'
;(async () => {
    // --- Config ---
    const serverPort: string = process.env.SERVER_PORT || port.toString()

    // --- Server ---
    const app = express()

    app.use(express.static('../client/dist'))

    app.listen(serverPort, () => {
        log(`Listening at http://localhost:${serverPort}`)
    })

    // --- DB ---
    let db: DB
    if (isDebugFlagSet()) {
        db = mockDB
    } else {
        const pgdb = await pgDB(dbConnectionString)
        db = pgdb

        // attempt a read to see if db is initialized yet
        pgdb.getAllUsers().catch((e) => {
            // an error occurred, attempt to initialize
            pgdb.initDB().catch(() => {
                // if this fails then the issue is something else, re-throw the original error
                throw e
            })
        })
    }

    // --- Chat Bot ---
    const chat = await initChat(channel, async (msg) => {
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

    asyncLoop(async () => {
        const actions = await loop(db).catch((e) => {
            log(`Error in main loop!: ${e}`)
            return []
        })

        log(`loop actions: ${JSON.stringify(actions)}`)
        await performActions(actions, chat, db).catch((e) => {
            log(`Error performing actions!: ${e}`)
        })

        return true // keep looping
    }, frequency * 1000)
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
