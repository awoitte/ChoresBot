"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("../utility/debug");
function log(message) {
    if ((0, debug_1.isDebugFlagSet)() || process.env.VERBOSE === 'TRUE') {
        console.log(message);
    }
}
exports.default = log;
//# sourceMappingURL=log.js.map