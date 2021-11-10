"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgDB = exports.mockDB = void 0;
const pg_1 = require("pg");
const time_1 = require("../models/time");
const chores_1 = require("../logic/chores");
const init_db_1 = __importDefault(require("../queries/init-db"));
const destroy_db_1 = __importDefault(require("../queries/destroy-db"));
const userQueries = __importStar(require("../queries/users"));
const choresQueries = __importStar(require("../queries/chores"));
const migrationQueries = __importStar(require("../queries/migrations"));
const configQueries = __importStar(require("../queries/config"));
exports.mockDB = {
    getAllUsers: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    getUserByID: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    addUser: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    deleteUser: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    getAssignableUsersInOrderOfRecentCompletion: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    getOutstandingUnassignedChores: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    getUpcomingUnassignedChores: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    addChore: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    modifyChore: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    deleteChore: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    getChoreByName: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    getChoresAssignedToUser: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    getAllChoreNames: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    addChoreCompletion: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    }),
    getAllChoreCompletions: () => __awaiter(void 0, void 0, void 0, function* () {
        return [];
    }),
    getConfigValue: () => __awaiter(void 0, void 0, void 0, function* () {
        return null;
    }),
    setConfigValue: () => __awaiter(void 0, void 0, void 0, function* () {
        return undefined;
    })
};
function pgDB(connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new pg_1.Pool({
            connectionString
        });
        const client = yield pool.connect();
        const db = {
            release: () => __awaiter(this, void 0, void 0, function* () {
                yield client.release();
            }),
            initDB: () => __awaiter(this, void 0, void 0, function* () {
                yield client.query(init_db_1.default);
                yield performMigrations(client);
            }),
            destroyEntireDB: () => __awaiter(this, void 0, void 0, function* () {
                yield client.query(destroy_db_1.default);
            }),
            addUser: (user) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(userQueries.addUser, [user.name, user.id]);
            }),
            deleteUser: (user) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(userQueries.deleteUser, [user.id]);
            }),
            getAllUsers: () => __awaiter(this, void 0, void 0, function* () {
                const userRes = yield client.query(userQueries.getAllUsers);
                return userRes.rows.map(rowToUser);
            }),
            getUserByID: (id) => __awaiter(this, void 0, void 0, function* () {
                const userRes = yield client.query(userQueries.getUserByID, [id]);
                if (userRes.rowCount != 1) {
                    return;
                }
                return rowToUser(userRes.rows[0]);
            }),
            getAssignableUsersInOrderOfRecentCompletion: () => __awaiter(this, void 0, void 0, function* () {
                const userRes = yield client.query(userQueries.getUnassignedUsersSortedByCompletions);
                return userRes.rows.map(rowToUser);
            }),
            getOutstandingUnassignedChores: () => __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                return getUnassignedOutstandingChoresAsOfDate(client, db, now);
            }),
            getUpcomingUnassignedChores: () => __awaiter(this, void 0, void 0, function* () {
                const now = new Date();
                const tomorrow = new Date(now.getTime() + time_1.dayInMilliseconds);
                return getUnassignedOutstandingChoresAsOfDate(client, db, tomorrow);
            }),
            addChore: (chore) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(choresQueries.addChores, choreToQueryParams(chore));
                yield addChoreSkips(chore, client);
            }),
            modifyChore: (chore) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(choresQueries.modifyChore, choreToQueryParams(chore));
                yield addChoreSkips(chore, client);
            }),
            deleteChore: (choreName) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(choresQueries.deleteChore, [choreName]);
            }),
            getChoreByName: (choreName) => __awaiter(this, void 0, void 0, function* () {
                const choreRes = yield client.query(choresQueries.getChoreByName, [
                    choreName
                ]);
                if (choreRes.rowCount != 1) {
                    return;
                }
                return yield rowToChore(choreRes.rows[0], db);
            }),
            getChoresAssignedToUser: (user) => __awaiter(this, void 0, void 0, function* () {
                const choresRes = yield client.query(choresQueries.getChoresAssignedToUser, [user.id]);
                return yield rowsToChores(choresRes.rows, db);
            }),
            getAllChoreNames: () => __awaiter(this, void 0, void 0, function* () {
                const choresRes = yield client.query(choresQueries.getAllChoreNames);
                return choresRes.rows.map((row) => row.name);
            }),
            addChoreCompletion: (choreName, user) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(choresQueries.completeChore, [
                    choreName,
                    user.id
                ]);
            }),
            getAllChoreCompletions: (choreName) => __awaiter(this, void 0, void 0, function* () {
                const choresRes = yield client.query(choresQueries.getChoreCompletions, [choreName]);
                return choresRes.rows.map((row) => ({
                    choreName,
                    by: {
                        name: row.name,
                        id: row.by
                    },
                    at: row.at
                }));
            }),
            getConfigValue: (key) => __awaiter(this, void 0, void 0, function* () {
                const response = yield client.query(configQueries.getValue, [key]);
                if (response.rowCount === 0) {
                    return null;
                }
                return response.rows[0].value;
            }),
            setConfigValue: (key, value) => __awaiter(this, void 0, void 0, function* () {
                yield client.query(configQueries.setValue, [key, value]);
            })
        };
        return db;
    });
}
exports.pgDB = pgDB;
/* eslint-disable  @typescript-eslint/no-explicit-any */
function choreToQueryParams(chore) {
    let date, weekday, assigned;
    if (chore.frequency.kind === 'Weekly') {
        weekday = chore.frequency.weekday;
    }
    else if (chore.frequency.kind === 'Daily') {
        date = chore.frequency.time;
    }
    else {
        date = chore.frequency.date;
    }
    if (chore.assigned !== false) {
        assigned = chore.assigned.id;
    }
    return [chore.name, assigned, chore.frequency.kind, date, weekday];
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
function rowToUser(row) {
    return {
        name: row.name,
        id: row.id
    };
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
function rowToChore(row, db) {
    return __awaiter(this, void 0, void 0, function* () {
        let assigned = false;
        if (row.assigned !== null) {
            const user = yield db.getUserByID(row.assigned);
            if (user === undefined) {
                throw new Error('unable to find assigned user');
            }
            assigned = user;
        }
        const chore = {
            name: row.name,
            assigned,
            frequency: parseFrequencyRowData(row.frequency_kind, row.frequency_weekday, row.frequency_date)
        };
        if (Array.isArray(row.skipped_by)) {
            const skips = row.skipped_by.filter((x) => x !== null);
            // null is returned if there aren't any skips
            if (skips.length > 0) {
                chore.skippedBy = [];
                for (const userID of skips) {
                    const user = yield db.getUserByID(userID);
                    if (user !== undefined) {
                        chore.skippedBy.push(user);
                    }
                }
            }
        }
        return chore;
    });
}
/* eslint-disable  @typescript-eslint/no-explicit-any */
function rowsToChores(rows, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const chores = [];
        for (const row of rows) {
            chores.push(yield rowToChore(row, db));
        }
        return chores;
    });
}
function parseFrequencyRowData(kind, weekday, date) {
    switch (kind) {
        case 'Daily':
            return {
                kind: 'Daily',
                time: date
            };
        case 'Weekly':
            return {
                kind: 'Weekly',
                weekday: weekday
            };
        case 'Yearly':
            return {
                kind: 'Yearly',
                date: date
            };
        case 'Once':
            return {
                kind: 'Once',
                date: date
            };
        default:
            throw new Error('unable to parse frequency');
    }
}
function addChoreSkips(chore, client) {
    return __awaiter(this, void 0, void 0, function* () {
        if (chore.skippedBy !== undefined) {
            for (const user of chore.skippedBy) {
                // query only adds if one doesn't already exist
                yield client.query(choresQueries.addSkip, [chore.name, user.id]);
            }
        }
    });
}
function getUnassignedOutstandingChoresAsOfDate(client, db, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const unassignedRes = yield client.query(choresQueries.getAllUnassignedChores);
        const unassignedChores = yield rowsToChores(unassignedRes.rows, db);
        const upcomingChores = [];
        for (const chore of unassignedChores) {
            const recentCompletionRes = yield client.query(choresQueries.getMostRecentCompletionForChore, [chore.name]);
            let recentCompletion;
            if (recentCompletionRes.rowCount >= 1) {
                recentCompletion = recentCompletionRes.rows[0].at;
            }
            const dueDate = (0, chores_1.getChoreDueDate)(chore, recentCompletion);
            if (dueDate === undefined) {
                continue;
            }
            if (dueDate < date) {
                upcomingChores.push([chore, dueDate]);
            }
        }
        upcomingChores.sort((tupleA, tupleB) => tupleA[1].getTime() - tupleB[1].getTime());
        return upcomingChores.map((tuple) => tuple[0]);
    });
}
function performMigrations(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const migrationIndexRes = yield client.query(migrationQueries.getMigrationIndex);
        if (migrationIndexRes === undefined ||
            migrationIndexRes.rows.length !== 1 ||
            migrationIndexRes.rows[0] === undefined ||
            migrationIndexRes.rows[0].index === undefined) {
            throw new Error('unable to parse db migrations');
        }
        let migrationIndex = migrationIndexRes.rows[0].index;
        if (migrationIndex === null) {
            // no migrations performed yet
            migrationIndex = -1;
        }
        try {
            yield client.query('BEGIN');
            for (let i = migrationIndex + 1; // only perform migrations that are past the existing index
             i < migrationQueries.Migrations.length; i++) {
                yield client.query(migrationQueries.Migrations[i]);
                yield client.query(migrationQueries.addMigrationIndex, [i]);
            }
            yield client.query('COMMIT');
        }
        catch (e) {
            yield client.query('ROLLBACK');
            throw e;
        }
    });
}
//# sourceMappingURL=db.js.map