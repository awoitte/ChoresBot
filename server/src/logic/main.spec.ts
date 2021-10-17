import { describe } from 'mocha';
import { expect } from 'chai';

import { messageHandler } from './main'

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

})