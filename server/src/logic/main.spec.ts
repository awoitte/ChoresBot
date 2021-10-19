import { describe } from 'mocha'
import { expect } from 'chai'

import { loop, messageHandler } from './main'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { mockDB } from '../external/db'
import { ChoresBotUser } from '../models/chat'

// --- Mocks ---
const mockUpcommingChore: Chore = {
    name: 'walk the cat',
    assigned: ChoresBotUser,
    frequency: {
        time: new Date()
    }
}

const mockAssignedChore: Chore = {
    name: 'floop the pig',
    assigned: ChoresBotUser,
    frequency: {
        time: new Date()
    }
}

const mockOutstandingChore: Chore = {
    name: 'make a pile',
    assigned: ChoresBotUser,
    frequency: {
        time: new Date()
    }
}

function getUpcommingChores() {
    return [mockUpcommingChore]
}

function getUsersWithLeastRecentCompletion() {
    return [ChoresBotUser]
}

function getChoresAssignedToUser() {
    return [mockAssignedChore]
}

function getOutstandingChores() {
    return [mockOutstandingChore]
}

const mockDBWithUpcomming = Object.assign({}, mockDB, {
    getUpcommingChores,
    getUsersWithLeastRecentCompletion
})

const mockDBWithChoreAssigned = Object.assign({}, mockDB, {
    getChoresAssignedToUser
})

const mockDBWithChoreAssignedAndUpcomming = Object.assign({}, mockDB, {
    getUpcommingChores,
    getUsersWithLeastRecentCompletion,
    getChoresAssignedToUser
})

const mockDBWithOutstandingChores = Object.assign({}, mockDB, {
    getOutstandingChores,
    getUsersWithLeastRecentCompletion
})

// --- Tests ---
describe('handles messages and returns actions', () => {
    it('should parse messages and determine actions', () => {
        const actions = messageHandler(
            {
                text: 'test',
                author: {
                    name: '',
                    id: ''
                }
            },
            mockDB
        )

        expect(actions).is.not.undefined
    })

    it('should reply to "ping" with "pong"', () => {
        const actions = messageHandler(
            {
                text: 'ping',
                author: {
                    name: '',
                    id: ''
                }
            },
            mockDB
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal('pong')
    })

    it('should provide the closest upcomming chore when requested', () => {
        const actions = messageHandler(
            {
                text: '!request',
                author: ChoresBotUser
            },
            mockDBWithUpcomming
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${ChoresBotUser.name} the next upcomming unassigned chore is "${mockUpcommingChore.name}"`
        )
    })

    it('should respond when a chore is requested but the user is already assigned to a chore', () => {
        const actions = messageHandler(
            {
                text: '!request',
                author: ChoresBotUser
            },
            mockDBWithChoreAssigned
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${ChoresBotUser.name} you are already assigned the chore "${mockAssignedChore.name}". ` +
                `If you would like to skip you can use the "!skip" command`
        )
    })

    it('should respond when there are no upcomming chores when requested', () => {
        const actions = messageHandler(
            {
                text: '!request',
                author: ChoresBotUser
            },
            mockDB // mockDB will always respond with empty lists by default
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${ChoresBotUser.name} there are no upcomming chores`
        )
    })

    it('should allow chores to be skipped by the assigned user', () => {
        const actions = messageHandler(
            {
                text: '!skip',
                author: ChoresBotUser
            },
            mockDBWithChoreAssigned
        )

        expect(actions).to.have.lengthOf(2)

        // make sure modify chores are first so that if they fail we're not alerting the user unnecissarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.chore.name).to.equal(mockAssignedChore.name)
        expect(action.chore.assigned).to.equal(false)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `the chore "${mockAssignedChore.name}" has been successfully skipped`
        )
    })

    it('should assign a new chore after one has been skipped when possible', () => {
        const actions = messageHandler(
            {
                text: '!skip',
                author: ChoresBotUser
            },
            mockDBWithChoreAssignedAndUpcomming
        )

        expect(actions).to.have.lengthOf(3)

        // make sure modify chores are first so that if they fail we're not alerting the user unnecissarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.chore.name).to.equal(mockAssignedChore.name)
        expect(action.chore.assigned).to.equal(false)

        action = actions[1]

        if (action.kind !== 'ModifyChore') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.chore.name).to.equal(mockUpcommingChore.name)
        expect(action.chore.assigned).to.equal(ChoresBotUser)

        action = actions[2]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `the chore "${mockAssignedChore.name}" has been successfully skipped. ` +
                `@${ChoresBotUser.name} please do the chore: "${mockUpcommingChore.name}"`
        )
    })

    it('should respond when there are no chores assigned to be skipped', () => {
        const actions = messageHandler(
            {
                text: '!skip',
                author: ChoresBotUser
            },
            mockDB // mockDB will always respond with empty lists by default
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${ChoresBotUser.name} you have no chores currently assigned. ` +
                `If you would like to request a new chore you can use the "!request" command`
        )
    })
})

describe('perform actions on an interval', () => {
    it('should prompt users to complete chores', () => {
        const actions = loop(mockDBWithOutstandingChores)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecissarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(ChoresBotUser)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${ChoresBotUser.name} please do the chore: "${mockOutstandingChore.name}"`
        )
    })
})
