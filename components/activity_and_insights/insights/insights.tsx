// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {memo, useState, useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import {selectChannel} from 'mattermost-redux/actions/channels';

import {InsightsTimeFrames} from 'utils/constants';
import {localizeMessage} from 'utils/utils';

import InsightsHeader from './insights_header/insights_header';
import TopChannels from './top_channels/top_channels';

import './../activity_and_insights.scss';

export enum CardSizes {
    large = 'lg',
    medium = 'md',
    small = 'sm',
}
export type CardSize = CardSizes;

const Insights = () => {
    const dispatch = useDispatch();
    const [filterType, setFilterType] = useState('my');
    const [timeFrame, setTimeFrame] = useState({
        value: InsightsTimeFrames.INSIGHTS_7_DAYS,
        label: localizeMessage('insights.timeFrame.today', 'Today'),
    });

    const setFilterTypeTeam = useCallback(() => {
        setFilterType('team');
    }, []);

    const setFilterTypeMy = useCallback(() => {
        setFilterType('my');
    }, []);

    const setTimeFrameValue = useCallback((value) => {
        setTimeFrame(value);
    }, []);

    useEffect(() => {
        dispatch(selectChannel(''));
    }, []);

    return (
        <>
            <InsightsHeader
                filterType={filterType}
                setFilterTypeTeam={setFilterTypeTeam}
                setFilterTypeMy={setFilterTypeMy}
                timeFrame={timeFrame}
                setTimeFrame={setTimeFrameValue}
            />
            <div className='insights-body'>
                <TopChannels
                    size={CardSizes.large}
                />
                <TopChannels
                    size={CardSizes.small}
                />
                <TopChannels
                    size={CardSizes.small}
                />
                <TopChannels
                    size={CardSizes.small}
                />
                <TopChannels
                    size={CardSizes.medium}
                />
                <TopChannels
                    size={CardSizes.medium}
                />
            </div>
        </>
    );
};

export default memo(Insights);
