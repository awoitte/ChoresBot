export default `
SET timezone = 'America/New_York';

CREATE TABLE users (
    name VARCHAR NOT NULL,
    id VARCHAR PRIMARY KEY,
    deleted timestamptz
);

CREATE TABLE chores (
    name VARCHAR PRIMARY KEY,
    created timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted timestamptz -- default is null
);


CREATE TABLE chore_completions (
    at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    by VARCHAR,
    chore VARCHAR,
    CONSTRAINT fk_users
        FOREIGN KEY (by) REFERENCES users(id),
    CONSTRAINT fk_chores
        FOREIGN KEY (chore) REFERENCES chores(name)
);
`
