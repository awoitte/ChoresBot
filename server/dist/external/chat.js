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
exports.inlineCode = exports.italic = exports.underscore = exports.bold = exports.tagUser = exports.initChat = void 0;
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const log_1 = __importDefault(require("../logging/log"));
const debug_1 = require("../utility/debug");
function initChat(channelName, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new discord_js_1.Client({
            intents: [
                discord_js_1.Intents.FLAGS.DIRECT_MESSAGES,
                discord_js_1.Intents.FLAGS.GUILDS,
                discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
                discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
            ]
        });
        client.on('messageCreate', (msg) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            (0, log_1.default)(`Message Received: [${msg.author.tag} in ${(_a = msg.guild) === null || _a === void 0 ? void 0 : _a.name}] ${msg.content}`);
            if (msg.channel instanceof discord_js_1.TextChannel &&
                msg.channel.name == channelName &&
                !msg.author.bot // if ChoresBot isn't the author
            ) {
                callback({
                    text: msg.content,
                    author: {
                        name: msg.author.tag,
                        id: msg.author.id
                    }
                });
            }
            if (msg.content === 'ping') {
                msg.react('🏓').catch((reason) => {
                    (0, log_1.default)(`failed to react: '${reason}'`);
                });
            }
        }));
        client.on('messageUpdate', (oldMessage, newMessage) => {
            var _a;
            (0, log_1.default)(`messageUpdate: [${(_a = newMessage.author) === null || _a === void 0 ? void 0 : _a.username}] from "${oldMessage.content}" to "${newMessage.content}"`);
        });
        client.on('messageReactionAdd', (reaction, user) => {
            (0, log_1.default)(`messageReactionAdd: [${user.username}] ${reaction.emoji}`);
        });
        client.on('messageReactionRemove', (reaction, user) => {
            (0, log_1.default)(`messageReactionRemove: [${user.username}] ${reaction.emoji}`);
        });
        return {
            login: (token) => __awaiter(this, void 0, void 0, function* () {
                client.on('ready', () => {
                    var _a;
                    (0, log_1.default)(`Logged in as "${(_a = client === null || client === void 0 ? void 0 : client.user) === null || _a === void 0 ? void 0 : _a.tag}"!`);
                });
                if (!(0, debug_1.isDebugFlagSet)()) {
                    client.login(token);
                }
            }),
            sendChatMessage: (message) => __awaiter(this, void 0, void 0, function* () {
                const guilds = yield client.guilds.fetch();
                if (guilds.size === 0) {
                    throw new Error('Not registered to any guilds/servers');
                }
                if (guilds.size != 1) {
                    (0, log_1.default)(`Warning: ChoresBot is registered to multiple guilds/servers, sending messages to all`);
                }
                for (const guildRef of guilds.values()) {
                    const guild = yield guildRef.fetch();
                    const channels = yield guild.channels.fetch();
                    for (const channel of channels.values()) {
                        if (channel instanceof discord_js_1.TextChannel &&
                            channel.name == channelName) {
                            channel.send(message.text);
                        }
                    }
                }
            })
        };
    });
}
exports.initChat = initChat;
function tagUser(user) {
    return (0, builders_1.userMention)(user.id);
}
exports.tagUser = tagUser;
var builders_2 = require("@discordjs/builders");
Object.defineProperty(exports, "bold", { enumerable: true, get: function () { return builders_2.bold; } });
Object.defineProperty(exports, "underscore", { enumerable: true, get: function () { return builders_2.underscore; } });
Object.defineProperty(exports, "italic", { enumerable: true, get: function () { return builders_2.italic; } });
Object.defineProperty(exports, "inlineCode", { enumerable: true, get: function () { return builders_2.inlineCode; } });
//# sourceMappingURL=chat.js.map