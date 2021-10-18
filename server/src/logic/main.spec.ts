import { describe } from 'mocha';
import { expect } from 'chai';

import { messageHandler } from './main'
import { Action } from '../models/logic'

describe('handles messages and returns actions', () => {
    it('should parse messages and determine actions', () => {
        const actions = messageHandler({
            text: 'test',
            channel: 'test',
            author: {
                name: "",
                id: ""
            }
        })

        expect(actions).is.not.undefined
    })

    it('should reply to "ping" with "pong"', () => {
        const actions = messageHandler({
            text: 'ping',
            channel: 'test',
            author: {
                name: "",
                id: ""
            }
        })

        expect(actions).to.have.lengthOf(1)

        const action : Action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw "Recieved Action of the wrong type"
        }

        expect(action.message.text).to.equal('pong')

    })

})