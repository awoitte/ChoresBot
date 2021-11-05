"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByID = exports.getUsersSortedByCompletions = exports.getAllUsers = exports.deleteUser = exports.addUser = void 0;
exports.addUser = `
INSERT INTO users(name, id) VALUES ($1, $2)

-- possibly the user was deleted previously
ON CONFLICT (id) DO 
    UPDATE SET name = EXCLUDED.name, deleted = NULL
`;
exports.deleteUser = `
UPDATE users SET deleted = NOW() WHERE id = $1
`;
exports.getAllUsers = `
SELECT name, id FROM users WHERE deleted IS NULL
`;
exports.getUsersSortedByCompletions = `
SELECT name, id FROM users u
LEFT JOIN chore_completions c ON u.id = c.by
ORDER BY c.at DESC NULLS LAST
`;
exports.getUserByID = `
SELECT name, id FROM users WHERE id = $1 AND deleted IS NULL
`;
//# sourceMappingURL=users.js.map