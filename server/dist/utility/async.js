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
exports.wait = exports.asyncLoop = void 0;
function asyncLoop(asyncCallback, milliseconds, immediateFirstCall = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let keepLooping = true;
        if (immediateFirstCall) {
            keepLooping = yield asyncCallback();
        }
        while (keepLooping) {
            yield wait(milliseconds).then(() => __awaiter(this, void 0, void 0, function* () {
                keepLooping = yield asyncCallback();
            }));
        }
    });
}
exports.asyncLoop = asyncLoop;
function wait(milliseconds) {
    const promise = new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
    return promise;
}
exports.wait = wait;
//# sourceMappingURL=async.js.map