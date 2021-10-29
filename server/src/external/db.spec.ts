import { describe } from 'mocha'
import { expect } from 'chai'

import { Pool } from 'pg'
import { DB, pgDB, destroyPostgresDB, initPostgresDB } from './db'

const connectionString = process.env.CHORES_BOT_TEST_DB

if (connectionString === undefined) {
    console.log(
        'No environment variable set for CHORES_BOT_TEST_DB. Please set this to the postgresql connection string to use for database testing.'
    )
} else {
    const pool = new Pool({
        connectionString
    })

    let db: DB

    describe('Database', () => {
        before(async () => {
            db = await pgDB(pool)
            await initPostgresDB(pool)
        })

        it('should connect to a test db for testing', async () => {
            const res = await pool.query('SELECT $1::text as message', [
                'Hello world!'
            ])
            expect(res.rows[0].message).to.equal('Hello world!')
        })

        after(async () => {
            await destroyPostgresDB(pool)
            await pool.end()
        })
    })
}
