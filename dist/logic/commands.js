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
exports.AllCommandsByCallsign = exports.AllCommands = exports.OptOutCommand = exports.OptInCommand = exports.InfoCommand = exports.DeleteCommand = exports.AddCommand = exports.CompleteCommand = exports.SkipCommand = exports.RequestCommand = exports.PingCommand = void 0;
const chat_1 = require("../models/chat");
const chat_2 = require("../external/chat");
const log_1 = __importDefault(require("../logging/log"));
const strings_1 = require("../utility/strings");
const time_1 = require("./time");
const actions_1 = require("./actions");
const chores_1 = require("./chores");
exports.PingCommand = {
    callsign: 'ping',
    handler: () => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                kind: 'SendMessage',
                message: {
                    text: 'pong',
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.RequestCommand = {
    callsign: '!request',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
        if (userAssignedChores.length > 0) {
            const mostUrgentChore = userAssignedChores[0];
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} you are already assigned the chore "${mostUrgentChore.name}". ` +
                            `If you would like to skip you can use the ${(0, chat_2.inlineCode)(exports.SkipCommand.callsign)} command`,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        const assignableChores = yield db.getUpcomingUnassignedChores();
        if (assignableChores.length == 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} there are no upcoming chores`,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        const mostUrgentChore = (0, chores_1.findChoreForUser)(assignableChores, message.author);
        if (mostUrgentChore === undefined) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} unable to find you a suitable new chore. ` +
                            `This might happen if all available chores have been skipped`,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        return (0, actions_1.assignChoreActions)(mostUrgentChore, message.author);
    })
};
exports.SkipCommand = {
    callsign: '!skip',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
        // check if the user is able to skip
        if (userAssignedChores.length === 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} you have no chores currently assigned. ` +
                            `If you would like to request a new chore you can use the ${(0, chat_2.inlineCode)(exports.RequestCommand.callsign)} command`,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        // skip the chore
        const choreToSkip = userAssignedChores[0];
        return [
            {
                kind: 'ModifyChore',
                chore: (0, chores_1.skipChore)(choreToSkip, message.author)
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `⏭ the chore "${choreToSkip.name}" has been successfully skipped`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.CompleteCommand = {
    callsign: '!complete',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const commandArgs = getArgumentsString(message.text, exports.CompleteCommand);
        if (commandArgs.length === 0) {
            return completeAssignedChore(message.author, db);
        }
        return completeChoreByName(commandArgs, message.author, db);
    })
};
exports.AddCommand = {
    callsign: '!add',
    helpText: `!add chore-name frequency

chore-name
    The name of the chore. Shown when being assigned, completed, etc.
    Should be something that clearly describes the chore.
    Note: don't use the @ symbol in the name

frequency
    How frequently the chore should be completed/assigned.
    Must be one of the following formats:
        Daily @ <time>
        Weekly @ <day>
        Yearly @ <date>
        Once @ <date/time>

e.g.
!add walk the cat Daily @ 9:00 AM
!add flip the pool Weekly @ monday
!add make a pile Yearly @ Feb 12
!add floop the pig Once @ Nov 9 2:00 PM`,
    minArgumentCount: 2,
    handler: (message) => __awaiter(void 0, void 0, void 0, function* () {
        const commandArgs = getArgumentsString(message.text, exports.AddCommand);
        const words = commandArgs.split(' ');
        const atSignIndex = words.indexOf('@');
        // there must be a keyword before the @
        // and the name of the chore needs to be before the @
        // so the index must be at least 2
        if (atSignIndex === -1 || atSignIndex < 2) {
            (0, log_1.default)(`invalid command format for !add command: ${commandArgs}`);
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: exports.AddCommand.helpText ||
                            'invalid format for !add command',
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        const choreName = words.slice(0, atSignIndex - 1).join(' ');
        const frequencyString = words.slice(atSignIndex - 1).join(' ');
        const frequency = (0, time_1.parseFrequency)(frequencyString);
        if (frequency instanceof Error) {
            (0, log_1.default)(`Error parsing frequency "${frequency.message}"`);
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: 'Error: unable to parse the frequency (see logs)',
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        return [
            {
                kind: 'AddChore',
                chore: {
                    name: choreName,
                    assigned: false,
                    frequency
                }
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `${(0, chat_2.tagUser)(message.author)} new chore '${choreName}' successfully added with frequency '${(0, time_1.frequencyToString)(frequency)}'`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.DeleteCommand = {
    callsign: '!delete',
    minArgumentCount: 1,
    helpText: `!delete chore-name

chore-name
    The name of the chore. Shown when being assigned, completed, etc.
    Note: make sure spelling and capitalization matches exactly`,
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const choreName = getArgumentsString(message.text, exports.DeleteCommand);
        // check if chore exists, maybe it was misspelled
        let chore;
        try {
            chore = yield db.getChoreByName(choreName);
        }
        catch (e) {
            (0, log_1.default)(`error retrieving chore "${choreName}": ${e}`);
            // don't re-throw so user gets more specific message
        }
        if (chore === undefined) {
            return [
                (0, actions_1.didYouMeanMessage)(choreName, yield getClosestChoreName(choreName, db), exports.DeleteCommand, message.author)
            ];
        }
        return [
            {
                kind: 'DeleteChore',
                chore
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `${(0, chat_2.tagUser)(message.author)} chore '${choreName}' successfully deleted`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.InfoCommand = {
    callsign: '!info',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const choreName = getArgumentsString(message.text, exports.InfoCommand);
        let chore;
        if (choreName === '') {
            // no chore name supplied, use assigned chore
            const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
            if (userAssignedChores.length === 0) {
                return [
                    {
                        kind: 'SendMessage',
                        message: {
                            text: `${(0, chat_2.tagUser)(message.author)} you have no chores assigned`,
                            author: chat_1.ChoresBotUser
                        }
                    }
                ];
            }
            chore = userAssignedChores[0];
        }
        else {
            // check if chore exists, maybe it was misspelled
            try {
                chore = yield db.getChoreByName(choreName);
            }
            catch (e) {
                (0, log_1.default)(`error retrieving chore "${choreName}": ${e}`);
                // don't re-throw so user gets more specific message
            }
            if (chore === undefined) {
                return [
                    (0, actions_1.didYouMeanMessage)(choreName, yield getClosestChoreName(choreName, db), exports.InfoCommand, message.author)
                ];
            }
        }
        const completions = yield db.getAllChoreCompletions(chore.name);
        const mostRecentCompletion = completions.shift();
        return [
            {
                kind: 'SendMessage',
                message: {
                    text: (0, chores_1.describeChore)(chore, mostRecentCompletion),
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.OptInCommand = {
    callsign: '!opt-in',
    handler: (message) => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                kind: 'AddUser',
                user: message.author
            },
            {
                kind: 'SendMessage',
                message: {
                    text: `${(0, chat_2.tagUser)(message.author)} thank you for opting in to ChoresBot!!! ✨💚`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.OptOutCommand = {
    callsign: '!opt-out',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const actions = [];
        const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
        for (const chore of userAssignedChores) {
            actions.push({
                kind: 'ModifyChore',
                chore: (0, chores_1.unassignChore)(chore)
            });
        }
        actions.push({
            kind: 'DeleteUser',
            user: message.author
        }, {
            kind: 'SendMessage',
            message: {
                text: `${(0, chat_2.tagUser)(message.author)} successfully opted-out, you should no longer be assigned any chores`,
                author: chat_1.ChoresBotUser
            }
        });
        return actions;
    })
};
exports.AllCommands = [
    exports.PingCommand,
    exports.RequestCommand,
    exports.SkipCommand,
    exports.CompleteCommand,
    exports.AddCommand,
    exports.DeleteCommand,
    exports.InfoCommand,
    exports.OptInCommand,
    exports.OptOutCommand
];
exports.AllCommandsByCallsign = exports.AllCommands.reduce((accumulator, command) => {
    accumulator[command.callsign] = command;
    return accumulator;
}, {});
// --- Chore Completion ---
function completeAssignedChore(user, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const userAssignedChores = yield db.getChoresAssignedToUser(user);
        // check if the user has a chore assigned to complete
        if (userAssignedChores.length === 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(user)} you have no chores currently assigned. ` +
                            `If you would like to request a new chore you can use the ${(0, chat_2.inlineCode)(exports.RequestCommand.callsign)} command`,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        const completedChore = (0, chores_1.completeChore)(userAssignedChores[0]);
        return (0, actions_1.completeChoreActions)(completedChore, user);
    });
}
function completeChoreByName(choreName, completedBy, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const chore = yield db.getChoreByName(choreName);
        if (chore instanceof Error) {
            throw chore;
        }
        if (chore === undefined) {
            return [
                (0, actions_1.didYouMeanMessage)(choreName, yield getClosestChoreName(choreName, db), exports.CompleteCommand, completedBy)
            ];
        }
        const completedChore = (0, chores_1.completeChore)(chore);
        return (0, actions_1.completeChoreActions)(completedChore, completedBy);
    });
}
// --- Utility ---
function getArgumentsString(messageText, command) {
    return messageText.slice(command.callsign.length).trim();
}
function getClosestChoreName(requestedName, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const chores = yield db.getAllChoreNames();
        return (0, strings_1.bestMatch)(requestedName, chores);
    });
}
//# sourceMappingURL=commands.js.map