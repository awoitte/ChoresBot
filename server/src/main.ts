import express from 'express'
import * as chat from './external/chat'
import { mockDB } from './external/db'
import log from './logging/log'
import { token, channel, frequency } from './config.json'
import { loop, messageHandler } from './logic/main'

// --- Config ---
const port: string = process.env.SERVER_PORT || '80'

// --- Server ---
const app = express()

app.use(express.static('../client/dist'))

app.listen(port, () => {
    log(`Listening at http://localhost:${port}`)
})

// --- Chat Bot ---
const client = chat.initClient()
chat.listenToChannel(channel, client, (msg) => {
    const actions = messageHandler(msg, mockDB) // TODO: use actual db
    log(`actions: ${actions}`)
})
chat.login(client, token)

setInterval(() => {
    loop(mockDB)
}, frequency * 1000)
