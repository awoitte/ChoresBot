"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDebugFlagSet = void 0;
function isDebugFlagSet() {
    const debugFlag = process.env.DEBUG;
    return (debugFlag !== undefined &&
        debugFlag !== '' &&
        debugFlag.toLowerCase() != 'false');
}
exports.isDebugFlagSet = isDebugFlagSet;
//# sourceMappingURL=debug.js.map