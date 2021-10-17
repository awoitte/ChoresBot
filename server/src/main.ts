import express from 'express'
import * as chat from './external/chat'
import log from './logging/log'
import { token } from './config.json'
import { messageHandler } from './logic/main'

// --- Config ---
const port: string = process.env.SERVER_PORT || '3000'

// --- Server ---
const app = express()

app.use(express.static('../client/dist'))

app.listen(port, () => {
  log(`Listening at http://localhost:${port}`)
})

// --- Chat Bot ---
const client = chat.initClient()
chat.listenToChannel("test", client, (msg) => {
  const actions = messageHandler(msg)
  log(`actions: ${actions}`)
})
chat.login(client, token)