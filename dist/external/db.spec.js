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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const main_1 = require("../logic/main");
const chat_1 = require("./chat");
const mock = __importStar(require("../utility/mocks"));
(0, chai_1.use)(chai_as_promised_1.default);
mock.withTestDB(runDBTestSuite);
function runDBTestSuite(db) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.destroyEntireDB(); // if prior tests crashed there might be bad data to clean up
        (0, mocha_1.describe)('Database', () => {
            beforeEach(db.initDB.bind(db));
            (0, mocha_1.describe)('Chores', () => {
                it('should add and remember chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    const chores = yield db.getAllChoreNames();
                    (0, chai_1.expect)(chores).to.have.length(1);
                    (0, chai_1.expect)(chores[0]).to.equal(mock.genericChore.name);
                }));
                it('should not allow adding duplicate chores', () => __awaiter(this, void 0, void 0, function* () {
                    const clonedChore = Object.assign({}, mock.genericChore);
                    yield db.addChore(mock.genericChore);
                    yield (0, chai_1.expect)(db.addChore(clonedChore)).to.eventually.throw;
                }));
                it('should allow deleting chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.deleteChore(mock.genericChore.name);
                    const chores = yield db.getAllChoreNames();
                    (0, chai_1.expect)(chores).to.have.length(0);
                }));
                it('should allow re-adding a deleted chore', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.deleteChore(mock.genericChore.name);
                    yield (0, chai_1.expect)(db.addChore(mock.genericChore)).to.eventually.not
                        .throw;
                    const chores = yield db.getAllChoreNames();
                    (0, chai_1.expect)(chores).to.have.length(1);
                    (0, chai_1.expect)(chores[0]).to.equal(mock.genericChore.name);
                }));
                it('should get chores by name', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    const chore = yield db.getChoreByName(mock.genericChore.name);
                    if (chore === undefined) {
                        throw new Error("couldn't find chore");
                    }
                    (0, chai_1.expect)(chore.name).to.equal(mock.genericChore.name);
                    (0, chai_1.expect)(chore.assigned).to.equal(mock.genericChore.assigned);
                    (0, chai_1.expect)(chore.frequency).to.deep.equal(mock.genericChore.frequency);
                }));
                it('should not get deleted chores by name', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.deleteChore(mock.genericChore.name);
                    const chore = yield db.getChoreByName(mock.genericChore.name);
                    (0, chai_1.expect)(chore).to.be.undefined;
                }));
                it('should not get deleted chores by name', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.deleteChore(mock.genericChore.name);
                    const chore = yield db.getChoreByName(mock.genericChore.name);
                    (0, chai_1.expect)(chore).to.be.undefined;
                }));
                it('should allow modifying chores', () => __awaiter(this, void 0, void 0, function* () {
                    const mockChore = {
                        name: 'A',
                        assigned: false,
                        skippedBy: undefined,
                        frequency: {
                            kind: 'Daily',
                            time: new Date()
                        }
                    };
                    const mockModifiedChore = {
                        name: 'A',
                        assigned: mock.user1,
                        skippedBy: [mock.user2],
                        frequency: {
                            kind: 'Once',
                            date: new Date(0)
                        }
                    };
                    yield db.addUser(mock.user1);
                    yield db.addUser(mock.user2);
                    yield db.addChore(mockChore);
                    // check it's stored properly
                    let chore = yield db.getChoreByName(mockChore.name);
                    if (chore === undefined) {
                        throw new Error("couldn't find chore");
                    }
                    (0, chai_1.expect)(chore.name).to.equal(mockChore.name);
                    (0, chai_1.expect)(chore.assigned).to.equal(mockChore.assigned);
                    (0, chai_1.expect)(chore.frequency).to.deep.equal(mockChore.frequency);
                    (0, chai_1.expect)(chore.skippedBy).to.deep.equal(mockChore.skippedBy);
                    yield db.modifyChore(mockModifiedChore);
                    chore = yield db.getChoreByName(mockChore.name);
                    if (chore === undefined) {
                        throw new Error("couldn't find chore");
                    }
                    (0, chai_1.expect)(chore.name).to.equal(mockModifiedChore.name);
                    (0, chai_1.expect)(chore.assigned).to.deep.equal(mockModifiedChore.assigned);
                    (0, chai_1.expect)(chore.frequency).to.deep.equal(mockModifiedChore.frequency);
                    (0, chai_1.expect)(chore.skippedBy).to.deep.equal(mockModifiedChore.skippedBy);
                }));
                it('should not allow modifying deleted chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.deleteChore(mock.genericChore.name);
                    yield (0, chai_1.expect)(db.modifyChore(mock.genericChore)).to.eventually
                        .throw;
                }));
                it('should get chores assigned to a user', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.assignedChore);
                    const assignedChores = yield db.getChoresAssignedToUser(mock.user1);
                    (0, chai_1.expect)(assignedChores).to.have.length(1);
                    (0, chai_1.expect)(assignedChores[0].name).to.equal(mock.assignedChore.name);
                }));
                it('should not get deleted chores assigned to a user', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.assignedChore);
                    yield db.deleteChore(mock.assignedChore.name);
                    const assignedChores = yield db.getChoresAssignedToUser(mock.user1);
                    (0, chai_1.expect)(assignedChores).to.have.length(0);
                }));
                it('should get all assigned chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.assignedChore);
                    const assignedChores = yield db.getAllAssignedChores();
                    (0, chai_1.expect)(assignedChores).to.have.length(1);
                    (0, chai_1.expect)(assignedChores[0].name).to.equal(mock.assignedChore.name);
                }));
                it('should not get deleted chores with assigned chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.assignedChore);
                    let assignedChores = yield db.getAllAssignedChores();
                    (0, chai_1.expect)(assignedChores).to.have.length(1);
                    (0, chai_1.expect)(assignedChores[0].name).to.equal(mock.assignedChore.name);
                    yield db.deleteChore(mock.assignedChore.name);
                    assignedChores = yield db.getAllAssignedChores();
                    (0, chai_1.expect)(assignedChores).to.have.length(0);
                }));
                it('should get all outstanding unassigned chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.overdueChore);
                    yield db.addChore(mock.moreOverdueChore);
                    yield db.addChore(mock.upcomingChore);
                    yield db.addChore(mock.assignedChore);
                    let outstandingChores = yield db.getOutstandingUnassignedChores();
                    (0, chai_1.expect)(outstandingChores).to.have.length(2);
                    (0, chai_1.expect)(outstandingChores[0].name).to.equal(mock.moreOverdueChore.name);
                    (0, chai_1.expect)(outstandingChores[1].name).to.equal(mock.overdueChore.name);
                    yield db.addChoreCompletion(mock.overdueChore.name, mock.user1);
                    outstandingChores = yield db.getOutstandingUnassignedChores();
                    (0, chai_1.expect)(outstandingChores).to.have.length(1);
                    (0, chai_1.expect)(outstandingChores[0].name).to.equal(mock.moreOverdueChore.name);
                }));
                it('should not get deleted chores as outstanding', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.overdueChore);
                    yield db.addChore(mock.moreOverdueChore);
                    yield db.addChore(mock.upcomingChore);
                    yield db.addChore(mock.assignedChore);
                    let outstandingChores = yield db.getOutstandingUnassignedChores();
                    (0, chai_1.expect)(outstandingChores).to.have.length(2);
                    (0, chai_1.expect)(outstandingChores[0].name).to.equal(mock.moreOverdueChore.name);
                    (0, chai_1.expect)(outstandingChores[1].name).to.equal(mock.overdueChore.name);
                    yield db.deleteChore(mock.overdueChore.name);
                    outstandingChores = yield db.getOutstandingUnassignedChores();
                    (0, chai_1.expect)(outstandingChores).to.have.length(1);
                    (0, chai_1.expect)(outstandingChores[0].name).to.equal(mock.moreOverdueChore.name);
                }));
                it('should get all upcoming unassigned chores', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addChore(mock.overdueChore);
                    yield db.addChore(mock.upcomingChore);
                    yield db.addChore(mock.furtherUpcomingChore);
                    yield db.addChore(mock.assignedChore);
                    let upcomingChores = yield db.getUpcomingUnassignedChores();
                    (0, chai_1.expect)(upcomingChores).to.have.length(3);
                    (0, chai_1.expect)(upcomingChores[0].name).to.equal(mock.overdueChore.name);
                    (0, chai_1.expect)(upcomingChores[1].name).to.equal(mock.upcomingChore.name);
                    (0, chai_1.expect)(upcomingChores[2].name).to.equal(mock.furtherUpcomingChore.name);
                    yield db.addChoreCompletion(mock.upcomingChore.name, mock.user1);
                    upcomingChores = yield db.getUpcomingUnassignedChores();
                    (0, chai_1.expect)(upcomingChores).to.have.length(2);
                    (0, chai_1.expect)(upcomingChores[0].name).to.equal(mock.overdueChore.name);
                    (0, chai_1.expect)(upcomingChores[1].name).to.equal(mock.furtherUpcomingChore.name);
                }));
                it('should store chore completions', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.addUser(mock.user1);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    const completions = yield db.getAllChoreCompletions(mock.genericChore.name);
                    (0, chai_1.expect)(completions).to.have.length(1);
                }));
                it('should require a valid user to store chore completions', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield (0, chai_1.expect)(db.addChoreCompletion(mock.genericChore.name, mock.user1)).to.eventually.throw;
                }));
                it('should require a valid chore name to store chore completions', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield (0, chai_1.expect)(db.addChoreCompletion(mock.genericChore.name, mock.user1)).to.eventually.throw;
                }));
                it('should store chore completion times', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.addUser(mock.user1);
                    let before = new Date();
                    before = new Date(before.getTime() - 100); // add some wiggle-room
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    let after = new Date();
                    after = new Date(after.getTime() + 100); // add some wiggle-room
                    const completions = yield db.getAllChoreCompletions(mock.genericChore.name);
                    (0, chai_1.expect)(completions).to.have.length(1);
                    const completion = completions[0];
                    (0, chai_1.expect)(completion.at).to.be.above(before);
                    (0, chai_1.expect)(completion.at).to.be.below(after);
                }));
            });
            (0, mocha_1.describe)('Users', () => {
                it('should add and remember users', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    const users = yield db.getAllUsers();
                    (0, chai_1.expect)(users).to.have.length(1);
                    const user = users[0];
                    (0, chai_1.expect)(user.id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(user.name).to.equal(mock.user1.name);
                }));
                it('should not allow adding duplicate users', () => __awaiter(this, void 0, void 0, function* () {
                    const clonedUser = Object.assign({}, mock.user1, {
                        name: 'some other name'
                        // id is the same
                    });
                    yield db.addUser(mock.user1);
                    yield (0, chai_1.expect)(db.addUser(clonedUser)).to.eventually.throw;
                }));
                it('should allow deleting users', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.deleteUser(mock.user1);
                    const users = yield db.getAllUsers();
                    (0, chai_1.expect)(users).to.have.length(0);
                }));
                it('should allow re-adding a deleted user', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.deleteUser(mock.user1);
                    yield (0, chai_1.expect)(db.addUser(mock.user1)).to.eventually.not.throw;
                    const users = yield db.getAllUsers();
                    (0, chai_1.expect)(users).to.have.length(1);
                    const user = users[0];
                    (0, chai_1.expect)(user.id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(user.name).to.equal(mock.user1.name);
                }));
                it('should get users by id', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    const user = yield db.getUserByID(mock.user1.id);
                    if (user === undefined) {
                        throw new Error("didn't find user");
                    }
                    (0, chai_1.expect)(user.id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(user.name).to.equal(mock.user1.name);
                }));
                it('should not get deleted users by id', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.deleteUser(mock.user1);
                    const user = yield db.getUserByID(mock.user1.id);
                    (0, chai_1.expect)(user).to.be.undefined;
                }));
                it('should properly retrieve users ordered by recent completions', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addUser(mock.user2);
                    yield db.addUser(mock.user3);
                    yield db.addChore(mock.genericChore);
                    yield db.addChore(mock.upcomingChore);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    let users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user1.id);
                    // user 2 and 3 in non-deterministic order
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user2);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user3.id);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user3);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user3.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user1.id);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user3.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user2.id);
                    yield db.addChoreCompletion(mock.upcomingChore.name, mock.user2);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user3.id);
                }));
                it('should not return a user as assignable if they already have a chore assigned', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addUser(mock.user2);
                    yield db.addUser(mock.user3);
                    yield db.addChore(mock.genericChore);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user2);
                    let users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user3.id);
                    const choreNowAssigned = Object.assign({}, mock.genericChore, {
                        // id will be the same
                        assigned: mock.user2
                    });
                    yield db.modifyChore(choreNowAssigned);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(2);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user3.id);
                }));
                it('should not count deleted chores when getting users as assignable', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addUser(mock.user1);
                    yield db.addUser(mock.user2);
                    yield db.addUser(mock.user3);
                    yield db.addChore(mock.genericChore);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user2);
                    let users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user3.id);
                    const choreNowAssigned = Object.assign({}, mock.genericChore, {
                        // id will be the same
                        assigned: mock.user2
                    });
                    yield db.modifyChore(choreNowAssigned);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(2);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user3.id);
                    yield db.deleteChore(choreNowAssigned.name);
                    users = yield db.getAssignableUsersInOrderOfRecentCompletion();
                    (0, chai_1.expect)(users).to.have.length(3);
                    (0, chai_1.expect)(users[0].id).to.equal(mock.user2.id);
                    (0, chai_1.expect)(users[1].id).to.equal(mock.user1.id);
                    (0, chai_1.expect)(users[2].id).to.equal(mock.user3.id);
                }));
                it('should not count prior completions if a chore is re-added', () => __awaiter(this, void 0, void 0, function* () {
                    yield db.addChore(mock.genericChore);
                    yield db.addUser(mock.user1);
                    let actions = yield (0, main_1.loop)(db);
                    (0, chai_1.expect)(actions).to.have.lengthOf(2);
                    let action = actions[0];
                    if (action.kind !== 'ModifyChore') {
                        throw 'Received Action of the wrong type';
                    }
                    (0, chai_1.expect)(action.chore.assigned).to.deep.equal(mock.user1);
                    action = actions[1];
                    if (action.kind !== 'SendMessage') {
                        throw 'Received Action of the wrong type';
                    }
                    (0, chai_1.expect)(action.message.text).to.equal(`📋 ${(0, chat_1.tagUser)(mock.user1)} please do the chore: "${mock.genericChore.name}"`);
                    const mockChoreAssigned = Object.assign({}, mock.genericChore, {
                        // id is the same
                        assigned: mock.user1
                    });
                    yield db.modifyChore(mockChoreAssigned);
                    (0, chai_1.expect)(yield (0, main_1.loop)(db)).to.have.lengthOf(0);
                    yield db.addChoreCompletion(mock.genericChore.name, mock.user1);
                    (0, chai_1.expect)(yield (0, main_1.loop)(db)).to.have.lengthOf(0);
                    yield db.deleteChore(mock.genericChore.name);
                    (0, chai_1.expect)(yield (0, main_1.loop)(db)).to.have.lengthOf(0);
                    yield db.addChore(mock.genericChore);
                    actions = yield (0, main_1.loop)(db);
                    (0, chai_1.expect)(actions).to.have.lengthOf(2);
                    action = actions[0];
                    if (action.kind !== 'ModifyChore') {
                        throw 'Received Action of the wrong type';
                    }
                    (0, chai_1.expect)(action.chore.assigned).to.deep.equal(mock.user1);
                    action = actions[1];
                    if (action.kind !== 'SendMessage') {
                        throw 'Received Action of the wrong type';
                    }
                    (0, chai_1.expect)(action.message.text).to.equal(`📋 ${(0, chat_1.tagUser)(mock.user1)} please do the chore: "${mock.genericChore.name}"`);
                }));
            });
            (0, mocha_1.describe)('Config', () => __awaiter(this, void 0, void 0, function* () {
                it('should store and retrieve config values', () => __awaiter(this, void 0, void 0, function* () {
                    let value = yield db.getConfigValue('test');
                    (0, chai_1.expect)(value).to.be.null;
                    yield db.setConfigValue('test', 'a');
                    value = yield db.getConfigValue('test');
                    (0, chai_1.expect)(value).to.equal('a');
                }));
            }));
            afterEach(db.destroyEntireDB.bind(db));
            after(db.release.bind(db));
            // In order to run the test suite asynchronously we must use 'mocha --delay' and call run() here
            // async is required to run the tests with a real db connection
            (0, mocha_1.run)();
        });
    });
}
//# sourceMappingURL=db.spec.js.map