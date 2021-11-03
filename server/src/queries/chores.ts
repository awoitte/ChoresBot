export const addChores = `
INSERT INTO chores(name, assigned, frequency_kind, frequency_date, frequency_weekday) VALUES ($1, $2, $3, $4, $5)

-- possibly the chore was deleted previously
ON CONFLICT (name) DO UPDATE SET
    deleted = NULL,
    assigned = EXCLUDED.assigned,
    frequency_kind = EXCLUDED.frequency_kind,
    frequency_date = EXCLUDED.frequency_date,
    frequency_weekday = EXCLUDED.frequency_weekday
`

export const deleteChore = `
UPDATE chores SET deleted = NOW() WHERE name = $1
`

const mostRecentCompletions = `
SELECT MAX(at) AS at, chore FROM chore_completions
GROUP BY chore 
`

export const addSkip = `
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
`

export const modifyChore = `
UPDATE chores SET 
    assigned = $2,
    frequency_kind = $3,
    frequency_date = $4,
    frequency_weekday = $5
WHERE name = $1;
`

export const getAllChoreNames = `
SELECT name FROM chores WHERE deleted IS NULL
`

function getChoresWhere(whereClause: string) {
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
    `
}

export const getChoreByName = getChoresWhere(
    `WHERE name = $1 AND deleted IS NULL`
)

export const completeChore = `
INSERT INTO chore_completions(chore, by) VALUES ($1, $2)
`

export const getChoreCompletions = `
SELECT by, at FROM chore_completions WHERE chore = $1
`

export const getChoresAssignedToUser = getChoresWhere(`
WHERE assigned = $1 AND deleted IS NULL
`)

export const getAllUnassignedChores = getChoresWhere(`
WHERE assigned IS NULL
`)

export const getMostRecentCompletionForChore = `
SELECT at FROM (${mostRecentCompletions}) AS completions
WHERE chore = $1
`
