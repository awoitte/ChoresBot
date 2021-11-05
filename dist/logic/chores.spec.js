"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const mock = __importStar(require("../utility/mocks"));
const chores_1 = require("../logic/chores");
const time_1 = require("../models/time");
(0, mocha_1.describe)('Overdue Algorithm', () => {
    it('should determine if a daily chore is overdue', () => {
        const timeDue = new Date();
        let now;
        let completion;
        timeDue.setHours(12); // mid-day to help avoid "overflow" errors
        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Daily',
                time: timeDue
            }
        });
        // it's before the time of day but never completed
        now = new Date(timeDue.getTime() - time_1.hourInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, undefined, now)).to.be.true;
        // it's after the time of day but has been completed recently
        completion = new Date(timeDue.getTime() - time_1.hourInMilliseconds);
        now = new Date(timeDue.getTime() + time_1.hourInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
        // it's after the time of day and was completed yesterday
        completion = new Date(timeDue.getTime() - time_1.dayInMilliseconds);
        now = new Date(timeDue.getTime() + time_1.hourInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.true;
        // it's before the time of day and was completed yesterday
        completion = new Date(timeDue.getTime() - time_1.dayInMilliseconds);
        now = new Date(timeDue.getTime() - time_1.hourInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
        // it's before the time of day but was completed 4 days ago
        // (or any time before "yesterday")
        completion = new Date(timeDue.getTime() - time_1.dayInMilliseconds * 4);
        now = new Date(timeDue.getTime() - time_1.hourInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.true;
    });
    it('should determine if a weekly chore is overdue', () => {
        // wednesday will give us a nice mid-week day to work with
        // to help avoid "overflow" errors
        const wednesday = new Date();
        // start at first day of month and move forward till it's wednesday
        wednesday.setDate(0);
        while (wednesday.getDay() != time_1.Weekdays.indexOf('wednesday')) {
            wednesday.setDate(wednesday.getDate() + 1);
        }
        let now;
        let completion;
        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Weekly',
                weekday: 'wednesday'
            }
        });
        // it's before the weekday but never completed
        now = new Date(wednesday.getTime() - time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, undefined, now)).to.be.true;
        // it's after the weekday but has been completed recently
        completion = new Date(wednesday.getTime() - time_1.dayInMilliseconds);
        now = new Date(wednesday.getTime() + time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
        // it's after the weekday and was completed last week
        completion = new Date(wednesday.getTime() - time_1.weekInMilliseconds);
        now = new Date(wednesday.getTime() + 1000);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.true;
        // it's before the weekday and was completed last week
        completion = new Date(wednesday.getTime() - time_1.weekInMilliseconds);
        now = new Date(wednesday.getTime() - time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
        // it's before the weekday but was completed 4 weeks ago
        // (or any time before "last week")
        completion = new Date(wednesday.getTime() - time_1.weekInMilliseconds * 4);
        now = new Date(wednesday.getTime() - time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.true;
        // it's before the weekday and was completed early last week
        // i.e. time since completion is over a week but still within last week
        completion = new Date(wednesday.getTime() - (time_1.weekInMilliseconds + time_1.dayInMilliseconds + 1));
        now = new Date(wednesday.getTime() - time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
    });
    it('should determine if a monthly chore is overdue');
    it('should determine if a yearly chore is overdue');
    it('should determine if a "do once" chore is overdue', () => {
        const date = new Date();
        let now;
        let completion;
        const mockChore = Object.assign({}, mock.genericChore, {
            frequency: {
                kind: 'Once',
                date
            }
        });
        // it's before the date and never completed
        now = new Date(date.getTime() - time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, undefined, now)).to.be.false;
        // it's after the date and never completed
        now = new Date(date.getTime() + time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, undefined, now)).to.be.true;
        // it's after the date but has been completed early
        completion = new Date(date.getTime() - time_1.dayInMilliseconds);
        now = new Date(date.getTime() + time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
        // it's after the date but has been completed
        completion = new Date(date.getTime() + time_1.dayInMilliseconds);
        now = new Date(date.getTime() + time_1.dayInMilliseconds);
        (0, chai_1.expect)((0, chores_1.isChoreOverdue)(mockChore, completion, now)).to.be.false;
    });
});
//# sourceMappingURL=chores.spec.js.map