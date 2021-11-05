"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekInMilliseconds = exports.dayInMilliseconds = exports.hourInMilliseconds = exports.Months = exports.Weekdays = void 0;
// For use with Date.getDay()
exports.Weekdays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
];
// For user with Date.getMonth()
exports.Months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
];
exports.hourInMilliseconds = 1000 * // milliseconds per second
    60 * // seconds per minute
    60; // minutes per hour
exports.dayInMilliseconds = exports.hourInMilliseconds * 24; //hours per day
exports.weekInMilliseconds = exports.dayInMilliseconds * 7; // days per week
//# sourceMappingURL=time.js.map