import { describe, run } from 'mocha'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { Chore } from '../models/chores'
import { Action } from '../models/actions'

import { loop } from '../logic/main'

import { PostgresDB } from './db'
import { tagUser } from './chat'

import * as mock from '../utility/mocks'

use(chaiAsPromised)

mock.withTestDB(runDBTestSuite)

async function runDBTestSuite(db: PostgresDB) {
    await db.destroyEntireDB() // if prior tests crashed there might be bad data to clean up

    describe('Database', () => {
        beforeEach(db.initDB.bind(db))

        describe('Chores', () => {
            it('should add and remember chores', async () => {
                await db.addChore(mock.genericChore)
                const chores = await db.getAllChoreNames()

                expect(chores).to.have.length(1)

                expect(chores[0]).to.equal(mock.genericChore.name)
            })

            it('should not allow adding duplicate chores', async () => {
                const clonedChore = Object.assign({}, mock.genericChore)

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

            it('should get chores by name', async () => {
                await db.addChore(mock.genericChore)

                const chore = await db.getChoreByName(mock.genericChore.name)

                if (chore === undefined) {
                    throw new Error("couldn't find chore")
                }

                expect(chore.name).to.equal(mock.genericChore.name)
                expect(chore.assigned).to.equal(mock.genericChore.assigned)
                expect(chore.frequency).to.deep.equal(
                    mock.genericChore.frequency
                )
            })

            it('should not get deleted chores by name', async () => {
                await db.addChore(mock.genericChore)
                await db.deleteChore(mock.genericChore.name)

                const chore = await db.getChoreByName(mock.genericChore.name)

                expect(chore).to.be.undefined
            })

            it('should not get deleted chores by name', async () => {
                await db.addChore(mock.genericChore)
                await db.deleteChore(mock.genericChore.name)

                const chore = await db.getChoreByName(mock.genericChore.name)

                expect(chore).to.be.undefined
            })

            it('should allow modifying chores', async () => {
                const mockChore: Chore = {
                    name: 'A',
                    assigned: false,
                    skippedBy: undefined, // defining explicitly to illustrate the difference
                    frequency: {
                        kind: 'Daily',
                        time: new Date()
                    }
                }

                const mockModifiedChore: Chore = {
                    name: 'A', // name is the same as we want it to replace previous version
                    assigned: mock.user1,
                    skippedBy: [mock.user2],
                    frequency: {
                        kind: 'Once',
                        date: new Date(0)
                    }
                }

                await db.addUser(mock.user1)
                await db.addUser(mock.user2)

                await db.addChore(mockChore)

                // check it's stored properly
                let chore = await db.getChoreByName(mockChore.name)

                if (chore === undefined) {
                    throw new Error("couldn't find chore")
                }

                expect(chore.name).to.equal(mockChore.name)
                expect(chore.assigned).to.equal(mockChore.assigned)
                expect(chore.frequency).to.deep.equal(mockChore.frequency)
                expect(chore.skippedBy).to.deep.equal(mockChore.skippedBy)

                await db.modifyChore(mockModifiedChore)

                chore = await db.getChoreByName(mockChore.name)

                if (chore === undefined) {
                    throw new Error("couldn't find chore")
                }

                expect(chore.name).to.equal(mockModifiedChore.name)
                expect(chore.assigned).to.deep.equal(mockModifiedChore.assigned)
                expect(chore.frequency).to.deep.equal(
                    mockModifiedChore.frequency
                )
                expect(chore.skippedBy).to.deep.equal(
                    mockModifiedChore.skippedBy
                )
            })

            it('should not allow modifying deleted chores', async () => {
                await db.addChore(mock.genericChore)
                await db.deleteChore(mock.genericChore.name)

                await expect(db.modifyChore(mock.genericChore)).to.eventually
                    .throw
            })

            it('should get chores assigned to a user', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.assignedChore)

                const assignedChores = await db.getChoresAssignedToUser(
                    mock.user1
                )

                expect(assignedChores).to.have.length(1)
                expect(assignedChores[0].name).to.equal(mock.assignedChore.name)
            })

            it('should not get deleted chores assigned to a user', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.assignedChore)
                await db.deleteChore(mock.assignedChore.name)

                const assignedChores = await db.getChoresAssignedToUser(
                    mock.user1
                )

                expect(assignedChores).to.have.length(0)
            })

            it('should get all assigned chores', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.assignedChore)

                const assignedChores = await db.getAllAssignedChores()

                expect(assignedChores).to.have.length(1)
                expect(assignedChores[0].name).to.equal(mock.assignedChore.name)
            })

            it('should not get deleted chores with assigned chores', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.assignedChore)

                let assignedChores = await db.getAllAssignedChores()

                expect(assignedChores).to.have.length(1)
                expect(assignedChores[0].name).to.equal(mock.assignedChore.name)

                await db.deleteChore(mock.assignedChore.name)

                assignedChores = await db.getAllAssignedChores()

                expect(assignedChores).to.have.length(0)
            })

            it('should get all outstanding unassigned chores', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.overdueChore)
                await db.addChore(mock.moreOverdueChore)
                await db.addChore(mock.upcomingChore)
                await db.addChore(mock.assignedChore)

                let outstandingChores =
                    await db.getOutstandingUnassignedChores()

                expect(outstandingChores).to.have.length(2)
                expect(outstandingChores[0].name).to.equal(
                    mock.moreOverdueChore.name
                )
                expect(outstandingChores[1].name).to.equal(
                    mock.overdueChore.name
                )

                await db.addChoreCompletion(mock.overdueChore.name, mock.user1)

                outstandingChores = await db.getOutstandingUnassignedChores()
                expect(outstandingChores).to.have.length(1)
                expect(outstandingChores[0].name).to.equal(
                    mock.moreOverdueChore.name
                )
            })

            it('should not get deleted chores as outstanding', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.overdueChore)
                await db.addChore(mock.moreOverdueChore)
                await db.addChore(mock.upcomingChore)
                await db.addChore(mock.assignedChore)

                let outstandingChores =
                    await db.getOutstandingUnassignedChores()

                expect(outstandingChores).to.have.length(2)
                expect(outstandingChores[0].name).to.equal(
                    mock.moreOverdueChore.name
                )
                expect(outstandingChores[1].name).to.equal(
                    mock.overdueChore.name
                )

                await db.deleteChore(mock.overdueChore.name)

                outstandingChores = await db.getOutstandingUnassignedChores()
                expect(outstandingChores).to.have.length(1)
                expect(outstandingChores[0].name).to.equal(
                    mock.moreOverdueChore.name
                )
            })

            it('should get all upcoming unassigned chores', async () => {
                await db.addUser(mock.user1)
                await db.addChore(mock.overdueChore)
                await db.addChore(mock.upcomingChore)
                await db.addChore(mock.furtherUpcomingChore)
                await db.addChore(mock.assignedChore)

                let upcomingChores = await db.getUpcomingUnassignedChores()

                expect(upcomingChores).to.have.length(3)
                expect(upcomingChores[0].name).to.equal(mock.overdueChore.name)
                expect(upcomingChores[1].name).to.equal(mock.upcomingChore.name)
                expect(upcomingChores[2].name).to.equal(
                    mock.furtherUpcomingChore.name
                )

                await db.addChoreCompletion(mock.upcomingChore.name, mock.user1)

                upcomingChores = await db.getUpcomingUnassignedChores()

                expect(upcomingChores).to.have.length(2)
                expect(upcomingChores[0].name).to.equal(mock.overdueChore.name)
                expect(upcomingChores[1].name).to.equal(
                    mock.furtherUpcomingChore.name
                )
            })

            it('should store chore completions', async () => {
                await db.addChore(mock.genericChore)
                await db.addUser(mock.user1)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)

                const completions = await db.getAllChoreCompletions(
                    mock.genericChore.name
                )
                expect(completions).to.have.length(1)
            })

            it('should require a valid user to store chore completions', async () => {
                await db.addChore(mock.genericChore)

                await expect(
                    db.addChoreCompletion(mock.genericChore.name, mock.user1)
                ).to.eventually.throw
            })

            it('should require a valid chore name to store chore completions', async () => {
                await db.addUser(mock.user1)

                await expect(
                    db.addChoreCompletion(mock.genericChore.name, mock.user1)
                ).to.eventually.throw
            })

            it('should store chore completion times', async () => {
                await db.addChore(mock.genericChore)
                await db.addUser(mock.user1)

                let before = new Date()
                before = new Date(before.getTime() - 100) // add some wiggle-room

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)

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

        describe('Users', () => {
            it('should add and remember users', async () => {
                await db.addUser(mock.user1)
                const users = await db.getAllUsers()

                expect(users).to.have.length(1)

                const user = users[0]

                expect(user.id).to.equal(mock.user1.id)
                expect(user.name).to.equal(mock.user1.name)
            })

            it('should not allow adding duplicate users', async () => {
                const clonedUser = Object.assign({}, mock.user1, {
                    name: 'some other name'
                    // id is the same
                })

                await db.addUser(mock.user1)

                await expect(db.addUser(clonedUser)).to.eventually.throw
            })

            it('should allow deleting users', async () => {
                await db.addUser(mock.user1)
                await db.deleteUser(mock.user1)

                const users = await db.getAllUsers()

                expect(users).to.have.length(0)
            })

            it('should allow re-adding a deleted user', async () => {
                await db.addUser(mock.user1)
                await db.deleteUser(mock.user1)

                await expect(db.addUser(mock.user1)).to.eventually.not.throw

                const users = await db.getAllUsers()

                expect(users).to.have.length(1)

                const user = users[0]

                expect(user.id).to.equal(mock.user1.id)
                expect(user.name).to.equal(mock.user1.name)
            })

            it('should get users by id', async () => {
                await db.addUser(mock.user1)

                const user = await db.getUserByID(mock.user1.id)

                if (user === undefined) {
                    throw new Error("didn't find user")
                }

                expect(user.id).to.equal(mock.user1.id)
                expect(user.name).to.equal(mock.user1.name)
            })

            it('should not get deleted users by id', async () => {
                await db.addUser(mock.user1)
                await db.deleteUser(mock.user1)

                const user = await db.getUserByID(mock.user1.id)

                expect(user).to.be.undefined
            })

            it('should properly retrieve users ordered by recent completions', async () => {
                await db.addUser(mock.user1)
                await db.addUser(mock.user2)
                await db.addUser(mock.user3)
                await db.addChore(mock.genericChore)
                await db.addChore(mock.upcomingChore)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)

                let users =
                    await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user1.id)
                // user 2 and 3 in non-deterministic order

                await db.addChoreCompletion(mock.genericChore.name, mock.user2)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user2.id)
                expect(users[1].id).to.equal(mock.user1.id)
                expect(users[2].id).to.equal(mock.user3.id)

                await db.addChoreCompletion(mock.genericChore.name, mock.user3)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user3.id)
                expect(users[1].id).to.equal(mock.user2.id)
                expect(users[2].id).to.equal(mock.user1.id)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user1.id)
                expect(users[1].id).to.equal(mock.user3.id)
                expect(users[2].id).to.equal(mock.user2.id)

                await db.addChoreCompletion(mock.upcomingChore.name, mock.user2)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user2.id)
                expect(users[1].id).to.equal(mock.user1.id)
                expect(users[2].id).to.equal(mock.user3.id)
            })

            it('should not return a user as assignable if they already have a chore assigned', async () => {
                await db.addUser(mock.user1)
                await db.addUser(mock.user2)
                await db.addUser(mock.user3)
                await db.addChore(mock.genericChore)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)
                await db.addChoreCompletion(mock.genericChore.name, mock.user2)

                let users =
                    await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user2.id)
                expect(users[1].id).to.equal(mock.user1.id)
                expect(users[2].id).to.equal(mock.user3.id)

                const choreNowAssigned = Object.assign({}, mock.genericChore, {
                    // id will be the same
                    assigned: mock.user2
                })

                await db.modifyChore(choreNowAssigned)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(2)

                expect(users[0].id).to.equal(mock.user1.id)
                expect(users[1].id).to.equal(mock.user3.id)
            })

            it('should not count deleted chores when getting users as assignable', async () => {
                await db.addUser(mock.user1)
                await db.addUser(mock.user2)
                await db.addUser(mock.user3)
                await db.addChore(mock.genericChore)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)
                await db.addChoreCompletion(mock.genericChore.name, mock.user2)

                let users =
                    await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user2.id)
                expect(users[1].id).to.equal(mock.user1.id)
                expect(users[2].id).to.equal(mock.user3.id)

                const choreNowAssigned = Object.assign({}, mock.genericChore, {
                    // id will be the same
                    assigned: mock.user2
                })

                await db.modifyChore(choreNowAssigned)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(2)

                expect(users[0].id).to.equal(mock.user1.id)
                expect(users[1].id).to.equal(mock.user3.id)

                await db.deleteChore(choreNowAssigned.name)

                users = await db.getAssignableUsersInOrderOfRecentCompletion()

                expect(users).to.have.length(3)

                expect(users[0].id).to.equal(mock.user2.id)
                expect(users[1].id).to.equal(mock.user1.id)
                expect(users[2].id).to.equal(mock.user3.id)
            })

            it('should not count prior completions if a chore is re-added', async () => {
                await db.addChore(mock.genericChore)
                await db.addUser(mock.user1)

                let actions = await loop(db)

                expect(actions).to.have.lengthOf(2)

                let action: Action = actions[0]

                if (action.kind !== 'ModifyChore') {
                    throw 'Received Action of the wrong type'
                }

                expect(action.chore.assigned).to.deep.equal(mock.user1)

                action = actions[1]

                if (action.kind !== 'SendMessage') {
                    throw 'Received Action of the wrong type'
                }

                expect(action.message.text).to.equal(
                    `📋 ${tagUser(mock.user1)} please do the chore: "${
                        mock.genericChore.name
                    }"`
                )

                const mockChoreAssigned = Object.assign({}, mock.genericChore, {
                    // id is the same
                    assigned: mock.user1
                })
                await db.modifyChore(mockChoreAssigned)

                expect(await loop(db)).to.have.lengthOf(0)

                await db.addChoreCompletion(mock.genericChore.name, mock.user1)

                expect(await loop(db)).to.have.lengthOf(0)

                await db.deleteChore(mock.genericChore.name)

                expect(await loop(db)).to.have.lengthOf(0)

                await db.addChore(mock.genericChore)

                actions = await loop(db)

                expect(actions).to.have.lengthOf(2)

                action = actions[0]

                if (action.kind !== 'ModifyChore') {
                    throw 'Received Action of the wrong type'
                }

                expect(action.chore.assigned).to.deep.equal(mock.user1)

                action = actions[1]

                if (action.kind !== 'SendMessage') {
                    throw 'Received Action of the wrong type'
                }

                expect(action.message.text).to.equal(
                    `📋 ${tagUser(mock.user1)} please do the chore: "${
                        mock.genericChore.name
                    }"`
                )
            })
        })

        describe('Config', async () => {
            it('should store and retrieve config values', async () => {
                let value = await db.getConfigValue('test')

                expect(value).to.be.null

                await db.setConfigValue('test', 'a')

                value = await db.getConfigValue('test')

                expect(value).to.equal('a')
            })
        })

        afterEach(db.destroyEntireDB.bind(db))

        after(db.release.bind(db))

        // In order to run the test suite asynchronously we must use 'mocha --delay' and call run() here
        // async is required to run the tests with a real db connection
        run()
    })
}
