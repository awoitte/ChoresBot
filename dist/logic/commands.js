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
exports.defaultCallsign = exports.AllCommands = exports.HelpCommand = exports.OptOutCommand = exports.OptInCommand = exports.InfoCommand = exports.DeleteCommand = exports.AddCommand = exports.CompleteCommand = exports.SkipCommand = exports.RequestCommand = exports.PingCommand = void 0;
const chat_1 = require("../models/chat");
const chat_2 = require("../external/chat");
const log_1 = __importDefault(require("../utility/log"));
const strings_1 = require("../utility/strings");
const time_1 = require("./time");
const actions_1 = require("./actions");
const chores_1 = require("./chores");
// NOTE: If you add a new command, be sure to add it to the `AllCommands` array
exports.PingCommand = {
    callsigns: ['ping', '!ping'],
    summary: 'Bot responds with "pong", useful diagnostic to check if ChoresBot is running.',
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
    callsigns: ['!request'],
    summary: 'Request a new chore early',
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
        if (userAssignedChores.length > 0) {
            const mostUrgentChore = userAssignedChores[0];
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} you are already assigned the chore "${mostUrgentChore.name}". ` +
                            `If you would like to skip you can use the ${(0, chat_2.inlineCode)(defaultCallsign(exports.SkipCommand))} command`,
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
                        text: `✨ ${(0, chat_2.tagUser)(message.author)} there are no upcoming chores ✨`,
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
    callsigns: ['!skip'],
    summary: 'Skip a chore, you will not be assigned to it again until another user completes it',
    helpText: `!skip

Skips your currently assigned chore. You will not be re-assigned this chore again until it has been completed.`,
    handler: (message, db) => __awaiter(void 0, void 0, void 0, function* () {
        const userAssignedChores = yield db.getChoresAssignedToUser(message.author);
        // check if the user is able to skip
        if (userAssignedChores.length === 0) {
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: `${(0, chat_2.tagUser)(message.author)} you have no chores currently assigned. ` +
                            `If you would like to request a new chore you can use the ${(0, chat_2.inlineCode)(defaultCallsign(exports.RequestCommand))} command`,
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
    callsigns: ['!complete', '!completed'],
    summary: 'Mark a chore as completed',
    helpText: `!complete chore-name

chore-name:
    Optional.
    The name of the chore you wish to complete. If no name is provided then your currently assigned chore is used.

Note: you do not need to be assigned to a chore to complete it`,
    handler: (message, db, commandArgs) => __awaiter(void 0, void 0, void 0, function* () {
        if (commandArgs.length === 0) {
            return completeAssignedChore(message.author, db);
        }
        return completeChoreByName(commandArgs, message.author, db);
    })
};
exports.AddCommand = {
    callsigns: ['!add'],
    summary: 'Add a new chore',
    helpText: `!add chore-name frequency

chore-name:
    The name of the chore. Shown when being assigned, completed, etc. Should be something that clearly describes the chore.
    Note: don't use the @ symbol in the name

frequency:
    How frequently the chore should be completed/assigned. Must be one of the following formats:
        Daily @ <time>
        Weekly @ <day>
        Monthly @ <day/time>
        Yearly @ <date>
        Once @ <date/time>

Notes:
- Adding a chore that already exists will override its frequency.
- Adding a chore that was deleted will make it available again. Previous completions will still be shown.

e.g.
!add walk the cat Daily @ 9:00 AM
!add flip the pool Weekly @ monday
!add make a pile Yearly @ Feb 12
!add floop the pig Once @ Nov 9 2:00 PM
!add clean kitchen fans Monthly @ 10th 10:00 AM`,
    minArgumentCount: 2,
    handler: (message, db, commandArgs) => __awaiter(void 0, void 0, void 0, function* () {
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
                    text: `➕ ${(0, chat_2.tagUser)(message.author)} new chore '${choreName}' successfully added with frequency '${(0, time_1.frequencyToString)(frequency)}' ➕`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.DeleteCommand = {
    callsigns: ['!delete'],
    minArgumentCount: 1,
    summary: 'Delete an existing chore',
    helpText: `!delete chore-name

chore-name:
    The name of the chore. Shown when being assigned, completed, etc.

Note: although the chore will no longer be accesible or assignable the database will still have records of it and its completions.`,
    handler: (message, db, choreName) => __awaiter(void 0, void 0, void 0, function* () {
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
                    text: `➖ ${(0, chat_2.tagUser)(message.author)} chore '${choreName}' successfully deleted ➖`,
                    author: chat_1.ChoresBotUser
                }
            }
        ];
    })
};
exports.InfoCommand = {
    callsigns: ['!info'],
    summary: 'Get information on a chore',
    helpText: `!info chore-name

chore-name:
    Optional.
    The name of the chore you want info on. If no name is provided then your currently assigned chore is used.

Note: If a chore matching the name you supplied can't be found then the closest match will be shown instead. This can be helpful to check the spelling of a chore's name.`,
    handler: (message, db, choreName) => __awaiter(void 0, void 0, void 0, function* () {
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
    callsigns: ['!opt-in'],
    summary: 'Add yourself as a user of ChoresBot allowing chores to be assigned to you.',
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
    callsigns: ['!opt-out'],
    summary: 'Remove yourself as a user of ChoresBot. You will no longer be assigned chores.',
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
                text: `${(0, chat_2.tagUser)(message.author)} successfully opted-out, you should no longer be assigned any chores 👋`,
                author: chat_1.ChoresBotUser
            }
        });
        return actions;
    })
};
exports.HelpCommand = {
    callsigns: ['!help'],
    summary: 'Get information on how to use a command',
    helpText: `!help command

command:
    Optional.
    The name of the command you would like help with. If none is provided then a summary of all commands will be given.
    Note: If the command name isn't found then the closest match will be used`,
    handler: (message, db, commandName) => __awaiter(void 0, void 0, void 0, function* () {
        if (commandName.length === 0) {
            const helpSummary = exports.AllCommands.map((command) => `${defaultCallsign(command)} - ${command.summary}`).join('\n');
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: helpSummary,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
        else {
            const commandNames = exports.AllCommands.map(defaultCallsign);
            const closestCommand = (0, strings_1.bestMatch)(commandName, commandNames);
            const command = exports.AllCommands.find((command) => defaultCallsign(command) === closestCommand);
            if (command === undefined) {
                const errorText = `Cannot find closest matching command "${closestCommand}"`;
                (0, log_1.default)(errorText);
                throw new Error(errorText);
            }
            return [
                {
                    kind: 'SendMessage',
                    message: {
                        text: command.helpText || command.summary,
                        author: chat_1.ChoresBotUser
                    }
                }
            ];
        }
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
    exports.OptOutCommand,
    exports.HelpCommand
];
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
                            `If you would like to request a new chore you can use the ${(0, chat_2.inlineCode)(defaultCallsign(exports.RequestCommand))} command`,
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
function getClosestChoreName(requestedName, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const chores = yield db.getAllChoreNames();
        return (0, strings_1.bestMatch)(requestedName, chores);
    });
}
// --- Command "Methods" ---
function defaultCallsign(command) {
    if (command.callsigns.length === 0) {
        throw new Error('All commands must have at least one callsign');
    }
    return command.callsigns[0];
}
exports.defaultCallsign = defaultCallsign;
//# sourceMappingURL=commands.js.map