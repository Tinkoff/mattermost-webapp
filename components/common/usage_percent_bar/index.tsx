// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

// components/channel_info_rhs/components/editable_area.tsx
import styled from 'styled-components';

type Thresholds = {
    ok: number;
    warn: number;
    danger: number;
    exceeded: number;
}

type Props = {
    percent: number;
    thresholds?: Thresholds;
    barWidth?: number;
}

const defaultThresholds = {
    ok: 0,
    warn: 40,
    danger: 80,
    exceeded: 100.0000001,
};

type BarBackgroundProps = {
    width: number;
    thresholds: Thresholds;
    percent: number;
}

const BarBackground = styled.div<BarBackgroundProps>`
    height: ${(props) => Math.ceil(props.width / 20)}px;
    width: ${(props) => props.width}px;
    background: ${(props) => (
        isExceeded(props.percent, props.thresholds) ?
            'var(--dnd-indicator)' :
            `rgba(var(--center-channel-text-rgb), ${0.16 * 0.6})`
    )};
    border-radius: 8px;
    position: relative;
`;

type BarForegroundProps = {
    width: number;
    percent: number;
    thresholds: Thresholds;
}

function getColor(percent: number, thresholds: Thresholds): string {
    if (percent >= thresholds.ok && percent < thresholds.warn) {
        return 'var(--online-indicator)';
    } else if (percent >= thresholds.warn && percent < thresholds.danger) {
        return 'var(--away-indicator)';
    } else if (percent >= thresholds.danger && percent < thresholds.exceeded) {
        return 'var(--dnd-indicator)';
    } else if (percent >= thresholds.exceeded) {
        return 'var(--away-indicator)';
    }
    return '';
}

// TODO: check if is exceeded, and if show, calculate foreground's background color as a gradient
function isExceeded(percent: number, thresholds: Thresholds): boolean {
    return percent >= thresholds.exceeded;
}

const BarForeground = styled.div<BarForegroundProps>`
    height: ${(props) => Math.ceil(props.width / 20)}px;
    width: ${(props) => (
        isExceeded(props.percent, props.thresholds)
            ?  Math.floor(0.91 * props.width)
            : Math.min(props.width, Math.floor(props.width * (props.percent / 100)))
    )}px;
    border-radius: 8px;
    background-color: ${(props) => getColor(props.percent, props.thresholds)};
    transition: background-color 0.4s ease, width 0.4s ease;
    position: absolute;
`;

const UsagePercentBar = (props: Props) => {
    const thresholds = props.thresholds || defaultThresholds;
    const percent = Math.max(0, props.percent);
    const barWidth = props.barWidth || 155;
    return (
        <BarBackground
            width={barWidth}
            thresholds={thresholds}
            percent={percent}
        >
            <BarForeground
                width={barWidth}
                thresholds={thresholds}
                percent={percent}
            />
        </BarBackground>
    );
};

export default UsagePercentBar;

