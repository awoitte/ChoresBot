"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function log(message, config) {
    if (config.debug || config.verbose) {
        console.log(message);
    }
}
exports.default = log;
//# sourceMappingURL=log.js.map