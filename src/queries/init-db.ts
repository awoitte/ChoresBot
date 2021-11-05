export default `
SET timezone = 'America/New_York';

CREATE TABLE users (
    name VARCHAR NOT NULL,
    id VARCHAR PRIMARY KEY,
    deleted timestamptz
);

CREATE TABLE chores (
    name VARCHAR PRIMARY KEY,
    assigned VARCHAR,
    frequency_kind VARCHAR NOT NULL,
    frequency_date timestamptz,
    frequency_weekday VARCHAR(9),
    created timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted timestamptz, -- default is null,
    CONSTRAINT fk_users
        FOREIGN KEY (assigned) REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE chore_completions (
    at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    by VARCHAR,
    chore VARCHAR,
    CONSTRAINT fk_users
        FOREIGN KEY (by) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_chores
        FOREIGN KEY (chore) REFERENCES chores(name)
        ON DELETE SET NULL
);

CREATE TABLE chore_skips (
    at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    by VARCHAR,
    chore VARCHAR,
    CONSTRAINT fk_users
        FOREIGN KEY (by) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_chores
        FOREIGN KEY (chore) REFERENCES chores(name)
        ON DELETE SET NULL
);
`
