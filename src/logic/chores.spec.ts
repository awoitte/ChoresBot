import { describe } from 'mocha'
import { expect } from 'chai'

import * as mock from '../utility/mocks'
import { isChoreOverdue } from '../logic/chores'
import {
    hourInMilliseconds,
    dayInMilliseconds,
    weekInMilliseconds,
    Weekdays
} from '../models/time'

describe('Overdue Algorithm', () => {
    it('should determine if a daily chore is overdue', () => {
        const timeDue: Date = new Date()
        let now: Date
        let completion: Date

        timeDue.setHours(12) // mid-day to help avoid "overflow" errors

        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Daily',
                time: timeDue
            }
        })

        // it's before the time of day but never completed
        now = new Date(timeDue.getTime() - hourInMilliseconds)
        expect(isChoreOverdue(mockChore, undefined, now)).to.be.true

        // it's after the time of day but has been completed recently
        completion = new Date(timeDue.getTime() - hourInMilliseconds)
        now = new Date(timeDue.getTime() + hourInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // it's after the time of day and was completed yesterday
        completion = new Date(timeDue.getTime() - dayInMilliseconds)
        now = new Date(timeDue.getTime() + hourInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.true

        // it's before the time of day and was completed yesterday
        completion = new Date(timeDue.getTime() - dayInMilliseconds)
        now = new Date(timeDue.getTime() - hourInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // it's before the time of day but was completed 4 days ago
        // (or any time before "yesterday")
        completion = new Date(timeDue.getTime() - dayInMilliseconds * 4)
        now = new Date(timeDue.getTime() - hourInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.true
    })

    it('should determine if a weekly chore is overdue', () => {
        // wednesday will give us a nice mid-week day to work with
        // to help avoid "overflow" errors
        const wednesday: Date = new Date()

        // start at first day of month and move forward till it's wednesday
        wednesday.setDate(0)
        while (wednesday.getDay() != Weekdays.indexOf('wednesday')) {
            wednesday.setDate(wednesday.getDate() + 1)
        }

        let now: Date
        let completion: Date

        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Weekly',
                weekday: 'wednesday'
            }
        })

        // it's before the weekday but never completed
        now = new Date(wednesday.getTime() - dayInMilliseconds)
        expect(isChoreOverdue(mockChore, undefined, now)).to.be.true

        // it's after the weekday but has been completed recently
        completion = new Date(wednesday.getTime() - dayInMilliseconds)
        now = new Date(wednesday.getTime() + dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // it's after the weekday and was completed last week
        completion = new Date(wednesday.getTime() - weekInMilliseconds)
        now = new Date(wednesday.getTime() + 1000)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.true

        // it's before the weekday and was completed last week
        completion = new Date(wednesday.getTime() - weekInMilliseconds)
        now = new Date(wednesday.getTime() - dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // it's before the weekday but was completed 4 weeks ago
        // (or any time before "last week")
        completion = new Date(wednesday.getTime() - weekInMilliseconds * 4)
        now = new Date(wednesday.getTime() - dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.true

        // it's before the weekday and was completed early last week
        // i.e. time since completion is over a week but still within last week
        completion = new Date(
            wednesday.getTime() - (weekInMilliseconds + dayInMilliseconds + 1)
        )
        now = new Date(wednesday.getTime() - dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false
    })
    it('should determine if a monthly chore is overdue')
    it('should determine if a yearly chore is overdue')
    it('should determine if a "do once" chore is overdue', () => {
        const date: Date = new Date()
        let now: Date
        let completion: Date

        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Once',
                date
            }
        })

        // it's before the date and never completed
        now = new Date(date.getTime() - dayInMilliseconds)
        expect(isChoreOverdue(mockChore, undefined, now)).to.be.false

        // it's after the date and never completed
        now = new Date(date.getTime() + dayInMilliseconds)
        expect(isChoreOverdue(mockChore, undefined, now)).to.be.true

        // it's after the date but has been completed early
        completion = new Date(date.getTime() - dayInMilliseconds)
        now = new Date(date.getTime() + dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // it's after the date but has been completed
        completion = new Date(date.getTime() + dayInMilliseconds)
        now = new Date(date.getTime() + dayInMilliseconds)
        expect(isChoreOverdue(mockChore, completion, now)).to.be.false
    })

    it('should account for daylight savings time', () => {
        let now: Date
        let completion: Date

        const timeDue: Date = new Date(mock.beforeDST.getTime())

        timeDue.setHours(12) // mid-day to help avoid "overflow" errors
        timeDue.setMinutes(30)

        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Daily',
                time: timeDue
            }
        })

        // verify not due just before time
        completion = new Date(mock.beforeDST.getTime() - dayInMilliseconds)

        // (set manually to avoid DST shenanigans)
        now = new Date(timeDue.getTime())
        now.setHours(12)
        now.setMinutes(29)

        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // verify due just after time
        now = new Date(timeDue.getTime())
        now.setHours(12)
        now.setMinutes(31)

        expect(isChoreOverdue(mockChore, completion, now)).to.be.true

        // verify not due just before time with DST
        completion = new Date(mock.beforeDST.getTime())

        now = new Date(mock.afterDST.getTime())
        now.setHours(12)
        now.setMinutes(29)

        expect(isChoreOverdue(mockChore, completion, now)).to.be.false

        // verify due just after time with DST

        now = new Date(mock.afterDST.getTime())
        now.setHours(12)
        now.setMinutes(31)

        expect(isChoreOverdue(mockChore, completion, now)).to.be.true
    })
})
