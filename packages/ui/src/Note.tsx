import React from 'react';
import {ApiNote} from '../../shared/type';
import {Markdown} from './Markdown';
import Chip from '@material-ui/core/Chip';
import {Link, Paper, Typography} from '@material-ui/core';
import {NavigateNote} from './state';

type ChipClick = (key: string, value: string | string[]) => (e: React.MouseEvent) => void;

export const FullNote: React.FC<{
    note: ApiNote;
    fieldOrder: string[];
    onChipClick: ChipClick;
    close: () => void;
    navigateNote: NavigateNote;
}> = ({close, note: {summary, values, valueStyles, content, links}, fieldOrder, navigateNote, onChipClick}) => {
    const closeAndChipClick: ChipClick = (key, value) => (e) => {
        close();
        onChipClick(key, value)(e);
    };

    React.useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            document.getElementById(hash.slice(1))?.scrollIntoView();
        }
    }, []);

    return (
        <>
            <Markdown content={'# ' + summary} navigateNote={navigateNote} />
            <div style={{marginBottom: 30}}>
                <FieldChips
                    fieldOrder={fieldOrder}
                    onChipClick={closeAndChipClick}
                    values={values}
                    valueStyles={valueStyles}
                    links={links}
                />
            </div>
            {content === '' ? (
                <Typography align="center" style={{padding: '30px 0'}}>
                    NO CONTENT
                </Typography>
            ) : (
                <Markdown content={content} navigateNote={navigateNote} />
            )}
        </>
    );
};

interface FieldChipsProps {
    fieldOrder: string[];
    onChipClick: ChipClick;
    values: ApiNote['values'];
    valueStyles: ApiNote['valueStyles'];
    links: ApiNote['links'];
}

const FieldChips: React.FC<FieldChipsProps> = ({fieldOrder, onChipClick, values, valueStyles, links}) => (
    <>
        {fieldOrder
            .filter((key) => values[key] !== null && values[key] !== undefined)
            .map((key) => {
                const value = values[key];
                return (
                    <Chip
                        size="small"
                        key={key}
                        style={{marginRight: 10, ...valueStyles[key]}}
                        label={key + '=' + value}
                        onClick={onChipClick(key, value)}
                    />
                );
            })}{' '}
        {links.map(({href, label}) => (
            <Link
                key={label + href}
                style={{marginRight: 5}}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}>
                {label}
            </Link>
        ))}
    </>
);

export const SummaryNote = React.memo(
    ({
        entry,
        onChipClick,
        selectNote,
        fieldOrder,
        navigateNote,
    }: {
        entry: ApiNote;
        selectNote: (note: ApiNote) => void;
        navigateNote: NavigateNote;
        fieldOrder: string[];
        onChipClick: ChipClick;
    }) => {
        const {summary, values, links, style, valueStyles} = entry;
        return (
            <Paper style={{...style, padding: 10, paddingLeft: 20, marginBottom: 10}} onClick={() => selectNote(entry)}>
                <Markdown content={'# ' + summary} navigateNote={navigateNote} />
                <FieldChips
                    fieldOrder={fieldOrder}
                    onChipClick={onChipClick}
                    values={values}
                    valueStyles={valueStyles}
                    links={links}
                />
            </Paper>
        );
    }
);
