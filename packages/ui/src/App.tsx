import React from 'react';
import './App.css';
import {ApiNote, ApiParseError} from '../../shared/type';
import axios, {AxiosError} from 'axios';
import {Backdrop, ClickAwayListener, IconButton, InputAdornment, Paper, TextField, Tooltip} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import Export from '@material-ui/icons/FileCopy';
import {ExportDialog} from './ExportDialog';
import {ErrorTooltip, ErrorTooltipBody} from './ErrorTooltip';
import {FullNote, SummaryNote} from './Note';
import {NavigateNote, useUrlChangableState} from './state';
import {DynamicVirtualList} from './DynamicVirtualList';

type FQuery = (x: string) => void;

const App: React.FC = () => {
    const firstRender = React.useRef(true);
    const [{notes, fieldOrder, groupByFields, error}, setEntries] = React.useState<{
        notes: ApiNote[];
        fieldOrder: string[];
        groupByFields: string[];
        error?: ApiParseError & {query: string};
    }>(() => ({notes: [], fieldOrder: [], groupByFields: []}));
    const [{query, note}, setState] = useUrlChangableState();
    const [selectedNote, setSelectedNote] = React.useState<ApiNote & {hash?: string}>();

    const executeQuery = React.useCallback(
        (query: string) => {
            axios
                .get(`/note?query=${encodeURIComponent(query)}`)
                .then((resp) => {
                    setEntries(resp.data);
                    return;
                })
                .catch((error: AxiosError) => {
                    const data = error.response?.data;
                    if (data && error.response?.status === 400) {
                        setEntries((current) => ({...current, error: {...data, query}}));
                    }
                });
        },
        [setEntries]
    );

    React.useEffect(() => {
        // skip on first render, because the state is already set
        if (!firstRender.current) {
            setState(({query}) => ({query, note: selectedNote?.id, hash: selectedNote?.hash}));
        }
        firstRender.current = false;
    }, [selectedNote, setState]);

    const onChipClick = React.useCallback(
        (key: string, value: string | string[]) => (e: React.MouseEvent) => {
            e.stopPropagation();
            const arrayValue = Array.isArray(value) ? value : [value];
            setState({query: arrayValue.map((v) => `${key}=${v}`).join(' or ')});
        },
        [setState]
    );

    const navigateNote: NavigateNote = React.useCallback(
        (note) => {
            const [withoutHash, hash] = note.split('#');
            axios
                .get(`/note?query=${encodeURIComponent('id=' + withoutHash)}`)
                .then((resp) => {
                    const [respNote] = resp.data.notes;
                    if (respNote) {
                        setSelectedNote({...respNote, hash});
                    } else {
                        setState(({query}) => ({query}));
                    }
                    return;
                })
                .catch(() => {
                    setState(({query}) => ({query}));
                });
        },
        [setState]
    );

    React.useEffect(() => {
        if (!note) {
            setSelectedNote(undefined);
        } else if (typeof note === 'string') {
            navigateNote(note);
        }
    }, [note, setSelectedNote, navigateNote]);

    React.useEffect(() => {
        executeQuery(query);
    }, [query, executeQuery]);

    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search query={query} setQuery={(query) => setState({query})} error={error} groupByFields={groupByFields} />
            <div>
                <DynamicVirtualList
                    entries={notes}
                    rowRenderer={(note, style) => (
                        <div style={style} key={note.id}>
                            <SummaryNote
                                key={note.id}
                                entry={note}
                                navigateNote={navigateNote}
                                selectNote={setSelectedNote}
                                fieldOrder={fieldOrder}
                                onChipClick={onChipClick}
                            />
                        </div>
                    )}
                />
            </div>
            {selectedNote ? (
                <Backdrop open={true} style={{zIndex: 1}}>
                    <ClickAwayListener onClickAway={() => setSelectedNote(undefined)}>
                        <Paper className="noteBody">
                            <FullNote
                                key={selectedNote.id}
                                note={selectedNote}
                                fieldOrder={fieldOrder}
                                navigateNote={navigateNote}
                                onChipClick={onChipClick}
                                close={() => {
                                    setSelectedNote(undefined);
                                }}
                            />
                        </Paper>
                    </ClickAwayListener>
                </Backdrop>
            ) : null}
        </div>
    );
};

interface SearchProps {
    query: string;
    setQuery: FQuery;
    error?: ApiParseError & {query: string};
    groupByFields: string[];
}

const Search: React.FC<SearchProps> = ({query, setQuery, error, groupByFields}) => {
    const [exportOpen, setExportOpen] = React.useState(false);
    const [tempQuery, setTempQuery] = React.useState(query);

    React.useEffect(() => {
        if (query !== tempQuery) {
            setTempQuery(query);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return (
        <div style={{textAlign: 'center', padding: 30}}>
            <ErrorTooltip
                open={!!error}
                placement="bottom-start"
                arrow={true}
                title={error ? <ErrorTooltipBody error={error} /> : ''}>
                <TextField
                    type="text"
                    error={!!error}
                    variant="outlined"
                    style={{maxWidth: 600, width: '100%'}}
                    value={tempQuery}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setQuery(tempQuery);
                        }
                    }}
                    onChange={(e) => setTempQuery(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {query !== '' ? (
                                    <IconButton onClick={() => setQuery('')} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                ) : null}
                                <IconButton
                                    href="https://snage.dev/query"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    size="small">
                                    <HelpIcon />
                                </IconButton>
                                <Tooltip title="Export">
                                    <IconButton size="small" onClick={() => setExportOpen(true)} disabled={!!error}>
                                        <Export />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
            </ErrorTooltip>
            <ExportDialog groupByFields={groupByFields} query={tempQuery} open={exportOpen} setOpen={setExportOpen} />
        </div>
    );
};

export default App;
