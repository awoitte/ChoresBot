"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMostRecentCompletionForChore = exports.getAllUnassignedChores = exports.getChoresAssignedToUser = exports.getChoreCompletions = exports.completeChore = exports.getChoreByName = exports.getAllChoreNames = exports.modifyChore = exports.addSkip = exports.deleteChore = exports.addChores = void 0;
exports.addChores = `
INSERT INTO chores(name, assigned, frequency_kind, frequency_date, frequency_weekday) VALUES ($1, $2, $3, $4, $5)

-- possibly the chore was deleted previously
ON CONFLICT (name) DO UPDATE SET
    deleted = NULL,
    assigned = EXCLUDED.assigned,
    frequency_kind = EXCLUDED.frequency_kind,
    frequency_date = EXCLUDED.frequency_date,
    frequency_weekday = EXCLUDED.frequency_weekday
`;
exports.deleteChore = `
UPDATE chores SET deleted = NOW() WHERE name = $1
`;
const mostRecentCompletions = `
SELECT MAX(at) AS at, chore FROM chore_completions
GROUP BY chore 
`;
exports.addSkip = `
INSERT INTO chore_skips(chore, by) 
SELECT $1, CAST($2 AS VARCHAR)
WHERE NOT EXISTS (
    -- any skips by user since last completion
    SELECT 1 FROM chore_skips s
    LEFT JOIN (${mostRecentCompletions})
        AS c
        ON c.chore = s.chore
    WHERE s.at > c.at AND s.by = $2
)
`;
exports.modifyChore = `
UPDATE chores SET 
    assigned = $2,
    frequency_kind = $3,
    frequency_date = $4,
    frequency_weekday = $5
WHERE name = $1;
`;
exports.getAllChoreNames = `
SELECT name FROM chores WHERE deleted IS NULL
`;
function getChoresWhere(whereClause) {
    return `
SELECT 
    name,
    assigned,
    frequency_kind,
    frequency_date,
    frequency_weekday,
    array_agg(s.by) AS skipped_by
FROM chores
LEFT JOIN (${mostRecentCompletions})
    AS c
    ON c.chore = name
LEFT JOIN chore_skips s
    ON s.chore = name
    AND (s.at > c.at OR c.at IS NULL)
${whereClause}
GROUP BY name
    `;
}
exports.getChoreByName = getChoresWhere(`WHERE name = $1 AND deleted IS NULL`);
exports.completeChore = `
INSERT INTO chore_completions(chore, by) VALUES ($1, $2)
`;
exports.getChoreCompletions = `
SELECT by, name, at FROM chore_completions
INNER JOIN users u ON u.id = by
WHERE chore = $1
ORDER BY at DESC
`;
exports.getChoresAssignedToUser = getChoresWhere(`
WHERE assigned = $1 AND deleted IS NULL
`);
exports.getAllUnassignedChores = getChoresWhere(`
WHERE assigned IS NULL
`);
exports.getMostRecentCompletionForChore = `
SELECT at FROM (${mostRecentCompletions}) AS completions
WHERE chore = $1
`;
//# sourceMappingURL=chores.js.map