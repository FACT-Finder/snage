import React from 'react';
import {ApiParseError} from '../../shared/type';
import {Box, styled, Tooltip, tooltipClasses, TooltipProps, Typography} from '@mui/material';

export const ErrorTooltipBody = ({
    error: {index, expected, query},
}: {
    error: ApiParseError & {query: string};
}): React.ReactElement => (
    <>
        <Typography sx={{background: '#e74c3c', padding: '8px 14px', borderRadius: '4px 4px 0 0'}}>
            <b>Query Error</b>
        </Typography>
        <Typography component="div">
            <Box
                component="pre"
                sx={{padding: '6px 14px 0 14px', backgroundColor: 'rgb(245, 245, 245)', color: 'black', margin: 0}}
                dangerouslySetInnerHTML={{
                    __html: formatError(query, index.offset, {prefix: '<b>', suffix: '</b>'}),
                }}
            />
            <Box
                sx={{
                    padding: '8px 14px',
                    backgroundColor: 'rgb(235, 235, 235)',
                    fontSize: '0.9rem',
                    color: 'black',
                    borderRadius: '0 0 4px 4px',
                }}
            >
                expected {expected.join(', ')}
            </Box>
        </Typography>
    </>
);

export const ErrorTooltip = styled(({className, ...props}: TooltipProps) => (
    <Tooltip {...props} classes={{popper: className}} />
))(({theme}) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        boxShadow: theme.shadows[3],
        fontSize: 11,
        padding: 0,
        pointerEvents: 'all',
    },
}));

interface FormatOptions {
    prefix?: string;
    suffix?: string;
    maxRight?: number;
    maxLeft?: number;
}

export const formatError = (
    query: string,
    index: number,
    {maxLeft = 30, maxRight = 15, prefix = '', suffix = ''}: FormatOptions
): string => {
    const start = index > maxLeft ? index - maxLeft : 0;
    const end = index + maxRight > query.length ? query.length : index + maxRight;
    const paddingLeft = start === 0 ? index : maxLeft + 3;
    return `\
${start === 0 ? '' : '...'}${query.slice(start, end)}${end >= query.length ? '' : '...'}
${' '.repeat(paddingLeft)}${prefix}^${suffix}`;
};
