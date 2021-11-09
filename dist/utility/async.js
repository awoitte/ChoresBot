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
function asyncLoop(asyncCallback, milliseconds, immediateFirstCall = false, handleSIGINT = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let keepLooping = true;
        let cancel;
        if (immediateFirstCall) {
            keepLooping = yield asyncCallback();
        }
        if (handleSIGINT) {
            process.on('SIGINT', () => {
                if (cancel !== undefined) {
                    cancel();
                }
            });
        }
        while (keepLooping) {
            const [loop, cancelWait] = wait(milliseconds);
            cancel = cancelWait;
            yield loop.then(() => __awaiter(this, void 0, void 0, function* () {
                keepLooping = yield asyncCallback();
            }));
        }
    });
}
exports.asyncLoop = asyncLoop;
function wait(milliseconds) {
    let timeout;
    const promise = new Promise((resolve) => {
        timeout = setTimeout(resolve, milliseconds);
    });
    return [
        promise,
        () => {
            if (timeout !== undefined)
                clearTimeout(timeout);
        }
    ];
}
exports.wait = wait;
//# sourceMappingURL=async.js.map