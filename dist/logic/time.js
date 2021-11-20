"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toParseableDateString = exports.isDateAfter = exports.isTimeAfter = exports.isNowBetweenTimes = exports.parseFullDateTime = exports.parseDate = exports.parseTime = exports.formatDateTime = exports.frequencyToString = exports.parseFrequency = void 0;
const time_1 = require("../models/time");
const strings_1 = require("../utility/strings");
const log_1 = __importDefault(require("../utility/log"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const locale = process.env.LOCALE || 'en-US';
const timeZone = process.env.TIMEZONE || 'America/New_York';
moment_timezone_1.default.tz.setDefault(timeZone);
function parseFrequency(value) {
    const atSignIndex = value.indexOf('@');
    if (atSignIndex === -1) {
        return new Error('Frequency must include "@"');
    }
    const kind = value.slice(0, atSignIndex).trim().toLowerCase();
    const time = value.slice(atSignIndex + 1).trim();
    switch (kind) {
        case 'daily': {
            const parsedTime = parseTime(time);
            if (parsedTime === undefined) {
                return new Error(`unrecognized time of day`);
            }
            return {
                kind: 'Daily',
                time: parsedTime
            };
        }
        case 'weekly': {
            const timeLower = time.toLowerCase();
            if (time_1.Weekdays.indexOf(timeLower) === -1) {
                return new Error('Unrecognized weekday');
            }
            return {
                kind: 'Weekly',
                weekday: timeLower
            };
        }
        case 'yearly': {
            const parsedTime = parseDate(time);
            if (parsedTime === undefined) {
                return new Error(`unrecognized date`);
            }
            return {
                kind: 'Yearly',
                date: parsedTime
            };
        }
        case 'once': {
            const parsedTime = parseFullDateTime(time);
            if (parsedTime === undefined) {
                return new Error(`unrecognized date`);
            }
            return {
                kind: 'Once',
                date: parsedTime
            };
        }
        default: {
            return new Error('Unable to parse frequency');
        }
    }
}
exports.parseFrequency = parseFrequency;
function frequencyToString(frequency) {
    switch (frequency.kind) {
        case 'Daily': {
            // the frequency time may have been created at a different daylight savings time status
            // so make a new `Date` at today's date with the time set manually to avoid offset shenanigans
            const time = new Date();
            time.setHours(frequency.time.getHours());
            time.setMinutes(frequency.time.getMinutes());
            return `${frequency.kind} @ ${formatDateTime(time, {
                timeStyle: 'short'
            })}`;
        }
        case 'Weekly': {
            return `${frequency.kind} @ ${(0, strings_1.toTitleCase)(frequency.weekday)}`;
        }
        case 'Yearly': {
            return `${frequency.kind} @ ${formatDateTime(frequency.date, {
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            })}`;
        }
        case 'Once': {
            return `${frequency.kind} @ ${formatDateTime(frequency.date, {
                dateStyle: 'medium',
                timeStyle: 'short'
            })}`;
        }
        default:
            (0, log_1.default)(`kind missing in frequencyToString`);
            return 'Unknown';
    }
}
exports.frequencyToString = frequencyToString;
function formatDateTime(date, options) {
    const fullOptions = Object.assign({}, { timeZone }, options);
    return Intl.DateTimeFormat(locale, fullOptions).format(date);
}
exports.formatDateTime = formatDateTime;
function parseTime(time) {
    const validFormats = [
        'HH',
        'hh a',
        'HH:mm',
        'hh:mm a',
        'HH mm',
        'hh mm a',
        'HHmm',
        'hhmm a'
    ];
    const parsedTime = moment_timezone_1.default.tz(time, validFormats, timeZone);
    if (!parsedTime.isValid()) {
        return undefined;
    }
    return parsedTime.toDate();
}
exports.parseTime = parseTime;
function parseDate(date) {
    const validFormats = [
        'MMM Do',
        'MMM DD',
        'MMM Do YYYY',
        'MMM DD YYYY',
        'MM/DD',
        'MM-DD',
        'MM/DD/YYYY',
        'MM DD YYYY',
        'MM-DD-YYYY'
    ];
    const parsedDate = moment_timezone_1.default.tz(date, validFormats, timeZone);
    if (!parsedDate.isValid()) {
        return undefined;
    }
    return parsedDate.toDate();
}
exports.parseDate = parseDate;
function parseFullDateTime(dateTime) {
    // TODO: there's gotta be a better way
    const validFormats = [
        'MMM Do',
        'MMM DD',
        'MMM Do YYYY',
        'MMM DD YYYY',
        'MMM Do YYYY hh:mm a',
        'MMM DD YYYY hh:mm a',
        'MMM Do YYYY hh:mm a',
        'MMM DD YYYY hh:mm a',
        'MMM Do YYYY HH:mm',
        'MMM DD YYYY HH:mm',
        'MMM Do YYYY HH:mm',
        'MMM DD YYYY HH:mm',
        'MMM Do YYYY hh a',
        'MMM DD YYYY hh a',
        'MMM Do YYYY hhmm a',
        'MMM DD YYYY hhmm a',
        'MMM Do hh:mm a',
        'MMM DD hh:mm a',
        'MMM Do hh:mm a',
        'MMM DD hh:mm a',
        'MMM Do HH:mm',
        'MMM DD HH:mm',
        'MMM Do HH:mm',
        'MMM DD HH:mm',
        'MMM Do hh a',
        'MMM DD hh a',
        'MMM Do hhmm a',
        'MMM DD hhmm a',
        'HH',
        'hh a',
        'HH:mm',
        'hh:mm a',
        'HH mm',
        'hh mm a',
        'HHmm',
        'hhmm a',
        'MM/DD',
        'MM/DD hh:mm a',
        'MM/DD HH:mm',
        'MM/DD HHmm',
        'MM/DD HHmm a',
        'MM-DD',
        'MM-DD hh:mm a',
        'MM-DD HH:mm',
        'MM-DD HHmm',
        'MM-DD HHmm a',
        'MM/DD/YYYY',
        'MM/DD/YYYY hh:mm a',
        'MM/DD/YYYY HH:mm',
        'MM/DD/YYYY HHmm',
        'MM/DD/YYYY HHmm a',
        'MM DD YYYY',
        'MM-DD-YYYY',
        'MM-DD-YYYY hh:mm a',
        'MM-DD-YYYY HH:mm',
        'MM-DD-YYYY HHmm',
        'MM-DD-YYYY HHmm a'
    ];
    const parsedDateTime = moment_timezone_1.default.tz(dateTime, validFormats, timeZone);
    if (!parsedDateTime.isValid()) {
        return undefined;
    }
    return parsedDateTime.toDate();
}
exports.parseFullDateTime = parseFullDateTime;
function isNowBetweenTimes(start, end) {
    const now = moment_timezone_1.default.tz(timeZone);
    let startTime;
    if (start === undefined) {
        startTime = moment_timezone_1.default.tz(timeZone);
        startTime = startTime.hour(0);
        startTime = startTime.minute(0);
    }
    else {
        startTime = moment_timezone_1.default.tz(start, timeZone);
    }
    let endTime;
    if (end === undefined) {
        endTime = moment_timezone_1.default.tz(timeZone);
        endTime = endTime.hour(23);
        endTime = endTime.minute(59);
    }
    else {
        endTime = moment_timezone_1.default.tz(end, timeZone);
    }
    // would be nice to not convert these to/from Date
    const isAfterStart = isTimeMomentAfter(now, startTime);
    const isBeforeEnd = isTimeMomentAfter(endTime, now);
    return isAfterStart && isBeforeEnd;
}
exports.isNowBetweenTimes = isNowBetweenTimes;
function isTimeAfter(time, afterTime) {
    const timeMoment = moment_timezone_1.default.tz(time, timeZone);
    const afterTimeMoment = moment_timezone_1.default.tz(afterTime, timeZone);
    return isTimeMomentAfter(timeMoment, afterTimeMoment);
}
exports.isTimeAfter = isTimeAfter;
function isTimeMomentAfter(timeMoment, afterTimeMoment) {
    return (timeMoment.hour() > afterTimeMoment.hour() ||
        (timeMoment.hour() === afterTimeMoment.hour() &&
            timeMoment.minute() > afterTimeMoment.minute()));
}
function isDateAfter(date, afterDate) {
    const dateMoment = moment_timezone_1.default.tz(date, timeZone);
    const afterDateMoment = moment_timezone_1.default.tz(afterDate, timeZone);
    return isDateMomentAfter(dateMoment, afterDateMoment);
}
exports.isDateAfter = isDateAfter;
function isDateMomentAfter(date, afterDate) {
    return date.isAfter(afterDate, 'date');
}
function toParseableDateString(date) {
    const wrappedDate = moment_timezone_1.default.tz(date, timeZone);
    return wrappedDate.format('MM/DD/YYYY'); // this format string should be included in `parseDate`
}
exports.toParseableDateString = toParseableDateString;
//# sourceMappingURL=time.js.map