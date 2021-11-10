export const setValue = `
INSERT INTO config(key, value) VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value
`

export const getValue = `
SELECT value FROM config WHERE key = $1
`
