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
exports.withTestDB = exports.DBWithAllChoreNames = exports.DBWithChoreByName = exports.DBWithOutstandingChores = exports.DBWithChoreAssigned = exports.DBWithUpcoming = exports.furtherUpcomingChore = exports.upcomingChore = exports.moreOverdueChore = exports.overdueChore = exports.skippedChore = exports.genericChore = exports.assignedChore = exports.once = exports.user3 = exports.user2 = exports.user1 = exports.afterDST = exports.beforeDST = void 0;
const db_1 = require("../external/db");
const time_1 = require("../models/time");
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
function getOutstandingUnassignedChores() {
    return [exports.overdueChore];
}
function getChoreByName() {
    return exports.genericChore;
}
function getAllChoreNames() {
    return [exports.genericChore.name];
}
exports.DBWithUpcoming = Object.assign({}, db_1.mockDB, {
    getUpcomingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
});
exports.DBWithChoreAssigned = Object.assign({}, db_1.mockDB, {
    getChoresAssignedToUser
});
exports.DBWithOutstandingChores = Object.assign({}, db_1.mockDB, {
    getOutstandingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
});
exports.DBWithChoreByName = Object.assign({}, db_1.mockDB, {
    getChoreByName
});
exports.DBWithAllChoreNames = Object.assign({}, db_1.mockDB, {
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
//# sourceMappingURL=mocks.js.map