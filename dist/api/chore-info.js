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
Object.defineProperty(exports, "__esModule", { value: true });
const chores_1 = require("../logic/chores");
function serveChoreInfo(db, request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const choreName = request.params.choreName;
        const chore = yield db.getChoreByName(choreName);
        if (chore === undefined) {
            response.send(`Unable to find chore "${choreName}"`);
            return;
        }
        const completions = yield db.getAllChoreCompletions(choreName);
        const mostRecentCompletion = completions.shift();
        response.send((0, chores_1.describeChore)(chore, mostRecentCompletion));
    });
}
exports.default = serveChoreInfo;
//# sourceMappingURL=chore-info.js.map