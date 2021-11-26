import express from 'express'
import { ReadOnlyDB } from '../models/db'

export default async function serveChoresList(
    db: ReadOnlyDB,
    request: express.Request,
    response: express.Response
): Promise<void> {
    const chores = await db.getAllChoreNames()

    response.json(chores)
}
