import { describe } from 'mocha'
import { expect } from 'chai'

import { loop, messageHandler } from './main'
import { Action } from '../models/actions'
import { Chore } from '../models/chores'
import { hourInMilliseconds } from '../models/time'
import {
    AddCommand,
    AllCommands,
    CompleteCommand,
    DeleteCommand,
    HelpCommand,
    InfoCommand,
    RequestCommand,
    SkipCommand,
    defaultCallsign
} from './commands'

import { tagUser, inlineCode } from '../external/chat'
import * as mock from '../utility/mocks'
import * as routes from '../routes'
import { didYouMeanMessage } from './actions'

// --- Tests ---
describe('Message handling logic', async () => {
    it('should parse messages and determine actions', async () => {
        const actions = await messageHandler(
            {
                text: 'test',
                author: {
                    name: '',
                    id: ''
                }
            },
            mock.emptyDB,
            mock.config
        )

        expect(actions).is.not.undefined
        expect(actions).to.have.lengthOf(0)
    })

    describe('ping command', () => {
        it('should reply to "ping" with "pong"', async () => {
            const actions = await messageHandler(
                {
                    text: 'ping',
                    author: {
                        name: '',
                        id: ''
                    }
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal('pong')
        })

        it('should reply to the alias "!ping" with "pong"', async () => {
            const actions = await messageHandler(
                {
                    text: '!ping',
                    author: {
                        name: '',
                        id: ''
                    }
                },
                mock.emptyDB,
                mock.config
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
        it('should provide the closest upcoming chore when requested', async () => {
            const actions = await messageHandler(
                {
                    text: '!request',
                    author: mock.user1
                },
                mock.DBWithUpcoming,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.upcomingChore.name)
            expect(action.chore.assigned).to.equal(mock.user1)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `📋 ${tagUser(mock.user1)} please do the chore: "${
                    mock.upcomingChore.name
                }"`
            )
        })

        it('should respond when a chore is requested but the user is already assigned to a chore', async () => {
            const actions = await messageHandler(
                {
                    text: '!request',
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(mock.user1)} you are already assigned the chore "${
                    mock.assignedChore.name
                }". ` +
                    `If you would like to skip you can use the ${inlineCode(
                        defaultCallsign(SkipCommand)
                    )} command`
            )
        })

        it('should respond when there are no upcoming chores when requested', async () => {
            const actions = await messageHandler(
                {
                    text: '!request',
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will always respond with empty lists by default
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✨ ${tagUser(mock.user1)} there are no upcoming chores ✨`
            )
        })

        it('should respond when all upcoming chores have been skipped when requested', async () => {
            const mockDBUpcomingChoreAlreadySkipped = Object.assign(
                {},
                mock.emptyDB,
                {
                    getAssignableUsersInOrderOfRecentCompletion: () => {
                        return [mock.user1]
                    },

                    getUpcomingUnassignedChores: () => {
                        return [mock.skippedChore]
                    }
                }
            )

            const actions = await messageHandler(
                {
                    text: '!request',
                    author: mock.user1
                },
                mockDBUpcomingChoreAlreadySkipped,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} unable to find you a suitable new chore. ` +
                    `This might happen if all available chores have been skipped`
            )
        })
    })

    describe('!skip command', () => {
        it('should allow chores to be skipped by the assigned user', async () => {
            const actions = await messageHandler(
                {
                    text: '!skip',
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.assignedChore.name)
            expect(action.chore.assigned).to.equal(false)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `⏭ the chore "${mock.assignedChore.name}" has been successfully skipped`
            )
        })

        it('should respond when there are no chores assigned to be skipped', async () => {
            const actions = await messageHandler(
                {
                    text: '!skip',
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will always respond with empty lists by default
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} you have no chores currently assigned. ` +
                    `If you would like to request a new chore you can use the ${inlineCode(
                        defaultCallsign(RequestCommand)
                    )} command`
            )
        })
    })

    describe('!complete command', () => {
        it('should respond when a chore has been completed', async () => {
            const actions = await messageHandler(
                {
                    text: '!complete',
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.assignedChore.name)
            expect(action.chore.assigned).to.equal(false)
            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✅ the chore "${mock.assignedChore.name}" has been successfully completed`
            )
        })

        it('should respond to alias "!completed"', async () => {
            const actions = await messageHandler(
                {
                    text: '!completed',
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.assignedChore.name)
            expect(action.chore.assigned).to.equal(false)
            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✅ the chore "${mock.assignedChore.name}" has been successfully completed`
            )
        })

        it('should respond when there are no chores assigned to be completed', async () => {
            const actions = await messageHandler(
                {
                    text: '!complete',
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will always respond with empty lists by default
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} you have no chores currently assigned. ` +
                    `If you would like to request a new chore you can use the ${inlineCode(
                        defaultCallsign(RequestCommand)
                    )} command`
            )
        })

        it('should allow completing a chore by name', async () => {
            // Note: the chore isn't assigned to the user

            const actions = await messageHandler(
                {
                    text: `!complete ${mock.genericChore.name}`,
                    author: mock.user1
                },
                mock.DBWithChoreByName,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            let action: Action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.genericChore.name)
            expect(action.chore.assigned).to.equal(false)
            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `✅ the chore "${mock.genericChore.name}" has been successfully completed`
            )
        })

        it('should respond when unable to find chore to be completed', async () => {
            const missingChoreName = 'missing chore name'
            const actions = await messageHandler(
                {
                    text: `!complete ${missingChoreName}`,
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will always be unable to find a chore
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action).to.deep.equal(
                didYouMeanMessage(
                    missingChoreName,
                    undefined,
                    CompleteCommand,
                    mock.user1
                )
            )
        })

        it('should clear the skipped data for a chore on completion', async () => {
            let actions = await messageHandler(
                {
                    text: '!skip',
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.assignedChore.name)
            expect(action.chore.assigned).to.equal(false)

            const modifiedChore = action.chore

            const mockDBWithModifiedChore = Object.assign({}, mock.emptyDB, {
                getChoreByName: (choreName: string) => {
                    expect(choreName).to.equal(modifiedChore.name)
                    return modifiedChore
                }
            })

            actions = await messageHandler(
                {
                    text: `!complete ${modifiedChore.name}`,
                    author: mock.user1
                },
                mockDBWithModifiedChore,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            action = actions[0]

            if (action.kind !== 'CompleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(modifiedChore.name)
            expect(action.chore.assigned).to.equal(false)
            expect(action.user.id).to.equal(mock.user1.id)
            expect(action.chore.skippedBy).to.be.undefined
        })
    })

    describe('!add command', () => {
        it('should offer help text if sent with one or zero arguments', async () => {
            // 0 args
            let actions = await messageHandler(
                {
                    text: '!add',
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            let action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)

            // 1 args
            actions = await messageHandler(
                {
                    text: '!add test',
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)
        })

        it('should offer help text if sent without frequency', async () => {
            const actions = await messageHandler(
                {
                    text: '!add many "args" but no frequency',
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(AddCommand.helpText)
        })

        it('should add a command with frequency if supplied', async () => {
            const mockChoreName = 'water the tiles'
            const mockChoreFrequency = 'Weekly @ wednesday'

            const actions = await messageHandler(
                {
                    text: `!add ${mockChoreName} ${mockChoreFrequency}`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
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
                `➕ ${tagUser(
                    mock.user1
                )} new chore '${mockChoreName}' successfully added with frequency 'Weekly @ Wednesday' ➕`
            )
        })
    })

    describe('!delete command', () => {
        it('should offer help text if sent with no arguments', async () => {
            const actions = await messageHandler(
                {
                    text: '!delete',
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(DeleteCommand.helpText)
        })

        it('should respond if unable to find chore', async () => {
            const missingChoreName = 'missing chore name'
            const actions = await messageHandler(
                {
                    text: `!delete ${missingChoreName}`,
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will always be unable to find a chore
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action).to.deep.equal(
                didYouMeanMessage(
                    missingChoreName,
                    undefined,
                    DeleteCommand,
                    mock.user1
                )
            )
        })

        it('should delete a chore', async () => {
            const actions = await messageHandler(
                {
                    text: `!delete ${mock.genericChore.name}`,
                    author: mock.user1
                },
                mock.DBWithChoreByName,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'DeleteChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.genericChore.name)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `➖ ${tagUser(mock.user1)} chore '${
                    mock.genericChore.name
                }' successfully deleted ➖`
            )
        })
    })

    describe('!list command', () => {
        it('should link users to the chores list page', async () => {
            const actions = await messageHandler(
                {
                    text: `!list`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.contain(
                `${mock.config.clientUrlRoot}${routes.choresListPage}`
            )
        })
    })

    describe('!info command', () => {
        it('should show assigned chore if given no arguments', async () => {
            let actions = await messageHandler(
                {
                    text: `!info`,
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will respond with undefined when asked to get assigned chores
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            let action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(mock.user1)} you have no chores assigned`
            )

            actions = await messageHandler(
                {
                    text: `!info`,
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.contain(mock.assignedChore.name)
        })

        it('should respond if unable to find chore', async () => {
            const missingChoreName = 'missing chore name'
            const actions = await messageHandler(
                {
                    text: `!info ${missingChoreName}`,
                    author: mock.user1
                },
                mock.emptyDB, // mock.emptyDB will respond with undefined when asked to getChoreByName
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action).to.deep.equal(
                didYouMeanMessage(
                    missingChoreName,
                    undefined,
                    InfoCommand,
                    mock.user1
                )
            )
        })

        it('should respond with suggestion if unable to find chore', async () => {
            const misspelledChoreName = mock.genericChore.name + 'a'
            const actions = await messageHandler(
                {
                    text: `!info ${misspelledChoreName}`,
                    author: mock.user1
                },
                mock.DBWithAllChoreNames,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action).to.deep.equal(
                didYouMeanMessage(
                    misspelledChoreName,
                    mock.genericChore.name,
                    InfoCommand,
                    mock.user1
                )
            )
        })

        it('should describe a chore', async () => {
            const actions = await messageHandler(
                {
                    text: `!info ${mock.genericChore.name}`,
                    author: mock.user1
                },
                mock.DBWithChoreByName,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }
        })
    })

    describe('!opt-in command', () => {
        it('should allow a user to add themselves', async () => {
            const actions = await messageHandler(
                {
                    text: `!opt-in`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'AddUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} thank you for opting in to ChoresBot!!! ✨💚`
            )
        })
    })

    describe('!opt-out command', () => {
        it('should allow a user to remove themselves', async () => {
            const actions = await messageHandler(
                {
                    text: `!opt-out`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(2)

            let action: Action = actions[0]

            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[1]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} successfully opted-out, you should no longer be assigned any chores 👋`
            )
        })

        it('should unassign a user from any chores when they opt-out', async () => {
            const actions = await messageHandler(
                {
                    text: `!opt-out`,
                    author: mock.user1
                },
                mock.DBWithChoreAssigned,
                mock.config
            )

            expect(actions).to.have.lengthOf(3)

            let action: Action = actions[0]

            // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
            if (action.kind !== 'ModifyChore') {
                throw 'Received Action of the wrong type'
            }

            expect(action.chore.name).to.equal(mock.assignedChore.name)
            expect(action.chore.assigned).to.be.false

            action = actions[1]

            if (action.kind !== 'DeleteUser') {
                throw 'Received Action of the wrong type'
            }

            expect(action.user.id).to.equal(mock.user1.id)

            action = actions[2]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.equal(
                `${tagUser(
                    mock.user1
                )} successfully opted-out, you should no longer be assigned any chores 👋`
            )
        })
    })

    describe('!help command', () => {
        it('should provide a summary of all commands if given no command name', async () => {
            const actions = await messageHandler(
                {
                    text: `!help`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            for (const command of AllCommands) {
                expect(action.message.text).to.contain(command.summary)
            }
        })

        it('should provide help text for a specific command', async () => {
            for (const command of AllCommands) {
                const actions = await messageHandler(
                    {
                        text: `!help ${defaultCallsign(command)}`,
                        author: mock.user1
                    },
                    mock.emptyDB,
                    mock.config
                )

                expect(actions).to.have.lengthOf(1)

                const action: Action = actions[0]

                if (action.kind !== 'SendMessage') {
                    throw 'Received Action of the wrong type'
                }

                if (command.helpText === undefined) {
                    expect(action.message.text).to.contain(command.summary)
                } else {
                    expect(action.message.text).to.contain(command.helpText)
                }
            }
        })

        it('should provide help text for closest matching command', async () => {
            const actions = await messageHandler(
                {
                    text: `!help hep`,
                    author: mock.user1
                },
                mock.emptyDB,
                mock.config
            )

            expect(actions).to.have.lengthOf(1)

            const action: Action = actions[0]

            if (action.kind !== 'SendMessage') {
                throw 'Received Action of the wrong type'
            }

            expect(action.message.text).to.contain(HelpCommand.helpText)
        })
    })
})

describe('Actions performed at an interval', () => {
    it('should prompt users to complete chores', async () => {
        const actions = await loop(mock.DBWithOutstandingChores, mock.config)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user1)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `📋 ${tagUser(mock.user1)} please do the chore: "${
                mock.overdueChore.name
            }"`
        )
    })

    it('should prompt user with least recent completion first ("round-robin")', async () => {
        const mockDB = Object.assign({}, mock.DBWithOutstandingChores, {
            getAssignableUsersInOrderOfRecentCompletion: () => {
                return [mock.user1, mock.user2]
            }
        })

        const actions = await loop(mockDB, mock.config)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user2)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `📋 ${tagUser(mock.user2)} please do the chore: "${
                mock.overdueChore.name
            }"`
        )
    })

    it('should only prompt users to complete chores between "morning" and "night" times', async () => {
        let actions = await loop(mock.DBWithOutstandingChores, mock.config)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user1)

        const now = new Date()
        const beforeNow = new Date(now.getTime() - hourInMilliseconds)
        const afterNow = new Date(now.getTime() + hourInMilliseconds)
        let config = Object.assign({}, mock.config, {
            morningTime: beforeNow,
            nightTime: afterNow
        })

        actions = await loop(mock.DBWithOutstandingChores, config)

        expect(actions).to.have.lengthOf(2)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user1)

        const furtherAfterNow = new Date(
            afterNow.getTime() + hourInMilliseconds
        )
        config = Object.assign({}, mock.config, {
            morningTime: afterNow,
            nightTime: furtherAfterNow
        })

        actions = await loop(mock.DBWithOutstandingChores, config)

        expect(actions).to.have.lengthOf(0)
    })

    it('should send a reminder, once, at the start of "night time"', async () => {
        const now = new Date()
        const beforeNow = new Date(now.getTime() - hourInMilliseconds)
        const afterNow = new Date(now.getTime() + hourInMilliseconds)

        // this mock DB needs to store a config value used to remember the last reminder time
        let configValue: string | null = null
        const mockDBWithAssignedAndDynamicConfig = Object.assign(
            {},
            mock.DBWithChoreAssigned,
            {
                getConfigValue: () => {
                    return configValue
                },
                setConfigValue: (key: string, value: string) => {
                    configValue = value
                }
            }
        )
        let config = Object.assign({}, mock.config, {
            morningTime: beforeNow,
            nightTime: afterNow
        })

        let actions = await loop(mockDBWithAssignedAndDynamicConfig, config)

        expect(actions).to.have.lengthOf(0)

        const furtherBeforeNow = new Date(
            beforeNow.getTime() - hourInMilliseconds
        )
        config = Object.assign({}, mock.config, {
            morningTime: furtherBeforeNow,
            nightTime: beforeNow
        })

        // now that it's been sent, check that it won't send again
        actions = await loop(mockDBWithAssignedAndDynamicConfig, config)

        expect(actions).to.have.lengthOf(1)

        const action = actions[0]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.contain(tagUser(mock.user1))

        config = Object.assign({}, mock.config, {
            morningTime: furtherBeforeNow,
            nightTime: beforeNow
        })

        actions = await loop(mockDBWithAssignedAndDynamicConfig, config)

        expect(actions).to.have.lengthOf(0)
    })

    it('should not send a reminder if there are no assigned chores', async () => {
        const now = new Date()
        const beforeNow = new Date(now.getTime() - hourInMilliseconds)
        const furtherBeforeNow = new Date(
            beforeNow.getTime() - hourInMilliseconds
        )
        const config = Object.assign({}, mock.config, {
            morningTime: furtherBeforeNow,
            nightTime: beforeNow
        })

        const actions = await loop(
            mock.emptyDB, // mock.emptyDB will always report that there are no assigned chores
            config
        )

        expect(actions).to.have.lengthOf(0)
    })

    it('should not prompt users when there are no outstanding chores', async () => {
        const actions = await loop(mock.DBWithUpcoming, mock.config) // some upcoming, but no outstanding

        expect(actions).to.have.lengthOf(0)
    })

    it('should not re-assign a chore to a user after they skip it', async () => {
        let mockChore: Chore = {
            name: 'clean the dirt',
            assigned: mock.user1,
            frequency: mock.once
        }

        const mockDBSameChoreAssignedAndOutstanding = Object.assign(
            {},
            mock.emptyDB,
            {
                getAssignableUsersInOrderOfRecentCompletion: () => {
                    return [mock.user1]
                },

                getChoresAssignedToUser: () => {
                    return [mockChore]
                },

                getOutstandingUnassignedChores: () => {
                    return [mockChore]
                }
            }
        )

        let actions = await messageHandler(
            {
                text: '!skip',
                author: mock.user1
            },
            mockDBSameChoreAssignedAndOutstanding,
            mock.config
        )

        expect(actions).to.have.lengthOf(2)

        // make sure modify chores are first so that if they fail we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.name).to.equal(mockChore.name)
        expect(action.chore.assigned).to.equal(false)

        mockChore = action.chore // re-assign so our mock.emptyDB "saves" any modifications

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `⏭ the chore "${mockChore.name}" has been successfully skipped`
        )

        actions = await loop(mockDBSameChoreAssignedAndOutstanding, mock.config)

        expect(actions).to.have.lengthOf(0)
    })

    it('should not assign multiple chores to the same user', async () => {
        const mockChore1: Chore = {
            name: 'clean the dirt',
            assigned: false,
            frequency: mock.once
        }

        const mockChore2: Chore = {
            name: 'floss the steps',
            assigned: false,
            frequency: mock.once
        }

        const mockDBMultipleChoresAndMultipleUsers = Object.assign(
            {},
            mock.emptyDB,
            {
                getAssignableUsersInOrderOfRecentCompletion: () => {
                    return [mock.user1, mock.user2]
                },

                getOutstandingUnassignedChores: () => {
                    return [mockChore1, mockChore2]
                }
            }
        )

        const actions = await loop(
            mockDBMultipleChoresAndMultipleUsers,
            mock.config
        )

        expect(actions).to.have.lengthOf(4)

        // make sure modify chore is first so that if it fails we're not alerting the user unnecessarily
        let action: Action = actions[0]

        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user2)

        action = actions[1]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `📋 ${tagUser(mock.user2)} please do the chore: "${
                mockChore1.name
            }"`
        )

        action = actions[2]

        // make sure modify/complete chores are first so that if they fail we're not alerting the user unnecessarily
        if (action.kind !== 'ModifyChore') {
            throw 'Received Action of the wrong type'
        }

        expect(action.chore.assigned).to.equal(mock.user1)

        action = actions[3]

        if (action.kind !== 'SendMessage') {
            throw 'Received Action of the wrong type'
        }

        expect(action.message.text).to.equal(
            `📋 ${tagUser(mock.user1)} please do the chore: "${
                mockChore2.name
            }"`
        )
    })
})
