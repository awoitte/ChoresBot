"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateTime = exports.frequencyToString = exports.parseFrequency = void 0;
const time_1 = require("../models/time");
const strings_1 = require("../utility/strings");
const log_1 = __importDefault(require("../logging/log"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const locale = process.env.LOCALE || 'en-US';
const timeZone = process.env.TIMEZONE || 'America/New_York';
function parseFrequency(value) {
    const atSignIndex = value.indexOf('@');
    if (atSignIndex === -1) {
        return new Error('Frequency must include "@"');
    }
    const kind = value.slice(0, atSignIndex).trim().toLowerCase();
    const time = value.slice(atSignIndex + 1).trim();
    switch (kind) {
        case 'daily': {
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
                return new Error(`unrecognized time of day, please use one of the following formats: ${JSON.stringify(validFormats)}`);
            }
            return {
                kind: 'Daily',
                time: parsedTime.toDate()
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
            const parsedTime = moment_timezone_1.default.tz(time, validFormats, timeZone);
            if (!parsedTime.isValid()) {
                return new Error(`unrecognized date, please use one of the following formats: ${JSON.stringify(validFormats)}`);
            }
            return {
                kind: 'Yearly',
                date: parsedTime.toDate()
            };
        }
        case 'once': {
            // TODO: there's gotta be a better way
            const validFormats = [
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
                'MMM Do',
                'MMM DD',
                'MMM Do YYYY',
                'MMM DD YYYY',
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
            const parsedTime = moment_timezone_1.default.tz(time, validFormats, timeZone);
            if (!parsedTime.isValid()) {
                return new Error(`unrecognized date`);
            }
            return {
                kind: 'Once',
                date: parsedTime.toDate()
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
//# sourceMappingURL=time.js.map