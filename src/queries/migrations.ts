// each query string in the `Migrations` array will be applied once to existing databases.
// The index in the array is used to track which migrations have been performed, therefore:
//
// **DO NOT REMOVE OR RE-ORDER ENTRIES**
export const Migrations = []

export const getMigrationIndex = `
SELECT MAX(index) as index FROM migrations
`

export const addMigrationIndex = `
INSERT INTO migrations(index) VALUES ($1)
`
