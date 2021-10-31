import express from 'express'
import * as chat from './external/chat'
import { DB, mockDB, pgDB } from './external/db'
import { Pool } from 'pg'
import log from './logging/log'
import { token, channel, frequency, dbConnectionString } from './config.json'
import { isDebugFlagSet } from './utility/debug'
import { loop, messageHandler } from './logic/main'
;(async () => {
    // --- Config ---
    const port: string = process.env.SERVER_PORT || '80'

    // --- Server ---
    const app = express()

    app.use(express.static('../client/dist'))

    app.listen(port, () => {
        log(`Listening at http://localhost:${port}`)
    })

    // --- DB ---
    let db: DB
    if (isDebugFlagSet()) {
        db = mockDB
    } else {
        db = await pgDB(dbConnectionString)
    }

    // --- Chat Bot ---
    const client = chat.initClient()
    chat.listenToChannel(channel, client, async (msg) => {
        const actions = await messageHandler(msg, db) // TODO: use actual db
        log(`actions: ${actions}`)
    })
    chat.login(client, token)

    setInterval(() => {
        loop(db)
    }, frequency * 1000)
})()
