"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loop = exports.messageHandler = void 0;
const chat_1 = require("../models/chat");
const log_1 = __importDefault(require("../utility/log"));
const chores_1 = require("./chores");
const commands_1 = require("./commands");
const actions_1 = require("./actions");
const time_1 = require("./time");
const reminderTimeConfigKey = 'reminder_time';
// messageHandler determines how to respond to chat messages
function messageHandler(message, db) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, log_1.default)(`New message: [${message.author.name}] "${message.text}"`);
        const text = message.text.toLowerCase();
        for (const command of commands_1.AllCommands) {
            let args;
            for (const callsign of command.callsigns) {
                if (text.startsWith(callsign)) {
                    const potentialArgs = text.slice(callsign.length).trim();
                    // prefer callsigns that match more of the text and thus have shorter args
                    // e.g. prefer "!completed" over "!complete" so the d isn't accidentally
                    // parsed as an arg
                    if (args === undefined || potentialArgs.length < args.length) {
                        args = potentialArgs;
                    }
                }
            }
            if (args === undefined) {
                // even if the command has no args it should still be set to an empty string
                // thus we can use it as a flag to check if a command name match was found
                continue;
            }
            if (command.minArgumentCount !== undefined) {
                let numberOfArguments;
                if (args.trim() === '') {
                    numberOfArguments = 0;
                }
                else {
                    const words = args.trim().split(' ');
                    numberOfArguments = words.length;
                }
                if (numberOfArguments < command.minArgumentCount) {
                    return [
                        {
                            kind: 'SendMessage',
                            message: {
                                author: chat_1.ChoresBotUser,
                                text: command.helpText ||
                                    'this command needs more arguments'
                            }
                        }
                    ];
                }
            }
            try {
                return yield command.handler(message, db, args);
            }
            catch (error) {
                return [
                    {
                        kind: 'SendMessage',
                        message: {
                            text: `Error running command "${(0, commands_1.defaultCallsign)(command)}" (see logs)`,
                            author: chat_1.ChoresBotUser
                        }
                    }
                ];
            }
        }
        return [];
    });
}
exports.messageHandler = messageHandler;
// loop is called at a set interval and handles logic that isn't prompted by a chat message
function loop(db, morningTime, nightTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const actions = [];
        if (!(0, time_1.isNowBetweenTimes)(morningTime, nightTime)) {
            const lastReminder = yield db.getConfigValue(reminderTimeConfigKey);
            if (isReminderTime(db, lastReminder, nightTime)) {
                const now = new Date();
                const assignedChores = yield db.getAllAssignedChores();
                yield db.setConfigValue(reminderTimeConfigKey, (0, time_1.toParseableDateString)(now));
                actions.push(...(0, actions_1.reminderAction)(assignedChores));
            }
            return actions;
        }
        let outstandingChores;
        try {
            outstandingChores = yield db.getOutstandingUnassignedChores();
        }
        catch (e) {
            (0, log_1.default)('Unable to get outstanding chores');
            throw e;
        }
        let assignableUsers;
        try {
            assignableUsers = yield db.getAssignableUsersInOrderOfRecentCompletion();
            assignableUsers.reverse(); // we want least recent completion first
        }
        catch (e) {
            (0, log_1.default)('Unable to get assignable users');
            throw e;
        }
        for (const chore of outstandingChores) {
            const selectedUser = (0, chores_1.findUserForChore)(chore, assignableUsers);
            if (selectedUser === undefined) {
                (0, log_1.default)(`unable to find suitable user for the chore "${chore === null || chore === void 0 ? void 0 : chore.name}"`);
                continue;
            }
            assignableUsers = assignableUsers.filter((u) => u.id !== selectedUser.id);
            actions.push(...(0, actions_1.assignChoreActions)(chore, selectedUser));
        }
        return actions;
    });
}
exports.loop = loop;
function isReminderTime(db, lastReminder, nightTime) {
    const now = new Date();
    if (nightTime !== undefined && (0, time_1.isTimeAfter)(now, nightTime)) {
        if (lastReminder === null) {
            // a reminder has never been sent before
            return true;
        }
        const lastReminderParsed = (0, time_1.parseDate)(lastReminder);
        if (lastReminderParsed === undefined) {
            throw new Error(`unable to parse last reminder time as a date: ${lastReminder}`);
        }
        return (0, time_1.isDateAfter)(now, lastReminderParsed);
    }
    return false;
}
//# sourceMappingURL=main.js.map