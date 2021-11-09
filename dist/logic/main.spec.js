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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const main_1 = require("./main");
const commands_1 = require("./commands");
const db_1 = require("../external/db");
const chat_1 = require("../external/chat");
const mock = __importStar(require("../utility/mocks"));
const actions_1 = require("./actions");
// --- Tests ---
(0, mocha_1.describe)('Message handling logic', () => __awaiter(void 0, void 0, void 0, function* () {
    it('should parse messages and determine actions', () => __awaiter(void 0, void 0, void 0, function* () {
        const actions = yield (0, main_1.messageHandler)({
            text: 'test',
            author: {
                name: '',
                id: ''
            }
        }, db_1.mockDB);
        (0, chai_1.expect)(actions).is.not.undefined;
        (0, chai_1.expect)(actions).to.have.lengthOf(0);
    }));
    (0, mocha_1.describe)('ping command', () => {
        it('should reply to "ping" with "pong"', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: 'ping',
                author: {
                    name: '',
                    id: ''
                }
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal('pong');
        }));
    });
    (0, mocha_1.describe)('!request command', () => {
        it('should provide the closest upcoming chore when requested', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!request',
                author: mock.user1
            }, mock.DBWithUpcoming);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.upcomingChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(mock.user1);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} please do the chore: "${mock.upcomingChore.name}"`);
        }));
        it('should respond when a chore is requested but the user is already assigned to a chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!request',
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} you are already assigned the chore "${mock.assignedChore.name}". ` +
                `If you would like to skip you can use the ${(0, chat_1.inlineCode)(commands_1.SkipCommand.callsign)} command`);
        }));
        it('should respond when there are no upcoming chores when requested', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!request',
                author: mock.user1
            }, db_1.mockDB // mockDB will always respond with empty lists by default
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} there are no upcoming chores`);
        }));
        it('should respond when all upcoming chores have been skipped when requested', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockDBUpcomingChoreAlreadySkipped = Object.assign({}, db_1.mockDB, {
                getAssignableUsersInOrderOfRecentCompletion: () => {
                    return [mock.user1];
                },
                getUpcomingUnassignedChores: () => {
                    return [mock.skippedChore];
                }
            });
            const actions = yield (0, main_1.messageHandler)({
                text: '!request',
                author: mock.user1
            }, mockDBUpcomingChoreAlreadySkipped);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} unable to find you a suitable new chore. ` +
                `This might happen if all available chores have been skipped`);
        }));
    });
    (0, mocha_1.describe)('!skip command', () => {
        it('should allow chores to be skipped by the assigned user', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!skip',
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
            let action = actions[0];
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.assignedChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(false);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`⏭ the chore "${mock.assignedChore.name}" has been successfully skipped`);
        }));
        it('should respond when there are no chores assigned to be skipped', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!skip',
                author: mock.user1
            }, db_1.mockDB // mockDB will always respond with empty lists by default
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} you have no chores currently assigned. ` +
                `If you would like to request a new chore you can use the ${(0, chat_1.inlineCode)(commands_1.RequestCommand.callsign)} command`);
        }));
    });
    (0, mocha_1.describe)('!complete command', () => {
        it('should respond when a chore has been completed', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!complete',
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action = actions[0];
            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.assignedChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(false);
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`✅ the chore "${mock.assignedChore.name}" has been successfully completed`);
        }));
        it('should respond when there are no chores assigned to be completed', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!complete',
                author: mock.user1
            }, db_1.mockDB // mockDB will always respond with empty lists by default
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} you have no chores currently assigned. ` +
                `If you would like to request a new chore you can use the ${(0, chat_1.inlineCode)(commands_1.RequestCommand.callsign)} command`);
        }));
        it('should allow completing a chore by name', () => __awaiter(void 0, void 0, void 0, function* () {
            // Note: the chore isn't assigned to the user
            const actions = yield (0, main_1.messageHandler)({
                text: `!complete ${mock.genericChore.name}`,
                author: mock.user1
            }, mock.DBWithChoreByName);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action = actions[0];
            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.genericChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(false);
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`✅ the chore "${mock.genericChore.name}" has been successfully completed`);
        }));
        it('should respond when unable to find chore to be completed', () => __awaiter(void 0, void 0, void 0, function* () {
            const missingChoreName = 'missing chore name';
            const actions = yield (0, main_1.messageHandler)({
                text: `!complete ${missingChoreName}`,
                author: mock.user1
            }, db_1.mockDB // mockDB will always be unable to find a chore
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action).to.deep.equal((0, actions_1.didYouMeanMessage)(missingChoreName, undefined, commands_1.CompleteCommand, mock.user1));
        }));
        it('should clear the skipped data for a chore on completion', () => __awaiter(void 0, void 0, void 0, function* () {
            let actions = yield (0, main_1.messageHandler)({
                text: '!skip',
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.assignedChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(false);
            const modifiedChore = action.chore;
            const mockDBWithModifiedChore = Object.assign({}, db_1.mockDB, {
                getChoreByName: (choreName) => {
                    (0, chai_1.expect)(choreName).to.equal(modifiedChore.name);
                    return modifiedChore;
                }
            });
            actions = yield (0, main_1.messageHandler)({
                text: `!complete ${modifiedChore.name}`,
                author: mock.user1
            }, mockDBWithModifiedChore);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            action = actions[0];
            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(modifiedChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.equal(false);
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            (0, chai_1.expect)(action.chore.skippedBy).to.be.undefined;
        }));
    });
    (0, mocha_1.describe)('!add command', () => {
        it('should offer help text if sent with one or zero arguments', () => __awaiter(void 0, void 0, void 0, function* () {
            // 0 args
            let actions = yield (0, main_1.messageHandler)({
                text: '!add',
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            let action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(commands_1.AddCommand.helpText);
            // 1 args
            actions = yield (0, main_1.messageHandler)({
                text: '!add test',
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(commands_1.AddCommand.helpText);
        }));
        it('should offer help text if sent without frequency', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!add many "args" but no frequency',
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(commands_1.AddCommand.helpText);
        }));
        it('should add a command with frequency if supplied', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockChoreName = 'water the tiles';
            const mockChoreFrequency = 'Weekly @ wednesday';
            const actions = yield (0, main_1.messageHandler)({
                text: `!add ${mockChoreName} ${mockChoreFrequency}`,
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'AddChore') {
                throw 'Received Action of the wrong type';
            }
            const chore = action.chore;
            (0, chai_1.expect)(chore.name).to.equal(mockChoreName);
            if (chore.frequency === undefined ||
                chore.frequency.kind !== 'Weekly' ||
                chore.frequency.weekday !== 'wednesday') {
                throw new Error('incorrect frequency');
            }
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} new chore '${mockChoreName}' successfully added with frequency 'Weekly @ Wednesday'`);
        }));
    });
    (0, mocha_1.describe)('!delete command', () => {
        it('should offer help text if sent with no arguments', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: '!delete',
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(commands_1.DeleteCommand.helpText);
        }));
        it('should respond if unable to find chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const missingChoreName = 'missing chore name';
            const actions = yield (0, main_1.messageHandler)({
                text: `!delete ${missingChoreName}`,
                author: mock.user1
            }, db_1.mockDB // mockDB will always be unable to find a chore
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action).to.deep.equal((0, actions_1.didYouMeanMessage)(missingChoreName, undefined, commands_1.DeleteCommand, mock.user1));
        }));
        it('should delete a chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!delete ${mock.genericChore}`,
                author: mock.user1
            }, mock.DBWithChoreByName);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'DeleteChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.genericChore.name);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} chore '${mock.genericChore}' successfully deleted`);
        }));
    });
    (0, mocha_1.describe)('!info command', () => {
        it('should show assigned chore if given no arguments', () => __awaiter(void 0, void 0, void 0, function* () {
            let actions = yield (0, main_1.messageHandler)({
                text: `!info`,
                author: mock.user1
            }, db_1.mockDB // mockDB will respond with undefined when asked to get assigned chores
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            let action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} you have no chores assigned`);
            actions = yield (0, main_1.messageHandler)({
                text: `!info`,
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.contain(mock.assignedChore.name);
        }));
        it('should respond if unable to find chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const missingChoreName = 'missing chore name';
            const actions = yield (0, main_1.messageHandler)({
                text: `!info ${missingChoreName}`,
                author: mock.user1
            }, db_1.mockDB // mockDB will respond with undefined when asked to getChoreByName
            );
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action).to.deep.equal((0, actions_1.didYouMeanMessage)(missingChoreName, undefined, commands_1.InfoCommand, mock.user1));
        }));
        it('should respond with suggestion if unable to find chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const misspelledChoreName = mock.genericChore.name + 'a';
            const actions = yield (0, main_1.messageHandler)({
                text: `!info ${misspelledChoreName}`,
                author: mock.user1
            }, mock.DBWithAllChoreNames);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action).to.deep.equal((0, actions_1.didYouMeanMessage)(misspelledChoreName, mock.genericChore.name, commands_1.InfoCommand, mock.user1));
        }));
        it('should describe a chore', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!info ${mock.genericChore.name}`,
                author: mock.user1
            }, mock.DBWithChoreByName);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
        }));
    });
    (0, mocha_1.describe)('!opt-in command', () => {
        it('should allow a user to add themselves', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!opt-in`,
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'AddUser') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} thank you for opting in to ChoresBot!!! ✨💚`);
        }));
    });
    (0, mocha_1.describe)('!opt-out command', () => {
        it('should allow a user to remove themselves', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!opt-out`,
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(2);
            let action = actions[0];
            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            action = actions[1];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} successfully opted-out, you should no longer be assigned any chores`);
        }));
        it('should unassign a user from any chores when they opt-out', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!opt-out`,
                author: mock.user1
            }, mock.DBWithChoreAssigned);
            (0, chai_1.expect)(actions).to.have.lengthOf(3);
            let action = actions[0];
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.chore.name).to.equal(mock.assignedChore.name);
            (0, chai_1.expect)(action.chore.assigned).to.be.false;
            action = actions[1];
            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.user.id).to.equal(mock.user1.id);
            action = actions[2];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} successfully opted-out, you should no longer be assigned any chores`);
        }));
    });
    (0, mocha_1.describe)('!help command', () => {
        it('should provide a summary of all commands if given no command name', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!help`,
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            for (const command of commands_1.AllCommands) {
                (0, chai_1.expect)(action.message.text).to.contain(command.summary);
            }
        }));
        it('should provide help text for a specific command', () => __awaiter(void 0, void 0, void 0, function* () {
            for (const command of commands_1.AllCommands) {
                const actions = yield (0, main_1.messageHandler)({
                    text: `!help ${command.callsign}`,
                    author: mock.user1
                }, db_1.mockDB);
                (0, chai_1.expect)(actions).to.have.lengthOf(1);
                const action = actions[0];
                if (action.kind !== 'SendMessage') {
                    throw 'Received Action of the wrong type';
                }
                if (command.helpText === undefined) {
                    (0, chai_1.expect)(action.message.text).to.contain(command.summary);
                }
                else {
                    (0, chai_1.expect)(action.message.text).to.contain(command.helpText);
                }
            }
        }));
        it('should provide help text for closest matching command', () => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)({
                text: `!help hep`,
                author: mock.user1
            }, db_1.mockDB);
            (0, chai_1.expect)(actions).to.have.lengthOf(1);
            const action = actions[0];
            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type';
            }
            (0, chai_1.expect)(action.message.text).to.contain(commands_1.HelpCommand.helpText);
        }));
    });
}));
(0, mocha_1.describe)('Actions performed at an interval', () => {
    it('should prompt users to complete chores', () => __awaiter(void 0, void 0, void 0, function* () {
        const actions = yield (0, main_1.loop)(mock.DBWithOutstandingChores);
        (0, chai_1.expect)(actions).to.have.lengthOf(2);
        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action = actions[0];
        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.chore.assigned).to.equal(mock.user1);
        action = actions[1];
        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} please do the chore: "${mock.overdueChore.name}"`);
    }));
    it('should not prompt users when there are no outstanding chores', () => __awaiter(void 0, void 0, void 0, function* () {
        const actions = yield (0, main_1.loop)(mock.DBWithUpcoming); // some upcoming, but no outstanding
        (0, chai_1.expect)(actions).to.have.lengthOf(0);
    }));
    it('should not re-assign a chore to a user after they skip it', () => __awaiter(void 0, void 0, void 0, function* () {
        let mockChore = {
            name: 'clean the dirt',
            assigned: mock.user1,
            frequency: mock.once
        };
        const mockDBSameChoreAssignedAndOutstanding = Object.assign({}, db_1.mockDB, {
            getAssignableUsersInOrderOfRecentCompletion: () => {
                return [mock.user1];
            },
            getChoresAssignedToUser: () => {
                return [mockChore];
            },
            getOutstandingUnassignedChores: () => {
                return [mockChore];
            }
        });
        let actions = yield (0, main_1.messageHandler)({
            text: '!skip',
            author: mock.user1
        }, mockDBSameChoreAssignedAndOutstanding);
        (0, chai_1.expect)(actions).to.have.lengthOf(2);
        // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
        let action = actions[0];
        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.chore.name).to.equal(mockChore.name);
        (0, chai_1.expect)(action.chore.assigned).to.equal(false);
        mockChore = action.chore; // re-assign so our mockDB "saves" any modifications
        action = actions[1];
        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.message.text).to.equal(`⏭ the chore "${mockChore.name}" has been successfully skipped`);
        actions = yield (0, main_1.loop)(mockDBSameChoreAssignedAndOutstanding);
        (0, chai_1.expect)(actions).to.have.lengthOf(0);
    }));
    it('should not assign multiple chores to the same user', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockChore1 = {
            name: 'clean the dirt',
            assigned: false,
            frequency: mock.once
        };
        const mockChore2 = {
            name: 'floss the steps',
            assigned: false,
            frequency: mock.once
        };
        const mockDBMultipleChoresAndMultipleUsers = Object.assign({}, db_1.mockDB, {
            getAssignableUsersInOrderOfRecentCompletion: () => {
                return [mock.user1, mock.user2];
            },
            getOutstandingUnassignedChores: () => {
                return [mockChore1, mockChore2];
            }
        });
        const actions = yield (0, main_1.loop)(mockDBMultipleChoresAndMultipleUsers);
        (0, chai_1.expect)(actions).to.have.lengthOf(4);
        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action = actions[0];
        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.chore.assigned).to.equal(mock.user1);
        action = actions[1];
        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user1)} please do the chore: "${mockChore1.name}"`);
        action = actions[2];
        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.chore.assigned).to.equal(mock.user2);
        action = actions[3];
        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type';
        }
        (0, chai_1.expect)(action.message.text).to.equal(`${(0, chat_1.tagUser)(mock.user2)} please do the chore: "${mockChore2.name}"`);
    }));
});
//# sourceMappingURL=main.spec.js.map