import express from 'express'
import { describeChore } from '../logic/chores'
import { ReadOnlyDB } from '../models/db'

export default async function serveChoreInfo(
    db: ReadOnlyDB,
    request: express.Request,
    response: express.Response
): Promise<void> {
    const choreName = request.params.choreName
    const chore = await db.getChoreByName(choreName)

    if (chore === undefined) {
        response.send(`Unable to find chore "${choreName}"`)
        return
    }

    const completions = await db.getAllChoreCompletions(choreName)
    const mostRecentCompletion = completions.shift()

    response.send(describeChore(chore, mostRecentCompletion))
}
