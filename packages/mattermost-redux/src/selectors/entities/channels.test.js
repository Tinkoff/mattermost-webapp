// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {General, Permissions} from 'mattermost-redux/constants';
import {CategoryTypes} from 'mattermost-redux/constants/channel_categories';

import mergeObjects from 'mattermost-redux/test/merge_objects';
import TestHelper from 'mattermost-redux/test/test_helper';

import {sortChannelsByDisplayName, getDirectChannelName} from 'mattermost-redux/utils/channel_utils';
import deepFreezeAndThrowOnMutation from 'mattermost-redux/utils/deep_freeze';

import * as Selectors from './channels';

const sortUsernames = (a, b) => a.localeCompare(b, General.DEFAULT_LOCALE, {numeric: true});

describe('Selectors.Channels.getChannelsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    it('should return channels in current team', () => {
        const user = TestHelper.fakeUserWithId();

        const profiles = {
            [user.id]: user,
        };

        const channel1 = TestHelper.fakeChannelWithId(team1.id);
        const channel2 = TestHelper.fakeChannelWithId(team2.id);
        const channel3 = TestHelper.fakeChannelWithId(team1.id);
        const channel4 = TestHelper.fakeChannelWithId('');

        const channels = {
            [channel1.id]: channel1,
            [channel2.id]: channel2,
            [channel3.id]: channel3,
            [channel4.id]: channel4,
        };

        const channelsInTeam = {
            [team1.id]: [channel1.id, channel3.id],
            [team2.id]: [channel2.id],
            '': [channel4.id],
        };

        const testState = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: user.id,
                    profiles,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const channelsInCurrentTeam = [channel1, channel3].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testState), channelsInCurrentTeam);
    });

    it('should order by user locale', () => {
        const userDe = {
            ...TestHelper.fakeUserWithId(),
            locale: 'de',
        };
        const userSv = {
            ...TestHelper.fakeUserWithId(),
            locale: 'sv',
        };

        const profilesDe = {
            [userDe.id]: userDe,
        };
        const profilesSv = {
            [userSv.id]: userSv,
        };

        const channel1 = {
            ...TestHelper.fakeChannelWithId(team1.id),
            display_name: 'z',
        };
        const channel2 = {
            ...TestHelper.fakeChannelWithId(team1.id),
            display_name: 'ä',
        };

        const channels = {
            [channel1.id]: channel1,
            [channel2.id]: channel2,
        };

        const channelsInTeam = {
            [team1.id]: [channel1.id, channel2.id],
        };

        const testStateDe = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userDe.id,
                    profiles: profilesDe,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const testStateSv = deepFreezeAndThrowOnMutation({
            entities: {
                users: {
                    currentUserId: userSv.id,
                    profiles: profilesSv,
                },
                teams: {
                    currentTeamId: team1.id,
                },
                channels: {
                    channels,
                    channelsInTeam,
                },
            },
        });

        const channelsInCurrentTeamDe = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, userDe.locale));
        const channelsInCurrentTeamSv = [channel1, channel2].sort(sortChannelsByDisplayName.bind(null, userSv.locale));

        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testStateDe), channelsInCurrentTeamDe);
        assert.deepEqual(Selectors.getChannelsInCurrentTeam(testStateSv), channelsInCurrentTeamSv);
    });
});

describe('Selectors.Channels.getMyChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        display_name: 'Channel Name',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.DM_CHANNEL,
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: [user.username, user2.username, user3.username].join(', '),
        type: General.GM_CHANNEL,
        name: '',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id],
        [team2.id]: [channel2.id],
        '': [channel4.id, channel5.id],
    };

    const myMembers = {
        [channel1.id]: {},
        [channel3.id]: {},
        [channel4.id]: {},
        [channel5.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel4.id]: new Set([user.id, user2.id]),
                    [channel5.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get my channels in current team and DMs', () => {
        const channelsInCurrentTeam = [channel1, channel3].sort(sortChannelsByDisplayName.bind(null, []));
        assert.deepEqual(Selectors.getMyChannels(testState), [
            ...channelsInCurrentTeam,
            {...channel4, display_name: user2.username, status: 'offline', teammate_id: user2.id},
            {...channel5, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
        ]);
    });
});

describe('Selectors.Channels.getMembersInCurrentChannel', () => {
    const channel1 = TestHelper.fakeChannelWithId('');

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const membersInChannel = {
        [channel1.id]: {
            [user.id]: {},
            [user2.id]: {},
            [user3.id]: {},
        },
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                membersInChannel,
            },
        },
    });

    it('should return members in current channel', () => {
        assert.deepEqual(Selectors.getMembersInCurrentChannel(testState), membersInChannel[channel1.id]);
    });
});

describe('Selectors.Channels.getOtherChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.PRIVATE_CHANNEL,
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.DM_CHANNEL,
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
        delete_at: 444,
    };
    const channel6 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        display_name: 'Channel Name',
        type: General.OPEN_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
        [channel6.id]: channel6,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel3.id, channel5.id, channel6.id],
        [team2.id]: [channel2.id],
        '': [channel4.id],
    };

    const myMembers = {
        [channel4.id]: {},
        [channel6.id]: {},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
            },
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
                myMembers,
            },
        },
    });

    it('get public channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState), [channel1, channel5].sort(sortChannelsByDisplayName.bind(null, [])));
    });

    it('get public, unarchived channels not member of', () => {
        assert.deepEqual(Selectors.getOtherChannels(testState, false), [channel1]);
    });
});

describe('getChannel', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.DM_CHANNEL,
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel2.id]: new Set([user.id, user2.id]),
                    [channel3.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            channels: {
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    test('should return channels directly from the store', () => {
        expect(Selectors.getChannel(testState, channel1.id)).toBe(channel1);
        expect(Selectors.getChannel(testState, channel2.id)).toBe(channel2);
        expect(Selectors.getChannel(testState, channel3.id)).toBe(channel3);
    });
});

describe('makeGetChannel', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.DM_CHANNEL,
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel2.id]: new Set([user.id, user2.id]),
                    [channel3.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            channels: {
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    test('should return non-DM/non-GM channels directly from the store', () => {
        const getChannel = Selectors.makeGetChannel();

        expect(getChannel(testState, {id: channel1.id})).toBe(channel1);
    });

    test('should return DMs with computed data added', () => {
        const getChannel = Selectors.makeGetChannel();

        expect(getChannel(testState, {id: channel2.id})).toEqual({
            ...channel2,
            display_name: user2.username,
            status: 'offline',
            teammate_id: user2.id,
        });
    });

    test('should return GMs with computed data added', () => {
        const getChannel = Selectors.makeGetChannel();

        expect(getChannel(testState, {id: channel3.id})).toEqual({
            ...channel3,
            display_name: [user2.username, user3.username].sort(sortUsernames).join(', '),
        });
    });
});

describe('Selectors.Channels.getChannelByName', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'ch3',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
            },
        },
    });
    it('get first channel that matches by name', () => {
        assert.deepEqual(Selectors.getChannelByName(testState, channel3.name), channel3);
    });

    it('return null if no channel matches by name', () => {
        assert.deepEqual(Selectors.getChannelByName(testState, 'noChannel'), null);
    });
});

describe('Selectors.Channels.getChannelsNameMapInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch3',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch4',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel4.id],
        [team2.id]: [channel2.id, channel3.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                channelsInTeam,
            },
        },
    });

    it('get channel map for current team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel4.name]: channel4,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInCurrentTeam(testState), channelMap);
    });

    describe('memoization', () => {
        it('should return memoized result with no changes', () => {
            const originalResult = Selectors.getChannelsNameMapInCurrentTeam(testState);

            expect(Selectors.getChannelsNameMapInCurrentTeam(testState)).toBe(originalResult);
        });

        it('should not return memoized result when channels on another team changes', () => {
            // This is a known issue with the current implementation of the selector. Ideally, it would return the
            // memoized result.
            const originalResult = Selectors.getChannelsNameMapInCurrentTeam(testState);

            const state = deepFreezeAndThrowOnMutation(mergeObjects(testState, {
                entities: {
                    channels: {
                        channels: {
                            [channel3.id]: {...channel3, display_name: 'Some other name'},
                        },
                    },
                },
            }));

            expect(Selectors.getChannelsNameMapInCurrentTeam(state)).not.toBe(originalResult);
        });

        it('should not return memozied result when a returned channel changes its display name', () => {
            const originalResult = Selectors.getChannelsNameMapInCurrentTeam(testState);

            const state = deepFreezeAndThrowOnMutation(mergeObjects(testState, {
                entities: {
                    channels: {
                        channels: {
                            [channel4.id]: {...channel4, display_name: 'Some other name'},
                        },
                    },
                },
            }));

            const result = Selectors.getChannelsNameMapInCurrentTeam(state);
            expect(result).not.toBe(originalResult);
            expect(result[channel4.name].display_name).toBe('Some other name');
        });

        it('should not return memozied result when a returned channel changes something else', () => {
            const originalResult = Selectors.getChannelsNameMapInCurrentTeam(testState);

            const state = deepFreezeAndThrowOnMutation(mergeObjects(testState, {
                entities: {
                    channels: {
                        channels: {
                            [channel4.id]: {...channel4, last_post_at: 10000},
                        },
                    },
                },
            }));

            const result = Selectors.getChannelsNameMapInCurrentTeam(state);
            expect(result).not.toBe(originalResult);
            expect(result[channel4.name].last_post_at).toBe(10000);
        });
    });
});

describe('Selectors.Channels.getChannelsNameMapInTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        name: 'Ch3',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: 'Ch4',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel4.id],
        [team2.id]: [channel2.id, channel3.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
                channelsInTeam,
            },
        },
    });
    it('get channel map for team', () => {
        const channelMap = {
            [channel1.name]: channel1,
            [channel4.name]: channel4,
        };
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, team1.id), channelMap);
    });
    it('get empty map for non-existing team', () => {
        assert.deepEqual(Selectors.getChannelsNameMapInTeam(testState, 'junk'), {});
    });
});

describe('Selectors.Channels.getChannelNameToDisplayNameMap', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        id: 'channel1',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        id: 'channel2',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        id: 'channel3',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(team2.id),
        id: 'channel4',
    };

    const baseState = {
        entities: {
            channels: {
                channels: {
                    channel1,
                    channel2,
                    channel3,
                    channel4,
                },
                channelsInTeam: {
                    [team1.id]: [channel1.id, channel2.id, channel3.id],
                    [team2.id]: [channel4.id],
                },
            },
            teams: {
                currentTeamId: team1.id,
            },
        },
    };

    test('should return a map of channel names to display names for the current team', () => {
        let state = baseState;

        expect(Selectors.getChannelNameToDisplayNameMap(state)).toEqual({
            [channel1.name]: channel1.display_name,
            [channel2.name]: channel2.display_name,
            [channel3.name]: channel3.display_name,
        });

        state = mergeObjects(baseState, {
            entities: {
                teams: {
                    currentTeamId: team2.id,
                },
            },
        });

        expect(Selectors.getChannelNameToDisplayNameMap(state)).toEqual({
            [channel4.name]: channel4.display_name,
        });
    });

    describe('memoization', () => {
        test('should return the same object when called twice with the same state', () => {
            const originalResult = Selectors.getChannelNameToDisplayNameMap(baseState);

            expect(Selectors.getChannelNameToDisplayNameMap(baseState)).toBe(originalResult);
        });

        test('should return the same object when a channel on another team changes', () => {
            const originalResult = Selectors.getChannelNameToDisplayNameMap(baseState);

            const state = mergeObjects(baseState, {
                entities: {
                    channels: {
                        channels: {
                            [channel4.id]: {
                                ...channel4,
                                display_name: 'something else entirely',
                            },
                        },
                    },
                },
            });

            expect(Selectors.getChannelNameToDisplayNameMap(state)).toBe(originalResult);
        });

        test('should return the same object when a channel receives a new post', () => {
            const originalResult = Selectors.getChannelNameToDisplayNameMap(baseState);

            const state = mergeObjects(baseState, {
                entities: {
                    channels: {
                        channels: {
                            [channel1.id]: {
                                ...channel1,
                                last_post_at: 1234,
                            },
                        },
                    },
                },
            });

            expect(Selectors.getChannelNameToDisplayNameMap(state)).toBe(originalResult);
        });

        test('should return a new object when a channel is renamed', () => {
            const originalResult = Selectors.getChannelNameToDisplayNameMap(baseState);

            const state = mergeObjects(baseState, {
                entities: {
                    channels: {
                        channels: {
                            [channel2.id]: {
                                ...channel2,
                                display_name: 'something else',
                            },
                        },
                    },
                },
            });

            const result = Selectors.getChannelNameToDisplayNameMap(state);
            expect(result).not.toBe(originalResult);
            expect(result).toEqual({
                [channel1.name]: channel1.display_name,
                [channel2.name]: 'something else',
                [channel3.name]: channel3.display_name,
            });
        });

        test('should return a new object when a new team is added', () => {
            const originalResult = Selectors.getChannelNameToDisplayNameMap(baseState);

            const newChannel = {
                ...TestHelper.fakeChannelWithId(team1.id),
                id: 'newChannel',
            };

            const state = mergeObjects(baseState, {
                entities: {
                    channels: {
                        channels: {
                            newChannel,
                        },
                        channelsInTeam: {
                            [team1.id]: [channel1.id, channel2.id, channel3.id, newChannel.id],
                        },
                    },
                },
            });

            const result = Selectors.getChannelNameToDisplayNameMap(state);
            expect(result).not.toBe(originalResult);
            expect(result).toEqual({
                ...originalResult,
                [newChannel.name]: newChannel.display_name,
            });
        });
    });
});

describe('Selectors.Channels.getGroupChannels', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const user = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user.id]: user,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
        display_name: 'Channel Name',
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
        display_name: [user.username, user3.username].join(', '),
        name: '',
    };
    const channel4 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.DM_CHANNEL,
        display_name: 'Channel Name',
        name: getDirectChannelName(user.id, user2.id),
    };
    const channel5 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
        display_name: [user.username, user2.username, user3.username].join(', '),
        name: '',
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
        [channel4.id]: channel4,
        [channel5.id]: channel5,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        '': [channel3.id, channel4.id, channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user.id,
                profiles,
                statuses: {},
                profilesInChannel: {
                    [channel3.id]: new Set([user.id, user3.id]),
                    [channel4.id]: new Set([user.id, user2.id]),
                    [channel5.id]: new Set([user.id, user2.id, user3.id]),
                },
            },
            channels: {
                channels,
                channelsInTeam,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get group channels', () => {
        assert.deepEqual(Selectors.getGroupChannels(testState), [
            {...channel3, display_name: [user3.username].sort(sortUsernames).join(', ')},
            {...channel5, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
        ]);
    });
});

describe('Selectors.Channels.getChannelIdsInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId(team2.id);
    const channel5 = TestHelper.fakeChannelWithId('');

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        [team2.id]: [channel3.id, channel4.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channelsInTeam,
            },
        },
    });

    it('get channel ids in current team strict equal', () => {
        const newChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            newChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsInCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsInCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should't have a direct channel
        assert.equal(fromModifiedState.includes(channel5.id), false, 'should not have direct channel on a team');
    });
});

describe('Selectors.Channels.getChannelIdsForCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team2.id);
    const channel4 = TestHelper.fakeChannelWithId(team2.id);
    const channel5 = TestHelper.fakeChannelWithId('');

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
        [team2.id]: [channel3.id, channel4.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel5.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channelsInTeam,
            },
        },
    });

    it('get channel ids for current team strict equal', () => {
        const anotherChannel = TestHelper.fakeChannelWithId(team2.id);
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channelsInTeam: {
                        ...testState.entities.channels.channelsInTeam,
                        [team2.id]: [
                            ...testState.entities.channels.channelsInTeam[team2.id],
                            anotherChannel.id,
                        ],
                    },
                },
            },
        };

        const fromOriginalState = Selectors.getChannelIdsForCurrentTeam(testState);
        const fromModifiedState = Selectors.getChannelIdsForCurrentTeam(modifiedState);

        assert.ok(fromOriginalState === fromModifiedState);

        // it should have a direct channel
        assert.ok(fromModifiedState.includes(channel5.id));
    });
});

describe('Selectors.Channels.isCurrentChannelMuted', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const myMembers = {
        [channel1.id]: {channel_id: channel1.id},
        [channel2.id]: {channel_id: channel2.id, notify_props: {mark_unread: 'mention'}},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                myMembers,
            },
        },
    });

    it('isCurrentChannelMuted', () => {
        assert.ok(Selectors.isCurrentChannelMuted(testState) === false);

        const newState = {
            entities: {
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };
        assert.ok(Selectors.isCurrentChannelMuted(newState) === true);
    });
});

describe('Selectors.Channels.isCurrentChannelArchived', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        delete_at: 1,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('isCurrentChannelArchived', () => {
        assert.ok(Selectors.isCurrentChannelArchived(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };

        assert.ok(Selectors.isCurrentChannelArchived(newState) === true);
    });
});

describe('Selectors.Channels.isCurrentChannelDefault', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        name: General.DEFAULT_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                currentChannelId: channel1.id,
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('isCurrentChannelDefault', () => {
        assert.ok(Selectors.isCurrentChannelDefault(testState) === false);

        const newState = {
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    currentChannelId: channel2.id,
                },
            },
        };

        assert.ok(Selectors.isCurrentChannelDefault(newState) === true);
    });
});

describe('Selectors.Channels.getChannelsWithUserProfiles', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = {
        ...TestHelper.fakeChannelWithId(''),
        type: General.GM_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id],
        // eslint-disable-next-line no-useless-computed-key
        ['']: [channel2.id],
    };

    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const profilesInChannel = {
        [channel1.id]: new Set([user1.id, user2.id]),
        [channel2.id]: new Set([user1.id, user2.id, user3.id]),
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            channels: {
                channels,
                channelsInTeam,
            },
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('getChannelsWithUserProfiles', () => {
        const channelWithUserProfiles = Selectors.getChannelsWithUserProfiles(testState);
        assert.equal(channelWithUserProfiles.length, 1);
        assert.equal(channelWithUserProfiles[0].profiles.length, 2);
    });
});

describe('Selectors.Channels.getRedirectChannelNameForTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const teams = {
        [team1.id]: team1,
        [team2.id]: team2,
    };

    const myTeamMembers = {
        [team1.id]: {},
        [team2.id]: {},
    };

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myChannelMembers = {
        [channel1.id]: {channel_id: channel1.id},
        [channel2.id]: {channel_id: channel2.id},
        [channel3.id]: {channel_id: channel3.id},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                teams,
                myMembers: myTeamMembers,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
            },
            users: {
                currentUserId: user1.id,
                profiles,
            },
            general: {},
        },
    });

    it('getRedirectChannelNameForTeam without advanced permissions', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                general: {
                    ...testState.entities.general,
                    serverVersion: '4.8.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team1.id,
                        },
                        [channel1.id]: {
                            id: channel1.id,
                            display_name: 'aaaaaa',
                            name: 'test-channel',
                            team_id: team1.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), 'test-channel');
    });

    it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        system_user: {permissions: ['join_public_channels']},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team1.id,
                        },
                        [channel1.id]: {
                            id: channel1.id,
                            display_name: 'Town Square',
                            name: 'town-square',
                            team_id: team1.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team1.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam without advanced permissions in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                general: {
                    ...testState.entities.general,
                    serverVersion: '4.8.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team2.id,
                        },
                        [channel3.id]: {
                            id: channel3.id,
                            display_name: 'aaaaaa',
                            name: 'test-channel',
                            team_id: team2.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), 'test-channel');
    });

    it('getRedirectChannelNameForTeam with advanced permissions and with JOIN_PUBLIC_CHANNELS permission in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        system_user: {permissions: ['join_public_channels']},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });

    it('getRedirectChannelNameForTeam with advanced permissions but without JOIN_PUBLIC_CHANNELS permission but being member of town-square in not current team', () => {
        const modifiedState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        'new-not-member-channel': {
                            id: 'new-not-member-channel',
                            display_name: '111111',
                            name: 'new-not-member-channel',
                            team_id: team2.id,
                        },
                        [channel3.id]: {
                            id: channel3.id,
                            display_name: 'Town Square',
                            name: 'town-square',
                            team_id: team2.id,
                        },
                    },
                },
                roles: {
                    roles: {
                        system_user: {permissions: []},
                    },
                },
                general: {
                    ...testState.entities.general,
                    serverVersion: '5.12.0',
                },
            },
        };
        assert.equal(Selectors.getRedirectChannelNameForTeam(modifiedState, team2.id), General.DEFAULT_CHANNEL);
    });
});

describe('Selectors.Channels.getDirectAndGroupChannels', () => {
    const user1 = TestHelper.fakeUserWithId();
    const user2 = TestHelper.fakeUserWithId();
    const user3 = TestHelper.fakeUserWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(''),
        display_name: [user1.username, user2.username, user3.username].join(', '),
        type: General.GM_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(''),
        name: getDirectChannelName(user1.id, user2.id),
        type: General.DM_CHANNEL,
    };
    const channel3 = {
        ...TestHelper.fakeChannelWithId(''),
        name: getDirectChannelName(user1.id, user3.id),
        type: General.DM_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const profiles = {
        [user1.id]: user1,
        [user2.id]: user2,
        [user3.id]: user3,
    };

    const profilesInChannel = {
        [channel1.id]: new Set([user1.id, user2.id, user3.id]),
        [channel2.id]: new Set([user1.id, user2.id]),
        [channel3.id]: new Set([user1.id, user3.id]),
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            users: {
                currentUserId: user1.id,
                profiles,
                profilesInChannel,
            },
            channels: {
                channels,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('will return no channels if there is no active user', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    currentUserId: null,
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), []);
    });

    it('will return only direct and group message channels', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), [
            {...channel1, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
            {...channel2, display_name: user2.username},
            {...channel3, display_name: user3.username},
        ]);
    });

    it('will not error out on undefined channels', () => {
        const state = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                },
                channels: {
                    ...testState.entities.channels,
                    channels: {
                        ...testState.entities.channels.channels,
                        ['undefined']: undefined, //eslint-disable-line no-useless-computed-key
                    },
                },
            },
        };

        assert.deepEqual(Selectors.getDirectAndGroupChannels(state), [
            {...channel1, display_name: [user2.username, user3.username].sort(sortUsernames).join(', ')},
            {...channel2, display_name: user2.username},
            {...channel3, display_name: user3.username},
        ]);
    });
});

describe('Selectors.Channels.canManageAnyChannelMembersInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.OPEN_CHANNEL,
    };
    const channel2 = {
        ...TestHelper.fakeChannelWithId(team1.id),
        type: General.PRIVATE_CHANNEL,
    };

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const user1 = TestHelper.fakeUserWithId();

    const profiles = {
        [user1.id]: user1,
    };

    const myChannelMembers = {
        [channel1.id]: {},
        [channel2.id]: {},
    };

    const channelRoles = {
        [channel1.id]: [],
        [channel2.id]: [],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            channels: {
                channels,
                myMembers: myChannelMembers,
                roles: channelRoles,
            },
            users: {
                profiles,
                currentUserId: user1.id,
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('will return false if channel_user does not have permissions to manage channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: [],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                    roles: {
                        [channel1.id]: [
                            'channel_user',
                        ],
                        [channel2.id]: [
                            'channel_user',
                        ],
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
    });

    it('will return true if channel_user has permissions to manage public channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                    roles: {
                        [channel1.id]: [
                            'channel_user',
                        ],
                        [channel2.id]: [
                            'channel_user',
                        ],
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return true if channel_user has permissions to manage private channel members', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_user: {
                            permissions: ['manage_private_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                    roles: {
                        [channel1.id]: [
                            'channel_user',
                        ],
                        [channel2.id]: [
                            'channel_user',
                        ],
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return false if channel admins have permissions, but the user is not a channel admin of any channel', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                    roles: {
                        [channel1.id]: [
                            'channel_user',
                        ],
                        [channel2.id]: [
                            'channel_user',
                        ],
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === false);
    });

    it('will return true if channel admins have permission, and the user is a channel admin of some channel', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        channel_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                channels: {
                    ...testState.entities.channels,
                    myMembers: {
                        ...testState.entities.channels.myMembers,
                        [channel1.id]: {
                            ...testState.entities.channels.myMembers[channel1.id],
                            roles: 'channel_user channel_admin',
                        },
                        [channel2.id]: {
                            ...testState.entities.channels.myMembers[channel2.id],
                            roles: 'channel_user',
                        },
                    },
                    roles: {
                        [channel1.id]: [
                            'channel_user',
                            'channel_admin',
                        ],
                        [channel2.id]: [
                            'channel_user',
                        ],
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });

    it('will return true if team admins have permission, and the user is a team admin', () => {
        const newState = {
            entities: {
                ...testState.entities,
                roles: {
                    roles: {
                        team_admin: {
                            permissions: ['manage_public_channel_members'],
                        },
                    },
                },
                users: {
                    ...testState.entities.users,
                    profiles: {
                        ...testState.entities.users.profiles,
                        [user1.id]: {
                            ...testState.entities.users.profiles[user1.id],
                            roles: 'team_admin',
                        },
                    },
                },
            },
        };

        assert.ok(Selectors.canManageAnyChannelMembersInCurrentTeam(newState) === true);
    });
});

describe('Selectors.Channels.getUnreadStatusInCurrentTeam', () => {
    const team1 = TestHelper.fakeTeamWithId();

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);
    const channel3 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
        [channel3.id]: channel3,
    };

    const myChannelMembers = {
        [channel1.id]: {notify_props: {}, mention_count: 1, msg_count: 0},
        [channel2.id]: {notify_props: {}, mention_count: 4, msg_count: 0},
        [channel3.id]: {notify_props: {}, mention_count: 4, msg_count: 5},
    };

    const channelsInTeam = {
        [team1.id]: [channel1.id, channel2.id],
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            teams: {
                currentTeamId: team1.id,
            },
            threads: {
                counts: {},
            },
            channels: {
                currentChannelId: channel1.id,
                channels,
                channelsInTeam,
                messageCounts: {
                    [channel1.id]: {total: 2},
                    [channel2.id]: {total: 8},
                    [channel3.id]: {total: 5},
                },
                myMembers: myChannelMembers,
            },
            users: {
                profiles: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {
                config: {},
            },
        },
    });

    it('get unreads for current team', () => {
        expect(Selectors.getUnreadStatusInCurrentTeam(testState)).toEqual(4);
    });

    it('get unreads for current read channel', () => {
        const testState2 = {...testState,
            entities: {...testState.entities,
                channels: {...testState.entities.channels,
                    currentChannelId: channel3.id,
                },
            },
        };
        expect(Selectors.countCurrentChannelUnreadMessages(testState2)).toEqual(0);
    });

    it('get unreads for current unread channel', () => {
        expect(Selectors.countCurrentChannelUnreadMessages(testState)).toEqual(2);
    });

    it('get unreads for channel not on members', () => {
        const testState2 = {...testState,
            entities: {...testState.entities,
                channels: {...testState.entities.channels,
                    currentChannelId: 'some_other_id',
                },
            },
        };
        expect(Selectors.countCurrentChannelUnreadMessages(testState2)).toEqual(0);
    });

    it('get unreads with a missing profile entity', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
        };
        Reflect.deleteProperty(newProfiles, 'fakeUserId');
        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };

        expect(Selectors.getUnreadStatusInCurrentTeam(newState)).toEqual(4);
    });

    it('get unreads with a deactivated user', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
            fakeUserId: {
                ...testState.entities.users.profiles.fakeUserId,
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };
        expect(Selectors.getUnreadStatusInCurrentTeam(newState)).toEqual(4);
    });

    it('get unreads with a deactivated channel', () => {
        const newChannels = {
            ...testState.entities.channels.channels,
            [channel2.id]: {
                ...testState.entities.channels.channels[channel2.id],
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: newChannels,
                },
            },
        };

        expect(Selectors.getUnreadStatusInCurrentTeam(newState)).toEqual(false);
    });
});

describe('Selectors.Channels.getUnreadStatus', () => {
    const team1 = TestHelper.fakeTeamWithId();
    const team2 = TestHelper.fakeTeamWithId();

    const teams = {
        [team1.id]: team1,
        [team2.id]: team2,
    };

    const myTeamMembers = {
        [team1.id]: {mention_count: 16, msg_count: 32},
        [team2.id]: {mention_count: 64, msg_count: 128},
    };

    const channel1 = TestHelper.fakeChannelWithId(team1.id);
    const channel2 = TestHelper.fakeChannelWithId(team1.id);

    const channels = {
        [channel1.id]: channel1,
        [channel2.id]: channel2,
    };

    const myChannelMembers = {
        [channel1.id]: {notify_props: {}, mention_count: 1, msg_count: 0},
        [channel2.id]: {notify_props: {}, mention_count: 4, msg_count: 0},
    };

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            threads: {
                counts: {},
            },
            preferences: {
                myPreferences: {},
            },
            general: {config: {}},
            teams: {
                currentTeamId: team1.id,
                teams,
                myMembers: myTeamMembers,
            },
            channels: {
                channels,
                messageCounts: {
                    [channel1.id]: {total: 2},
                    [channel2.id]: {total: 8},
                },
                myMembers: myChannelMembers,
            },
            users: {
                profiles: {},
            },
        },
    });

    it('get unreads', () => {
        expect(Selectors.getUnreadStatus(testState)).toBe(69);
    });

    it('get unreads with a missing profile entity', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
        };
        Reflect.deleteProperty(newProfiles, 'fakeUserId');
        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };

        expect(Selectors.getUnreadStatus(newState)).toBe(69);
    });

    it('get unreads with a deactivated user', () => {
        const newProfiles = {
            ...testState.entities.users.profiles,
            fakeUserId: {
                ...testState.entities.users.profiles.fakeUserId,
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                users: {
                    ...testState.entities.users,
                    profiles: newProfiles,
                },
            },
        };
        expect(Selectors.getUnreadStatus(newState)).toBe(69);
    });

    it('get unreads with a deactivated channel', () => {
        const newChannels = {
            ...testState.entities.channels.channels,
            [channel2.id]: {
                ...testState.entities.channels.channels[channel2.id],
                delete_at: 100,
            },
        };

        const newState = {
            ...testState,
            entities: {
                ...testState.entities,
                channels: {
                    ...testState.entities.channels,
                    channels: newChannels,
                },
            },
        };

        expect(Selectors.getUnreadStatus(newState)).toBe(65);
    });
});

describe('Selectors.Channels.getUnreadStatus', () => {
    const team1 = {id: 'team1', delete_at: 0};
    const team2 = {id: 'team2', delete_at: 0};

    const channelA = {id: 'channelA', name: 'channelA', team_id: 'team1', delete_at: 0};
    const channelB = {id: 'channelB', name: 'channelB', team_id: 'team1', delete_at: 0};
    const channelC = {id: 'channelB', name: 'channelB', team_id: 'team2', delete_at: 0};

    const dmChannel = {id: 'dmChannel', name: 'user1__user2', team_id: '', delete_at: 0, type: General.DM_CHANNEL};
    const gmChannel = {id: 'gmChannel', name: 'gmChannel', team_id: 'team1', delete_at: 0, type: General.GM_CHANNEL};

    test('should return the correct number of messages and mentions from channels on the current team', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};
        const myMemberB = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                threads: {
                    counts: {},
                },
                preferences: {
                    myPreferences: {},
                },
                general: {config: {}},
                channels: {
                    channels: {
                        channelA,
                        channelB,
                    },
                    messageCounts: {
                        channelA: {total: 11},
                        channelB: {total: 13},
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelB: myMemberB,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);
        const unreadMeta = Selectors.basicUnreadMeta(unreadStatus);

        expect(unreadMeta.isUnread).toBe(true); // channelA and channelB are unread
        expect(unreadMeta.unreadMentionCount).toBe(myMemberA.mention_count + myMemberB.mention_count);
    });

    test('should not count messages from channel with mark_unread set to "mention"', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'mention'}};
        const myMemberB = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                threads: {
                    counts: {},
                },
                preferences: {
                    myPreferences: {},
                },
                general: {config: {}},
                channels: {
                    channels: {
                        channelA,
                        channelB,
                    },
                    messageCounts: {
                        channelA: {total: 11},
                        channelB: {total: 13},
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelB: myMemberB,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);
        const unreadMeta = Selectors.basicUnreadMeta(unreadStatus);

        expect(unreadMeta.isUnread).toBe(true); // channelA and channelB are unread, but only channelB is counted because of its mark_unread
        expect(unreadStatus).toBe(myMemberA.mention_count + myMemberB.mention_count);
    });

    test('should count mentions from DM channels', () => {
        const dmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                threads: {
                    counts: {},
                },
                preferences: {
                    myPreferences: {},
                },
                general: {config: {}},
                channels: {
                    channels: {
                        dmChannel,
                    },
                    messageCounts: {
                        dmChannel: {total: 11},
                    },
                    myMembers: {
                        dmChannel: dmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {
                        user2: {delete_at: 0},
                    },
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);
        const unreadMeta = Selectors.basicUnreadMeta(unreadStatus);

        expect(unreadMeta.isUnread).toBe(true); // dmChannel is unread
        expect(unreadMeta.unreadMentionCount).toBe(dmMember.mention_count);
    });

    test('should not count mentions from DM channel with archived user', () => {
        const dmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                threads: {
                    counts: {},
                },
                preferences: {
                    myPreferences: {},
                },
                general: {config: {}},
                channels: {
                    channels: {
                        dmChannel,
                    },
                    messageCounts: {
                        dmChannel: {total: 11},
                    },
                    myMembers: {
                        dmChannel: dmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {
                        user2: {delete_at: 1},
                    },
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);

        expect(unreadStatus).toBe(false);
    });

    test('should count mentions from GM channels', () => {
        const gmMember = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};

        const state = {
            entities: {
                threads: {
                    counts: {},
                },
                general: {config: {}},
                preferences: {
                    myPreferences: {},
                },
                channels: {
                    channels: {
                        gmChannel,
                    },
                    messageCounts: {
                        gmChannel: {total: 11},
                    },
                    myMembers: {
                        gmChannel: gmMember,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {},
                    teams: {
                        team1,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);
        const unreadMeta = Selectors.basicUnreadMeta(unreadStatus);

        expect(unreadMeta.isUnread).toBe(true); // gmChannel is unread
        expect(unreadMeta.unreadMentionCount).toBe(gmMember.mention_count);
    });

    test('should count mentions and messages for other teams from team members', () => {
        const myMemberA = {mention_count: 2, msg_count: 3, notify_props: {mark_unread: 'all'}};
        const myMemberC = {mention_count: 5, msg_count: 7, notify_props: {mark_unread: 'all'}};

        const teamMember1 = {msg_count: 1, mention_count: 2};
        const teamMember2 = {msg_count: 3, mention_count: 6};

        const state = {
            entities: {
                general: {config: {}},
                preferences: {
                    myPreferences: {},
                },
                threads: {
                    counts: {},
                },
                channels: {
                    channels: {
                        channelA,
                        channelC,
                    },
                    messageCounts: {
                        channelA: {total: 11},
                        channelC: {total: 17},
                    },
                    myMembers: {
                        channelA: myMemberA,
                        channelC: myMemberC,
                    },
                },
                teams: {
                    currentTeamId: 'team1',
                    myMembers: {
                        team1: teamMember1,
                        team2: teamMember2,
                    },
                    teams: {
                        team1,
                        team2,
                    },
                },
                users: {
                    currentUserId: 'user1',
                    profiles: {},
                },
            },
        };

        const unreadStatus = Selectors.getUnreadStatus(state);
        const unreadMeta = Selectors.basicUnreadMeta(unreadStatus);

        expect(unreadMeta.isUnread).toBe(true); // channelA and channelC are unread
        expect(unreadMeta.unreadMentionCount).toBe(myMemberA.mention_count + teamMember2.mention_count);
    });
});

describe('Selectors.Channels.getMyFirstChannelForTeams', () => {
    test('should return the first channel in each team', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                        channelC: {id: 'channelC', name: 'channelC', team_id: 'team1'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                        channelC: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                        team2: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                        team2: {id: 'team2', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
            team2: state.entities.channels.channels.channelB,
        });
    });

    test('should only return channels that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team1'},
                    },
                    myMembers: {
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelB,
        });
    });

    test('should only return teams that the current user is a member of', () => {
        const state = {
            entities: {
                channels: {
                    channels: {
                        channelA: {id: 'channelA', name: 'channelA', team_id: 'team1'},
                        channelB: {id: 'channelB', name: 'channelB', team_id: 'team2'},
                    },
                    myMembers: {
                        channelA: {},
                        channelB: {},
                    },
                },
                teams: {
                    myMembers: {
                        team1: {},
                    },
                    teams: {
                        team1: {id: 'team1', delete_at: 0},
                        team2: {id: 'team2', delete_at: 0},
                    },
                },
                users: {
                    currentUserId: 'user',
                    profiles: {
                        user: {},
                    },
                },
            },
        };

        expect(Selectors.getMyFirstChannelForTeams(state)).toEqual({
            team1: state.entities.channels.channels.channelA,
        });
    });
});

test('Selectors.Channels.isManuallyUnread', () => {
    const state = {
        entities: {
            channels: {
                manuallyUnread: {
                    channel1: true,
                    channel2: false,
                },
            },
        },
    };

    assert.equal(Selectors.isManuallyUnread(state, 'channel1'), true);
    assert.equal(Selectors.isManuallyUnread(state, undefined), false);
    assert.equal(Selectors.isManuallyUnread(state, 'channel2'), false);
    assert.equal(Selectors.isManuallyUnread(state, 'channel3'), false);
});

test('Selectors.Channels.getChannelModerations', () => {
    const moderations = [{
        name: Permissions.CHANNEL_MODERATED_PERMISSIONS.CREATE_POST,
        roles: {
            members: true,
        },
    }];

    const state = {
        entities: {
            channels: {
                channelModerations: {
                    channel1: moderations,
                },
            },
        },
    };

    assert.equal(Selectors.getChannelModerations(state, 'channel1'), moderations);
    assert.equal(Selectors.getChannelModerations(state, undefined), undefined);
    assert.equal(Selectors.getChannelModerations(state, 'undefined'), undefined);
});

test('Selectors.Channels.getChannelMemberCountsByGroup', () => {
    const memberCounts = {
        'group-1': {
            group_id: 'group-1',
            channel_member_count: 1,
            channel_member_timezones_count: 1,
        },
        'group-2': {
            group_id: 'group-2',
            channel_member_count: 999,
            channel_member_timezones_count: 131,
        },
    };

    const state = {
        entities: {
            channels: {
                channelMemberCountsByGroup: {
                    channel1: memberCounts,
                },
            },
        },
    };

    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, 'channel1'), memberCounts);
    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, undefined), {});
    assert.deepEqual(Selectors.getChannelMemberCountsByGroup(state, 'undefined'), {});
});

describe('isFavoriteChannel', () => {
    test('should use channel categories to determine favorites', () => {
        const currentTeamId = 'currentTeamId';
        const channel = {id: 'channel'};

        const favoritesCategory = {
            id: 'favoritesCategory',
            team_id: currentTeamId,
            type: CategoryTypes.FAVORITES,
            channel_ids: [],
        };

        let state = {
            entities: {
                channels: {
                    channels: {
                        channel,
                    },
                },
                channelCategories: {
                    byId: {
                        favoritesCategory,
                    },
                    orderByTeam: {
                        [currentTeamId]: [favoritesCategory.id],
                    },
                },
                preferences: {
                    myPreferences: {},
                },
                teams: {
                    currentTeamId,
                },
                general: {
                    config: {},
                },
            },
        };

        expect(Selectors.isFavoriteChannel(state, channel.id)).toBe(false);

        state = mergeObjects(state, {
            entities: {
                channelCategories: {
                    byId: {
                        [favoritesCategory.id]: {
                            ...favoritesCategory,
                            channel_ids: [channel.id],
                        },
                    },
                },
            },
        });

        expect(Selectors.isFavoriteChannel(state, channel.id)).toBe(true);
    });
});
