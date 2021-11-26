"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = exports.withTestDB = exports.DBWithAllChoreNames = exports.DBWithChoreByName = exports.DBWithOutstandingChores = exports.DBWithChoreAssigned = exports.DBWithUpcoming = exports.emptyDB = exports.furtherUpcomingChore = exports.upcomingChore = exports.moreOverdueChore = exports.overdueChore = exports.skippedChore = exports.genericChore = exports.assignedChore = exports.once = exports.user3 = exports.user2 = exports.user1 = exports.afterDST = exports.beforeDST = exports.config = void 0;
const db_1 = require("../external/db");
const time_1 = require("../models/time");
exports.config = {
    debug: false,
    verbose: false,
    clientUrlRoot: 'localhost',
    discordChannel: 'chores'
};
exports.beforeDST = new Date();
exports.beforeDST.setFullYear(2021);
exports.beforeDST.setMonth(time_1.Months.indexOf('November'));
exports.beforeDST.setDate(6);
exports.afterDST = new Date(exports.beforeDST.getTime());
exports.afterDST.setDate(7);
exports.user1 = {
    name: 'mockName',
    id: 'mockID'
};
exports.user2 = {
    name: 'mockUser2',
    id: 'mockUser2'
};
exports.user3 = {
    name: 'mockUser3',
    id: 'mockUser3'
};
exports.once = {
    kind: 'Once',
    date: new Date()
};
exports.assignedChore = {
    name: 'floop the pig',
    assigned: exports.user1,
    frequency: exports.once
};
exports.genericChore = {
    name: 'clean the dirt',
    assigned: false,
    frequency: exports.once
};
exports.skippedChore = {
    name: 'polish the plants',
    assigned: false,
    skippedBy: [exports.user1, exports.user2, exports.user3],
    frequency: exports.once
};
const overdueDate = new Date();
overdueDate.setTime(overdueDate.getTime() - time_1.hourInMilliseconds);
const overdue = {
    kind: 'Once',
    date: overdueDate
};
exports.overdueChore = Object.assign({}, exports.genericChore, {
    name: 'make a pile',
    frequency: overdue,
    assigned: false
});
const moreOverdueDate = new Date(overdueDate.getTime() - time_1.hourInMilliseconds);
const moreOverdue = {
    kind: 'Once',
    date: moreOverdueDate
};
exports.moreOverdueChore = Object.assign({}, exports.genericChore, {
    name: 'make more piles',
    frequency: moreOverdue,
    assigned: false
});
const upcomingDate = new Date();
upcomingDate.setTime(upcomingDate.getTime() + time_1.hourInMilliseconds);
const upcoming = {
    kind: 'Once',
    date: upcomingDate
};
exports.upcomingChore = Object.assign({}, exports.genericChore, {
    name: 'upcoming',
    frequency: upcoming,
    assigned: false
});
const furtherUpcomingDate = new Date(upcomingDate.getTime() + time_1.hourInMilliseconds);
const furtherUpcoming = {
    kind: 'Once',
    date: furtherUpcomingDate
};
exports.furtherUpcomingChore = Object.assign({}, exports.genericChore, {
    name: 'further upcoming',
    frequency: furtherUpcoming,
    assigned: false
});
function getUpcomingUnassignedChores() {
    return [exports.upcomingChore];
}
function getAssignableUsersInOrderOfRecentCompletion() {
    return [exports.user1];
}
function getChoresAssignedToUser() {
    return [exports.assignedChore];
}
function getAllAssignedChores() {
    return [exports.assignedChore];
}
function getOutstandingUnassignedChores() {
    return [exports.overdueChore];
}
function getChoreByName() {
    return exports.genericChore;
}
function getAllChoreNames() {
    return [exports.genericChore.name];
}
exports.emptyDB = {
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
    getAllAssignedChores: () => __awaiter(void 0, void 0, void 0, function* () {
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
exports.DBWithUpcoming = Object.assign({}, exports.emptyDB, {
    getUpcomingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
});
exports.DBWithChoreAssigned = Object.assign({}, exports.emptyDB, {
    getChoresAssignedToUser,
    getAllAssignedChores
});
exports.DBWithOutstandingChores = Object.assign({}, exports.emptyDB, {
    getOutstandingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
});
exports.DBWithChoreByName = Object.assign({}, exports.emptyDB, {
    getChoreByName
});
exports.DBWithAllChoreNames = Object.assign({}, exports.emptyDB, {
    getAllChoreNames
});
function withTestDB(callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const connectionString = process.env.CHORES_BOT_TEST_DB;
        if (connectionString === undefined) {
            console.log('No environment variable set for CHORES_BOT_TEST_DB. Please set this to the postgresql connection string to use for database testing.');
        }
        else {
            const db = yield (0, db_1.pgDB)(connectionString);
            yield db.destroyEntireDB(); // if prior tests crashed there might be bad data to clean up
            yield callback(db);
        }
    });
}
exports.withTestDB = withTestDB;
exports.chat = {
    login: () => __awaiter(void 0, void 0, void 0, function* () {
        return;
    }),
    sendChatMessage: (message) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(message.text);
    })
};
//# sourceMappingURL=mocks.js.map