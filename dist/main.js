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
const express_1 = __importDefault(require("express"));
const chat_1 = require("./external/chat");
const db_1 = require("./external/db");
const log_1 = __importDefault(require("./utility/log"));
const debug_1 = require("./utility/debug");
const async_1 = require("./utility/async");
const mocks_1 = require("./utility/mocks");
const main_1 = require("./logic/main");
const time_1 = require("./logic/time");
(() => __awaiter(void 0, void 0, void 0, function* () {
    // --- Config ---
    const serverPort = process.env.PORT || '80';
    const dbConnectionString = process.env.POSTGRESQL_ADDON_URI || '';
    const frequencyString = process.env.FREQUENCY || '120';
    let frequency = parseInt(frequencyString, 10);
    if (isNaN(frequency)) {
        frequency = 120;
    }
    const channel = process.env.DISCORD_CHANNEL || 'chores';
    const token = process.env.DISCORD_TOKEN || '';
    let morningTime;
    if (process.env.MORNING_TIME !== undefined) {
        morningTime = (0, time_1.parseTime)(process.env.MORNING_TIME);
    }
    if (morningTime === undefined) {
        // check `morningTime` is undefined instead of
        // `process.env.MORNING_TIME` to handle the case that
        // `MORNING_TIME` was set but was an invalid format
        morningTime = (0, time_1.parseTime)('7:00 AM');
    }
    let nightTime;
    if (process.env.NIGHT_TIME !== undefined) {
        nightTime = (0, time_1.parseTime)(process.env.NIGHT_TIME);
    }
    if (nightTime === undefined) {
        nightTime = (0, time_1.parseTime)('11:00 PM');
    }
    // --- Server ---
    const app = (0, express_1.default)();
    app.use(express_1.default.static('./client/dist'));
    app.listen(serverPort, () => {
        (0, log_1.default)(`Listening at http://localhost:${serverPort}`);
    });
    // --- External Services ---
    let db;
    let chat;
    if ((0, debug_1.isDebugFlagSet)()) {
        db = mocks_1.emptyDB;
        chat = mocks_1.chat;
    }
    else {
        const pgdb = yield (0, db_1.pgDB)(dbConnectionString);
        db = pgdb;
        yield pgdb.initDB();
        chat = yield (0, chat_1.initChat)(channel, (msg) => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)(msg, db).catch((e) => {
                (0, log_1.default)(`Error in message handler!: ${e}`);
                return [];
            });
            (0, log_1.default)(`message actions: ${JSON.stringify(actions)}`);
            yield performActions(actions, chat, db).catch((e) => {
                (0, log_1.default)(`Error performing actions!: ${e}`);
            });
        }));
        yield chat.login(token);
    }
    // --- Chat Bot ---
    (0, async_1.asyncLoop)(() => __awaiter(void 0, void 0, void 0, function* () {
        const actions = yield (0, main_1.loop)(db, morningTime, nightTime).catch((e) => {
            (0, log_1.default)(`Error in main loop!: ${e}`);
            return [];
        });
        (0, log_1.default)(`loop actions: ${JSON.stringify(actions)}`);
        yield performActions(actions, chat, db).catch((e) => {
            (0, log_1.default)(`Error performing actions!: ${e}`);
        });
        return true; // keep looping
    }), frequency * 1000, false, true);
}))();
function performActions(actions, chat, db) {
    return __awaiter(this, void 0, void 0, function* () {
        // Note: If one action fails the following actions won't be performed
        for (const action of actions) {
            switch (action.kind) {
                case 'SendMessage': {
                    yield chat.sendChatMessage(action.message);
                    break;
                }
                case 'CompleteChore': {
                    yield db.addChoreCompletion(action.chore.name, action.user);
                    yield db.modifyChore(action.chore);
                    break;
                }
                case 'AddChore': {
                    yield db.addChore(action.chore);
                    break;
                }
                case 'ModifyChore': {
                    yield db.modifyChore(action.chore);
                    break;
                }
                case 'DeleteChore': {
                    yield db.deleteChore(action.chore.name);
                    break;
                }
                case 'AddUser': {
                    yield db.addUser(action.user);
                    break;
                }
                case 'DeleteUser': {
                    yield db.deleteUser(action.user);
                    break;
                }
            }
        }
    });
}
//# sourceMappingURL=main.js.map