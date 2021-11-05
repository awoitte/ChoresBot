"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBWithChoreByName = exports.DBWithOutstandingChores = exports.DBWithChoreAssigned = exports.DBWithUpcoming = exports.furtherUpcomingChore = exports.upcomingChore = exports.moreOverdueChore = exports.overdueChore = exports.skippedChore = exports.genericChore = exports.assignedChore = exports.once = exports.user3 = exports.user2 = exports.user1 = void 0;
const db_1 = require("../external/db");
const time_1 = require("../models/time");
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
//# sourceMappingURL=mocks.js.map