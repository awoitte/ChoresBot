export const addUser = `
INSERT INTO users(name, id) VALUES ($1, $2)
`

export const getAllUsers = `
SELECT name, id FROM users
`
