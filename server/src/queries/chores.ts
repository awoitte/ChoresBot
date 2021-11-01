export const addChores = `
INSERT INTO chores(name) VALUES ($1)

-- possibly the chore was deleted previously
ON CONFLICT (name) DO 
    UPDATE SET deleted = NULL
`

export const deleteChore = `
UPDATE chores SET deleted = NOW() WHERE name = $1
`

export const getAllChoreNames = `
SELECT name FROM chores WHERE deleted IS NULL
`

export const completeChore = `
INSERT INTO chore_completions(chore, by) VALUES ($1, $2)
`

export const getChoreCompletions = `
SELECT by, at FROM chore_completions WHERE chore = $1
`
