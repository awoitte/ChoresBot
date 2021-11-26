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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_1 = require("./external/chat");
const db_1 = require("./external/db");
const log_1 = __importDefault(require("./utility/log"));
const env_1 = require("./utility/env");
const async_1 = require("./utility/async");
const mocks_1 = require("./utility/mocks");
const main_1 = require("./logic/main");
const time_1 = require("./logic/time");
const routes = __importStar(require("./routes"));
const chores_list_1 = __importDefault(require("./api/chores-list"));
const chore_info_1 = __importDefault(require("./api/chore-info"));
const path_1 = __importDefault(require("path"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    // --- Config ---
    const serverPort = process.env.PORT || '80';
    const clientUrlRoot = process.env.URL || `localhost:${serverPort}`;
    const dbConnectionString = process.env.POSTGRESQL_ADDON_URI || '';
    const frequencyString = process.env.FREQUENCY || '120';
    let frequency = parseInt(frequencyString, 10);
    if (isNaN(frequency)) {
        frequency = 120;
    }
    const channel = process.env.DISCORD_CHANNEL || 'chores';
    const token = process.env.DISCORD_TOKEN || '';
    const debugFlag = (0, env_1.isEnvFlagSet)('DEBUG');
    const verboseFlag = (0, env_1.isEnvFlagSet)('VERBOSE');
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
    const config = {
        morningTime,
        nightTime,
        debug: debugFlag,
        verbose: verboseFlag,
        clientUrlRoot,
        discordChannel: channel
    };
    // --- External Services ---
    let db;
    let chat;
    if (config.debug) {
        db = mocks_1.emptyDB;
        chat = mocks_1.chat;
    }
    else {
        const pgdb = yield (0, db_1.pgDB)(dbConnectionString);
        db = pgdb;
        yield pgdb.initDB();
        chat = yield (0, chat_1.initChat)(config, (msg) => __awaiter(void 0, void 0, void 0, function* () {
            const actions = yield (0, main_1.messageHandler)(msg, db, config).catch((e) => {
                (0, log_1.default)(`Error in message handler!: ${e}`, config);
                return [];
            });
            (0, log_1.default)(`message actions: ${JSON.stringify(actions)}`, config);
            yield performActions(actions, chat, db).catch((e) => {
                (0, log_1.default)(`Error performing actions!: ${e}`, config);
            });
        }));
        yield chat.login(token);
    }
    // --- Chat Bot ---
    (0, async_1.asyncLoop)(() => __awaiter(void 0, void 0, void 0, function* () {
        const actions = yield (0, main_1.loop)(db, config).catch((e) => {
            (0, log_1.default)(`Error in main loop!: ${e}`, config);
            return [];
        });
        (0, log_1.default)(`loop actions: ${JSON.stringify(actions)}`, config);
        yield performActions(actions, chat, db).catch((e) => {
            (0, log_1.default)(`Error performing actions!: ${e}`, config);
        });
        return true; // keep looping
    }), frequency * 1000, false, true);
    // --- Server ---
    const app = (0, express_1.default)();
    app.use(express_1.default.static('client/dist'));
    app.get(routes.choresListAPI, chores_list_1.default.bind(null, db));
    app.get(routes.choreInfoAPI, chore_info_1.default.bind(null, db));
    app.get('*', function (req, res, next) {
        // fallback to serve index.html for all other requests
        // (react router will handle individual pages)
        const options = {
            root: path_1.default.join(__dirname, '..', 'client/dist')
        };
        res.sendFile('index.html', options, (err) => {
            if (err) {
                next(err);
            }
        });
    });
    app.listen(serverPort, () => {
        (0, log_1.default)(`Listening at http://localhost:${serverPort}`, config);
    });
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