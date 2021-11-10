"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValue = exports.setValue = void 0;
exports.setValue = `
INSERT INTO config(key, value) VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value
`;
exports.getValue = `
SELECT value FROM config WHERE key = $1
`;
//# sourceMappingURL=config.js.map