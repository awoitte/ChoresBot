import { describe } from 'mocha'
import { expect } from 'chai'

import { loop, messageHandler } from './main'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { User } from '../models/chat'
import { mockDB } from '../external/db'

// --- Mocks ---
const mockUser: User = {
    name: 'mockName',
    id: 'mockID'
}

const mockUpcommingChore: Chore = {
    name: 'walk the cat',
    assigned: mockUser,
    frequency: {
        time: new Date()
    }
}

const mockAssignedChore: Chore = {
    name: 'floop the pig',
    assigned: mockUser,
    frequency: {
        time: new Date()
    }
}

const mockOutstandingChore: Chore = {
    name: 'make a pile',
    assigned: mockUser,
    frequency: {
        time: new Date()
    }
}

function getUpcommingChores() {
    return [mockUpcommingChore]
}

function getUsersWithLeastRecentCompletion() {
    return [mockUser]
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
        expect(actions).to.have.lengthOf(0)
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
                author: mockUser
            },
            mockDBWithUpcomming
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} the next upcomming unassigned chore is "${mockUpcommingChore.name}"`
        )
    })

    it('should respond when a chore is requested but the user is already assigned to a chore', () => {
        const actions = messageHandler(
            {
                text: '!request',
                author: mockUser
            },
            mockDBWithChoreAssigned
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} you are already assigned the chore "${mockAssignedChore.name}". ` +
                `If you would like to skip you can use the "!skip" command`
        )
    })

    it('should respond when there are no upcomming chores when requested', () => {
        const actions = messageHandler(
            {
                text: '!request',
                author: mockUser
            },
            mockDB // mockDB will always respond with empty lists by default
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} there are no upcomming chores`
        )
    })

    it('should allow chores to be skipped by the assigned user', () => {
        const actions = messageHandler(
            {
                text: '!skip',
                author: mockUser
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
                author: mockUser
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
        expect(action.chore.assigned).to.equal(mockUser)

        action = actions[2]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `the chore "${mockAssignedChore.name}" has been successfully skipped. ` +
                `@${mockUser.name} please do the chore: "${mockUpcommingChore.name}"`
        )
    })

    it('should respond when there are no chores assigned to be skipped', () => {
        const actions = messageHandler(
            {
                text: '!skip',
                author: mockUser
            },
            mockDB // mockDB will always respond with empty lists by default
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} you have no chores currently assigned. ` +
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

        expect(action.chore.assigned).to.equal(mockUser)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} please do the chore: "${mockOutstandingChore.name}"`
        )
    })

    it('should not prompt users when there are no outstanding chores', () => {
        const actions = loop(mockDBWithUpcomming) // some upcomming, but no outstanding

        expect(actions).to.have.lengthOf(0)
    })
})
