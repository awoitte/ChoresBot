"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnvFlagSet = void 0;
function isEnvFlagSet(flagName) {
    const flag = process.env[flagName];
    return flag !== undefined && flag !== '' && flag.toLowerCase() != 'false';
}
exports.isEnvFlagSet = isEnvFlagSet;
//# sourceMappingURL=env.js.map