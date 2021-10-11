import express from 'express'

// --- Config ---
const port = process.env.SERVER_PORT || 3000

// --- App ---
const app = express()

app.use(express.static('../client/dist'))

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})
