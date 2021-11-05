"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChoreOverdue = exports.getChoreDueDate = exports.findChoreForUser = exports.findUserForChore = exports.describeChore = exports.unassignChore = exports.assignChore = exports.completeChore = exports.skipChore = void 0;
const time_1 = require("../models/time");
const time_2 = require("./time");
const chat_1 = require("../external/chat");
function skipChore(chore, user) {
    const skippedBy = [];
    if (chore.skippedBy != undefined) {
        skippedBy.push(...chore.skippedBy);
    }
    if (skippedBy.find((u) => u.id === user.id) === undefined) {
        skippedBy.push(user);
    }
    return Object.assign(Object.assign({}, chore), { skippedBy, assigned: false });
}
exports.skipChore = skipChore;
function completeChore(chore) {
    return Object.assign(Object.assign({}, chore), { assigned: false, skippedBy: undefined });
}
exports.completeChore = completeChore;
function assignChore(chore, user) {
    return Object.assign(Object.assign({}, chore), { assigned: user });
}
exports.assignChore = assignChore;
function unassignChore(chore) {
    return Object.assign(Object.assign({}, chore), { assigned: false });
}
exports.unassignChore = unassignChore;
function describeChore(chore, mostRecentCompletion) {
    let description = `${(0, chat_1.bold)('Chore')}: "${chore.name}"
${(0, chat_1.bold)('Frequency')}: ${(0, time_2.frequencyToString)(chore.frequency)}`;
    if (chore.assigned === false) {
        const nextDueDate = getChoreDueDate(chore, mostRecentCompletion === null || mostRecentCompletion === void 0 ? void 0 : mostRecentCompletion.at);
        if (nextDueDate) {
            description += `\n${(0, chat_1.bold)('Next scheduled assignment')}: ${nextDueDate.toString()}`;
        }
        else {
            description += (0, chat_1.bold)(`\nNo future due date`);
        }
    }
    else {
        // Note: don't actually tag the user so we don't ping them
        description += `\n${(0, chat_1.bold)('Currently assigned to')}: @${chore.assigned.name}`;
    }
    if (mostRecentCompletion !== undefined) {
        description += `\n${(0, chat_1.bold)('Most recently completed at')}: ${mostRecentCompletion.at.toString()} by ${mostRecentCompletion.by.name}`;
    }
    else {
        description += (0, chat_1.bold)(`\nNever completed`);
    }
    if (chore.skippedBy !== undefined) {
        const skippedList = chore.skippedBy
            .map((user) => `@${user.name}`)
            .join(', ');
        description += `\n${(0, chat_1.bold)('Recently skipped by')}: ${skippedList}`;
    }
    return description;
}
exports.describeChore = describeChore;
function findUserForChore(chore, users) {
    return users.find((user) => {
        return isUserEligibleForChore(chore, user);
    });
}
exports.findUserForChore = findUserForChore;
function findChoreForUser(chores, user) {
    return chores.find((chore) => {
        return isUserEligibleForChore(chore, user);
    });
}
exports.findChoreForUser = findChoreForUser;
function isUserEligibleForChore(chore, user) {
    // check if a user has already skipped the chore
    if (chore.skippedBy !== undefined) {
        return chore.skippedBy.find((u) => u.id === user.id) === undefined;
    }
    return true;
}
function getChoreDueDate(chore, mostRecentCompletion) {
    const frequency = chore.frequency;
    if (mostRecentCompletion === undefined) {
        if (frequency.kind === 'Once') {
            return frequency.date;
        }
        else {
            // a recurring chore that has never been completed is due ASAP
            // ASAP here represented by a date in the far-ish past (unix epoch)
            return new Date(0);
        }
    }
    const completion = mostRecentCompletion; // for brevity
    switch (frequency.kind) {
        case 'Daily': {
            // due one day after the latest completion at the time specified
            const due = new Date(completion.getTime() + time_1.dayInMilliseconds);
            due.setHours(frequency.time.getHours());
            due.setMinutes(frequency.time.getMinutes());
            return due;
        }
        case 'Weekly': {
            // due one week after latest completion on the day specified
            const weekday = time_1.Weekdays.indexOf(frequency.weekday);
            if (weekday === -1) {
                throw new Error('unable to parse weekday');
            }
            // weekdays are tricky as there's no way to directly set a date to a specific weekday
            // we'll need to advance one day at a time instead
            let due = new Date(completion.getTime());
            // advance until we're at the start of next week
            do {
                // use do...while to avoid false positive if completion was on weekday 0
                due = new Date(due.getTime() + time_1.dayInMilliseconds);
            } while (due.getDay() !== 0);
            while (due.getDay() != weekday) {
                // advance until we're at the proper weekday
                due = new Date(due.getTime() + time_1.dayInMilliseconds);
            }
            due.setHours(0);
            due.setMinutes(0);
            return due;
        }
        case 'Yearly': {
            // due one year after latest completion at the month/day/time specified
            const due = new Date(frequency.date.getTime());
            due.setFullYear(completion.getFullYear() + 1);
            return due;
        }
        case 'Once': {
            // if we made it here then it's already been completed (and will never be due)
            return undefined;
        }
        default:
            throw new Error('unable to parse frequency');
    }
}
exports.getChoreDueDate = getChoreDueDate;
function isChoreOverdue(chore, mostRecentCompletion, now) {
    const dueDate = getChoreDueDate(chore, mostRecentCompletion);
    if (dueDate === undefined) {
        // it's never due, so it's not overdue
        return false;
    }
    return now.getTime() > dueDate.getTime();
}
exports.isChoreOverdue = isChoreOverdue;
//# sourceMappingURL=chores.js.map