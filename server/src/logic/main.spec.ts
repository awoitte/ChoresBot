import { describe } from 'mocha';
import { expect } from 'chai';

import { messageHandler } from './main'

describe('handles messages and returns actions', () => {
    it('should handle messages', () => {
        const actions = messageHandler({
            text: 'test',
            channel: 'test'
        })

        expect(actions).is.not.undefined
    })

})