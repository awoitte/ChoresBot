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
    runDBTestSuite(connectionString)
}

async function runDBTestSuite(connectionString: string) {
    const db: PostgresDB = await pgDB(connectionString)

    describe('Database', () => {
        beforeEach(db.initDB.bind(db))

        describe('Users', () => {
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

                await expect(db.addUser(clonedUser)).to.eventually.throw
            })

            it('should allow deleting users', async () => {
                await db.addUser(mock.User1)
                await db.deleteUser(mock.User1)

                const users = await db.getAllUsers()

                expect(users).to.have.length(0)
            })

            it('should allow re-adding a deleted user', async () => {
                await db.addUser(mock.User1)
                await db.deleteUser(mock.User1)

                await expect(db.addUser(mock.User1)).to.eventually.not.throw

                const users = await db.getAllUsers()

                expect(users).to.have.length(1)

                const user = users[0]

                expect(user.id).to.equal(mock.User1.id)
                expect(user.name).to.equal(mock.User1.name)
            })
        })

        describe('Chores', () => {
            it('should add and remember chores', async () => {
                await db.addChore(mock.genericChore)
                const chores = await db.getAllChoreNames()

                expect(chores).to.have.length(1)

                expect(chores[0]).to.equal(mock.genericChore.name)
            })

            it('should not allow adding duplicate chores', async () => {
                const clonedChore = Object.assign({}, mock.genericChore, {
                    name: 'some other name'
                })

                await db.addChore(mock.genericChore)

                await expect(db.addChore(clonedChore)).to.eventually.throw
            })

            it('should allow deleting chores', async () => {
                await db.addChore(mock.genericChore)
                await db.deleteChore(mock.genericChore.name)

                const chores = await db.getAllChoreNames()

                expect(chores).to.have.length(0)
            })

            it('should allow re-adding a deleted chore', async () => {
                await db.addChore(mock.genericChore)
                await db.deleteChore(mock.genericChore.name)

                await expect(db.addChore(mock.genericChore)).to.eventually.not
                    .throw

                const chores = await db.getAllChoreNames()

                expect(chores).to.have.length(1)

                expect(chores[0]).to.equal(mock.genericChore.name)
            })

            it('should store chore completions', async () => {
                await db.addChore(mock.genericChore)
                await db.addUser(mock.User1)

                await db.addChoreCompletion(mock.genericChore.name, mock.User1)

                const completions = await db.getAllChoreCompletions(
                    mock.genericChore.name
                )
                expect(completions).to.have.length(1)
            })

            it('should require a valid user to store chore completions', async () => {
                await db.addChore(mock.genericChore)

                await expect(
                    db.addChoreCompletion(mock.genericChore.name, mock.User1)
                ).to.eventually.throw
            })

            it('should require a valid chore name to store chore completions', async () => {
                await db.addUser(mock.User1)

                await expect(
                    db.addChoreCompletion(mock.genericChore.name, mock.User1)
                ).to.eventually.throw
            })

            it('should store chore completion times', async () => {
                await db.addChore(mock.genericChore)
                await db.addUser(mock.User1)

                let before = new Date()
                before = new Date(before.getTime() - 100) // add some wiggle-room

                await db.addChoreCompletion(mock.genericChore.name, mock.User1)

                let after = new Date()
                after = new Date(after.getTime() + 100) // add some wiggle-room

                const completions = await db.getAllChoreCompletions(
                    mock.genericChore.name
                )
                expect(completions).to.have.length(1)

                const completion = completions[0]
                expect(completion.at).to.be.above(before)
                expect(completion.at).to.be.below(after)
            })
        })

        afterEach(db.destroyEntireDB.bind(db))

        // In order to run the test suite asynchronously we must use 'mocha --delay' and call run() here
        // async is required to run the tests with a real db connection
        run()
    })
}
