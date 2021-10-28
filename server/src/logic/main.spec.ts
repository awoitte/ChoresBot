import { describe } from 'mocha'
import { expect } from 'chai'

import { loop, messageHandler } from './main'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { User } from '../models/chat'
import { AddCommand, DeleteCommand } from './commands'

import { mockDB } from '../external/db'
import { Frequency } from '../models/time'
import { describeChore } from './chores'

// --- Mocks ---
const mockUser: User = {
    name: 'mockName',
    id: 'mockID'
}

const mockUser2: User = {
    name: 'mockUser2',
    id: 'mockUser2'
}

const mockFrequency: Frequency = {
    kind: 'Once',
    date: new Date()
}

const mockUpcomingChore: Chore = {
    name: 'walk the cat',
    assigned: mockUser,
    frequency: mockFrequency
}

const mockAssignedChore: Chore = {
    name: 'floop the pig',
    assigned: mockUser,
    frequency: mockFrequency
}

const mockOutstandingChore: Chore = {
    name: 'make a pile',
    assigned: mockUser,
    frequency: mockFrequency
}

const mockGenericChore: Chore = {
    name: 'clean the dirt',
    assigned: mockUser,
    skippedBy: [mockUser],
    frequency: mockFrequency
}

function getUpcomingUnassignedChores() {
    return [mockUpcomingChore]
}

function getAssignableUsersInOrderOfRecentCompletion() {
    return [mockUser]
}

function getChoresAssignedToUser() {
    return [mockAssignedChore]
}

function getOutstandingUnassignedChores() {
    return [mockOutstandingChore]
}

function getChoreByName() {
    return mockGenericChore
}

const mockDBWithUpcoming = Object.assign({}, mockDB, {
    getUpcomingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

const mockDBWithChoreAssigned = Object.assign({}, mockDB, {
    getChoresAssignedToUser
})

const mockDBWithOutstandingChores = Object.assign({}, mockDB, {
    getOutstandingUnassignedChores,
    getAssignableUsersInOrderOfRecentCompletion
})

const mockDBWithChoreByName = Object.assign({}, mockDB, {
    getChoreByName
})

// --- Tests ---
describe('Message handling logic', () => {
    it('should parse messages and determine actions', () => {
        const actions = messageHandler(
            {
                text: 'test',
                author: {
                    name: '',
                    id: ''
                }
            },
            mockDB
        )

        expect(actions).is.not.undefined
        expect(actions).to.have.lengthOf(0)
    })

    describe('ping command', () => {
        it('should reply to "ping" with "pong"', () => {
            const actions = messageHandler(
                {
                    text: 'ping',
                    author: {
                        name: '',
                        id: ''
                    }
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal('pong')
        })
    })

    describe('!request command', () => {
        it('should provide the closest upcoming chore when requested', () => {
            const actions = messageHandler(
                {
                    text: '!request',
                    author: mockUser
                },
                mockDBWithUpcoming
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockUpcomingChore.name)
            expect(action.chore.assigned).to.equal(mockUser)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} please do the chore: "${mockUpcomingChore.name}"`
            )
        })

        it('should respond when a chore is requested but the user is already assigned to a chore', () => {
            const actions = messageHandler(
                {
                    text: '!request',
                    author: mockUser
                },
                mockDBWithChoreAssigned
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} you are already assigned the chore "${mockAssignedChore.name}". ` +
                    `If you would like to skip you can use the "!skip" command`
            )
        })

        it('should respond when there are no upcoming chores when requested', () => {
            const actions = messageHandler(
                {
                    text: '!request',
                    author: mockUser
                },
                mockDB // mockDB will always respond with empty lists by default
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} there are no upcoming chores`
            )
        })

        it('should respond when all upcoming chores have been skipped when requested', () => {
            const mockDBUpcomingChoreAlreadySkipped = Object.assign(
                {},
                mockDB,
                {
                    getAssignableUsersInOrderOfRecentCompletion: () => {
                        return [mockUser]
                    },

                    getUpcomingUnassignedChores: () => {
                        return [mockGenericChore]
                    }
                }
            )

            const actions = messageHandler(
                {
                    text: '!request',
                    author: mockUser
                },
                mockDBUpcomingChoreAlreadySkipped
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} unable to find you a suitable new chore. ` +
                    `This might happen if all available chores have been skipped`
            )
        })
    })

    describe('!skip command', () => {
        it('should allow chores to be skipped by the assigned user', () => {
            const actions = messageHandler(
                {
                    text: '!skip',
                    author: mockUser
                },
                mockDBWithChoreAssigned
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockAssignedChore.name)
            expect(action.chore.assigned).to.equal(false)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `⏭ the chore "${mockAssignedChore.name}" has been successfully skipped`
            )
        })

        it('should respond when there are no chores assigned to be skipped', () => {
            const actions = messageHandler(
                {
                    text: '!skip',
                    author: mockUser
                },
                mockDB // mockDB will always respond with empty lists by default
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} you have no chores currently assigned. ` +
                    `If you would like to request a new chore you can use the "!request" command`
            )
        })
    })

    describe('!complete command', () => {
        it('should respond when a chore has been completed', () => {
            const actions = messageHandler(
                {
                    text: '!complete',
                    author: mockUser
                },
                mockDBWithChoreAssigned
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockAssignedChore.name)
            expect(action.chore.assigned).to.equal(false)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✅ the chore "${mockAssignedChore.name}" has been successfully completed`
            )
        })

        it('should respond when there are no chores assigned to be completed', () => {
            const actions = messageHandler(
                {
                    text: '!complete',
                    author: mockUser
                },
                mockDB // mockDB will always respond with empty lists by default
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} you have no chores currently assigned. ` +
                    `If you would like to request a new chore you can use the "!request" command`
            )
        })

        it('should allow completing a chore by name', () => {
            // Note: the chore isn't assigned to the user

            const actions = messageHandler(
                {
                    text: `!complete ${mockGenericChore.name}`,
                    author: mockUser
                },
                mockDBWithChoreByName
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockGenericChore.name)
            expect(action.chore.assigned).to.equal(false)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✅ the chore "${mockGenericChore.name}" has been successfully completed`
            )
        })

        it('should respond when unable to find chore to be completed', () => {
            const missingChoreName = 'missing chore name'
            const actions = messageHandler(
                {
                    text: `!complete ${missingChoreName}`,
                    author: mockUser
                },
                mockDB // mockDB will always be unable to find a chore
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} Unable to find chore "${missingChoreName}". Try using the !info command to verify the spelling.`
            )
        })

        it('should clear the skipped data for a chore on completion', () => {
            let actions = messageHandler(
                {
                    text: '!skip',
                    author: mockUser
                },
                mockDBWithChoreAssigned
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockAssignedChore.name)
            expect(action.chore.assigned).to.equal(false)

            const modifiedChore = action.chore

            const mockDBWithModifiedChore = Object.assign({}, mockDB, {
                getChoreByName: (choreName: string) => {
                    expect(choreName).to.equal(modifiedChore.name)
                    return modifiedChore
                }
            })

            actions = messageHandler(
                {
                    text: `!complete ${modifiedChore.name}`,
                    author: mockUser
                },
                mockDBWithModifiedChore
            )

            expect(actions).to.have.lengthOf(2)

            action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(modifiedChore.name)
            expect(action.chore.assigned).to.equal(false)
            expect(action.chore.skippedBy).to.be.undefined
        })
    })

    describe('!add command', () => {
        it('should offer help text if sent with one or zero arguments', () => {
            // 0 args
            let actions = messageHandler(
                {
                    text: '!add',
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(1)

            let action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)

            // 1 args
            actions = messageHandler(
                {
                    text: '!add test',
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(1)

            action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)
        })

        it('should offer help text if sent without frequency', () => {
            const actions = messageHandler(
                {
                    text: '!add many "args" but no frequency',
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)
        })

        it('should add a command with frequency if supplied', () => {
            const mockChoreName = 'water the tiles'
            const mockChoreFrequency = 'Weekly @ wednesday'

            const actions = messageHandler(
                {
                    text: `!add ${mockChoreName} ${mockChoreFrequency}`,
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'AddChore') {
                throw 'Received Action of the wrong type'
            }

            const chore = action.chore

            expect(chore.name).to.equal(mockChoreName)

            if (
                chore.frequency === undefined ||
                chore.frequency.kind !== 'Weekly' ||
                chore.frequency.weekday !== 'wednesday'
            ) {
                throw new Error('incorrect frequency')
            }

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} new chore '${mockChoreName}' successfully added with frequency '${mockChoreFrequency}'`
            )
        })
    })

    describe('!delete command', () => {
        it('should offer help text if sent with no arguments', () => {
            const actions = messageHandler(
                {
                    text: '!delete',
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(DeleteCommand.helpText)
        })

        it('should respond if unable to find chore', () => {
            const missingChoreName = 'missing chore name'
            const actions = messageHandler(
                {
                    text: `!delete ${missingChoreName}`,
                    author: mockUser
                },
                mockDB // mockDB will always be unable to find a chore
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} Unable to find chore "${missingChoreName}". Try using the !info command to verify the spelling.`
            )
        })

        it('should delete a chore', () => {
            const actions = messageHandler(
                {
                    text: `!delete ${mockGenericChore}`,
                    author: mockUser
                },
                mockDBWithChoreByName
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'DeleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockGenericChore.name)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} chore '${mockGenericChore}' successfully deleted`
            )
        })
    })

    describe('!info command', () => {
        it('should show all chore names if given no arguments', () => {
            const mockChoreName = 'clean the dirt'

            const mockDBWithChoreName = Object.assign({}, mockDB, {
                getAllChoreNames: () => {
                    return [mockChoreName]
                }
            })

            const actions = messageHandler(
                {
                    text: '!info',
                    author: mockUser
                },
                mockDBWithChoreName
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                'All Chores:\n' + `"${mockChoreName}"`
            )
        })

        it('should respond if unable to find chore', () => {
            const missingChoreName = 'missing chore name'
            const actions = messageHandler(
                {
                    text: `!info ${missingChoreName}`,
                    author: mockUser
                },
                mockDB // mockDB will respond with undefined when asked to getChoreByName
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} Unable to find chore "${missingChoreName}". ` +
                    'Try using the !info command to verify the spelling.'
            )
        })

        it('should describe a chore', () => {
            const actions = messageHandler(
                {
                    text: `!info ${mockGenericChore.name}`,
                    author: mockUser
                },
                mockDBWithChoreByName
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                describeChore(mockGenericChore)
            )
        })
    })

    describe('!opt-in command', () => {
        it('should allow a user to add themselves', () => {
            const actions = messageHandler(
                {
                    text: `!opt-in`,
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'AddUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mockUser.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} thank you for opting in to ChoresBot!!! ✨💚`
            )
        })
    })

    describe('!opt-out command', () => {
        it('should allow a user to remove themselves', () => {
            const actions = messageHandler(
                {
                    text: `!opt-out`,
                    author: mockUser
                },
                mockDB
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mockUser.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} successfully opted-out, you should no longer be assigned any chores`
            )
        })

        it('should unassign a user from any chores when they opt-out', () => {
            const actions = messageHandler(
                {
                    text: `!opt-out`,
                    author: mockUser
                },
                mockDBWithChoreAssigned
            )

            expect(actions).to.have.lengthOf(3)

            let action: Action = actions[0]

            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mockAssignedChore.name)
            expect(action.chore.assigned).to.be.false

            action = actions[1]

            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mockUser.id)

            action = actions[2]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `@${mockUser.name} successfully opted-out, you should no longer be assigned any chores`
            )
        })
    })
})

describe('Actions performed at an interval', () => {
    it('should prompt users to complete chores', () => {
        const actions = loop(mockDBWithOutstandingChores)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mockUser)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} please do the chore: "${mockOutstandingChore.name}"`
        )
    })

    it('should not prompt users when there are no outstanding chores', () => {
        const actions = loop(mockDBWithUpcoming) // some upcoming, but no outstanding

        expect(actions).to.have.lengthOf(0)
    })

    it('should not re-assign a chore to a user after they skip it', () => {
        let mockChore: Chore = {
            name: 'clean the dirt',
            assigned: mockUser,
            frequency: mockFrequency
        }

        const mockDBSameChoreAssignedAndOutstanding = Object.assign(
            {},
            mockDB,
            {
                getAssignableUsersInOrderOfRecentCompletion: () => {
                    return [mockUser]
                },

                getChoresAssignedToUser: () => {
                    return [mockChore]
                },

                getOutstandingUnassignedChores: () => {
                    return [mockChore]
                }
            }
        )

        let actions = messageHandler(
            {
                text: '!skip',
                author: mockUser
            },
            mockDBSameChoreAssignedAndOutstanding
        )

        expect(actions).to.have.lengthOf(2)

        // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.name).to.equal(mockChore.name)
        expect(action.chore.assigned).to.equal(false)

        mockChore = action.chore // re-assign so our mockDB "saves" any modifications

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `⏭ the chore "${mockChore.name}" has been successfully skipped`
        )

        actions = loop(mockDBSameChoreAssignedAndOutstanding)

        expect(actions).to.have.lengthOf(0)
    })

    it('should not assign multiple chores to the same user', () => {
        const mockChore1: Chore = {
            name: 'clean the dirt',
            assigned: false,
            frequency: mockFrequency
        }

        const mockChore2: Chore = {
            name: 'floss the steps',
            assigned: false,
            frequency: mockFrequency
        }

        const mockDBMultipleChoresAndMultipleUsers = Object.assign({}, mockDB, {
            getAssignableUsersInOrderOfRecentCompletion: () => {
                return [mockUser, mockUser2]
            },

            getOutstandingUnassignedChores: () => {
                return [mockChore1, mockChore2]
            }
        })

        const actions = loop(mockDBMultipleChoresAndMultipleUsers)

        expect(actions).to.have.lengthOf(4)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mockUser)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser.name} please do the chore: "${mockChore1.name}"`
        )

        action = actions[2]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mockUser2)

        action = actions[3]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `@${mockUser2.name} please do the chore: "${mockChore2.name}"`
        )
    })
})
