import { describe } from 'mocha'
import { expect } from 'chai'

import { parseFrequency } from './time'
import { Months } from '../models/time'

describe('Frequency parsing algorithm', () => {
    it('should parse weekly', () => {
        let frequency = parseFrequency('weekly @ wednesday')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Weekly'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.weekday).to.equal('wednesday')

        frequency = parseFrequency('Weekly @ friday')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Weekly'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.weekday).to.equal('friday')
    })

    it('should parse daily', () => {
        let frequency = parseFrequency('daily @ 9:00')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.time.getHours()).to.equal(9)
        expect(frequency.time.getMinutes()).to.equal(0)

        frequency = parseFrequency('daily @ 9:00 PM')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.time.getHours()).to.equal(21)
        expect(frequency.time.getMinutes()).to.equal(0)

        frequency = parseFrequency('daily @ 9:00 AM')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.time.getHours()).to.equal(9)
        expect(frequency.time.getMinutes()).to.equal(0)

        frequency = parseFrequency('daily @ 12')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.time.getHours()).to.equal(12)
        expect(frequency.time.getMinutes()).to.equal(0)

        frequency = parseFrequency('daily @ 12:25')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Daily'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.time.getHours()).to.equal(12)
        expect(frequency.time.getMinutes()).to.equal(25)
    })

    it('should parse once', () => {
        const now = new Date()
        let frequency = parseFrequency('once @ Nov 10 9:00 PM')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.date.getMonth()).to.equal(Months.indexOf('november'))
        expect(frequency.date.getDate()).to.equal(10)
        expect(frequency.date.getHours()).to.equal(21)
        expect(frequency.date.getMinutes()).to.equal(0)
        expect(frequency.date.getFullYear()).to.equal(now.getFullYear())

        frequency = parseFrequency('once @ Sept 11')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.date.getMonth()).to.equal(Months.indexOf('september'))
        expect(frequency.date.getDate()).to.equal(11)
        // time of day irrelevant
        expect(frequency.date.getFullYear()).to.equal(now.getFullYear())

        frequency = parseFrequency('OnCe @ 5')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.date.getMonth()).to.equal(now.getMonth())
        expect(frequency.date.getDate()).to.equal(now.getDate())
        expect(frequency.date.getHours()).to.equal(5)
        expect(frequency.date.getMinutes()).to.equal(0)
        expect(frequency.date.getFullYear()).to.equal(now.getFullYear())

        frequency = parseFrequency('ONCE @ 5PM')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.date.getMonth()).to.equal(now.getMonth())
        expect(frequency.date.getDate()).to.equal(now.getDate())
        expect(frequency.date.getHours()).to.equal(17)
        expect(frequency.date.getMinutes()).to.equal(0)
        expect(frequency.date.getFullYear()).to.equal(now.getFullYear())

        frequency = parseFrequency('once @ 12:25')

        if (
            frequency === undefined ||
            frequency instanceof Error ||
            frequency.kind !== 'Once'
        ) {
            throw new Error('incorrect frequency')
        }

        expect(frequency.date.getMonth()).to.equal(now.getMonth())
        expect(frequency.date.getDate()).to.equal(now.getDate())
        expect(frequency.date.getHours()).to.equal(12)
        expect(frequency.date.getMinutes()).to.equal(25)
        expect(frequency.date.getFullYear()).to.equal(now.getFullYear())
    })
})
