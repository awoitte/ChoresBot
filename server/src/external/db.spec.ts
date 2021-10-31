import { describe, run } from 'mocha'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { PostgresDB, pgDB } from './db'
import * as mock from '../utility/mocks'

use(chaiAsPromised)

const connectionString = process.env.CHORES_BOT_TEST_DB

if (connectionString === undefined) {
    console.log(
        'No environment variable set for CHORES_BOT_TEST_DB. Please set this to the postgresql connection string to use for database testing.'
    )
} else {
    describe('Database', async () => {
        const db: PostgresDB = await pgDB(connectionString)

        beforeEach(db.initDB.bind(db))

        it('should add and remember users', async () => {
            await db.addUser(mock.User1)
            const users = await db.getAllUsers()

            expect(users).to.have.length(1)

            const user = users[0]

            expect(user.id).to.equal(mock.User1.id)
            expect(user.name).to.equal(mock.User1.name)
        })

        it('should not allow adding duplicate users', async () => {
            const clonedUser = Object.assign({}, mock.User1, {
                name: 'some other name'
                // id is the same
            })

            await db.addUser(mock.User1)

            return expect(db.addUser(clonedUser)).to.eventually.throw
        })

        // TODO: getAllUsers doesn't return deleted users

        afterEach(db.destroyEntireDB.bind(db))

        // in order to use an async describe function we must use 'mocha --delay' and call run() here
        run()
    })
}
