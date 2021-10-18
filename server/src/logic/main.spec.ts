import { describe } from 'mocha'
import { expect } from 'chai'

import { loop, messageHandler } from './main'
import { Action } from '../models/logic'
import { Chore } from '../models/chores'
import { mockDB } from '../external/db'
import { ChoresBotUser } from '../models/chat'

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
        const mockDBWithUpcomming = Object.assign({}, mockDB, {
            getUpcommingChores: () => {
                const chore: Chore = {
                    name: 'walk the cat',
                    assigned: false,
                    frequency: {
                        time: new Date()
                    }
                }

                return [chore]
            }
        })

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
            `@${ChoresBotUser.name} the next upcomming unassigned chore is "walk the cat"`
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
})

describe('perform actions on an interval', () => {
    it('should prompt users to complete chores', () => {
        const mockDBWithUpcomming = Object.assign({}, mockDB, {
            getOutstandingChores: () => {
                const chore: Chore = {
                    name: 'walk the cat',
                    assigned: false,
                    frequency: {
                        time: new Date()
                    }
                }

                return [chore]
            },
            getUserWithLeastRecentCompletion: () => {
                return ChoresBotUser
            }
        })

        const actions = loop(mockDBWithUpcomming)

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
            `@${ChoresBotUser.name} please do the chore: "walk the cat"`
        )
    })
})
