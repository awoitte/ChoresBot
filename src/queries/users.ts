export const addUser = `
INSERT INTO users(name, id) VALUES ($1, $2)

-- possibly the user was deleted previously
ON CONFLICT (id) DO 
    UPDATE SET name = EXCLUDED.name, deleted = NULL
`

export const deleteUser = `
UPDATE users SET deleted = NOW() WHERE id = $1
`

export const getAllUsers = `
SELECT name, id FROM users WHERE deleted IS NULL
`

export const getUnassignedUsersSortedByCompletions = `
SELECT u.name, u.id FROM users u
LEFT JOIN chore_completions ON u.id = chore_completions.by
LEFT JOIN chores ON u.id = chores.assigned AND chores.deleted IS NULL
WHERE chores.assigned IS NULL
ORDER BY chore_completions.at DESC NULLS LAST
`

export const getUserByID = `
SELECT name, id FROM users WHERE id = $1 AND deleted IS NULL
`
