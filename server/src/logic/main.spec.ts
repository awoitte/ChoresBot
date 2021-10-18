import { describe } from 'mocha'
import { expect } from 'chai'

import { messageHandler } from './main'
import { Action } from '../models/logic'
import { mockDB } from '../external/db'
import { Chore } from '../models/chores'

describe('handles messages and returns actions', () => {
    it('should parse messages and determine actions', () => {
        const actions = messageHandler(
            {
                text: 'test',
                channel: 'test',
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
                channel: 'test',
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
                    name: 'walk the cat'
                }

                return [chore]
            }
        })

        const actions = messageHandler(
            {
                text: '!request',
                channel: 'test',
                author: {
                    name: 'username',
                    id: ''
                }
            },
            mockDBWithUpcomming
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            '@username the next upcomming unassigned chore is "walk the cat"'
        )
    })

    it('should respond when there are no upcomming chores when requested', () => {
        const actions = messageHandler(
            {
                text: '!request',
                channel: 'test',
                author: {
                    name: 'username',
                    id: ''
                }
            },
            mockDB // mockDB will always respond with empty lists by default
        )

        expect(actions).to.have.lengthOf(1)

        const action: Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Recieved Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            '@username there are no upcomming chores'
        )
    })
})
