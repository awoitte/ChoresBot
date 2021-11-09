"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.didYouMeanMessage = exports.assignChoreActions = exports.completeChoreActions = void 0;
const chat_1 = require("../models/chat");
const chores_1 = require("./chores");
const chat_2 = require("../external/chat");
function completeChoreActions(completedChore, user) {
    return [
        {
            kind: 'CompleteChore',
            chore: completedChore,
            user
        },
        {
            kind: 'SendMessage',
            message: {
                text: `✅ the chore "${completedChore.name}" has been successfully completed`,
                author: chat_1.ChoresBotUser
            }
        }
    ];
}
exports.completeChoreActions = completeChoreActions;
function assignChoreActions(chore, user) {
    return [
        {
            kind: 'ModifyChore',
            chore: (0, chores_1.assignChore)(chore, user)
        },
        {
            kind: 'SendMessage',
            message: {
                text: `${(0, chat_2.tagUser)(user)} please do the chore: "${chore.name}"`,
                author: chat_1.ChoresBotUser
            }
        }
    ];
}
exports.assignChoreActions = assignChoreActions;
function didYouMeanMessage(choreName, closestMatch, command, taggedUser) {
    if (closestMatch === undefined) {
        return {
            kind: 'SendMessage',
            message: {
                text: `${(0, chat_2.tagUser)(taggedUser)} Unable to find chore "${choreName}".`,
                author: chat_1.ChoresBotUser
            }
        };
    }
    return {
        kind: 'SendMessage',
        message: {
            text: `${(0, chat_2.tagUser)(taggedUser)} Unable to find chore "${choreName}". Did you mean ${(0, chat_2.inlineCode)(`${command.callsign} ${closestMatch}`)}?`,
            author: chat_1.ChoresBotUser
        }
    };
}
exports.didYouMeanMessage = didYouMeanMessage;
//# sourceMappingURL=actions.js.map