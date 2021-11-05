"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frequencyToString = exports.parseFrequency = void 0;
const time_1 = require("../models/time");
const log_1 = __importDefault(require("../logging/log"));
const moment_1 = __importDefault(require("moment"));
function parseFrequency(value) {
    const atSignIndex = value.indexOf('@');
    if (atSignIndex === -1) {
        return new Error('Frequency must include "@"');
    }
    const kind = value.slice(0, atSignIndex).trim().toLowerCase();
    const time = value.slice(atSignIndex + 1).trim();
    console.log(time);
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
            const parsedTime = (0, moment_1.default)(time, validFormats);
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
            const parsedTime = (0, moment_1.default)(time, validFormats);
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
            const parsedTime = (0, moment_1.default)(time, validFormats);
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
            const time = (0, moment_1.default)(frequency.time);
            return `${frequency.kind} @ ${time.format('hh:mm a')}`;
        }
        case 'Weekly': {
            return `${frequency.kind} @ ${frequency.weekday}`;
        }
        case 'Yearly': {
            const date = (0, moment_1.default)(frequency.date);
            return `${frequency.kind} @ ${date.format('MMM Do hh:mm a')}`;
        }
        case 'Once': {
            const date = (0, moment_1.default)(frequency.date);
            return `${frequency.kind} @ ${date.format('MMM Do YYYY hh:mm a')}`;
        }
        default:
            (0, log_1.default)(`kind missing in frequencyToString`);
            return 'Unknown';
    }
}
exports.frequencyToString = frequencyToString;
//# sourceMappingURL=time.js.map