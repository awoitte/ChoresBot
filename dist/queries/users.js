"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByID = exports.getUnassignedUsersSortedByCompletions = exports.getAllUsers = exports.deleteUser = exports.addUser = void 0;
const chores_1 = require("./chores");
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
exports.getUnassignedUsersSortedByCompletions = `
SELECT u.name, u.id FROM users u
LEFT JOIN (${chores_1.mostRecentCompletionOfUsers}) AS chore_completions ON u.id = chore_completions.by
LEFT JOIN chores ON u.id = chores.assigned AND chores.deleted IS NULL
WHERE chores.assigned IS NULL
ORDER BY chore_completions.at DESC NULLS LAST
`;
exports.getUserByID = `
SELECT name, id FROM users WHERE id = $1 AND deleted IS NULL
`;
//# sourceMappingURL=users.js.map