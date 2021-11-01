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
