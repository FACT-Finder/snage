import React, {SetStateAction} from 'react';
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

type FQuery = (x: string) => void;
const getStateFromURL = (search: string): State => {
    const pairs = search.slice(1).split('&');
    const query = pairs.find((param) => param.startsWith('q='))?.split('=')[1] ?? '';
    const note = pairs.find((param) => param.startsWith('n='))?.split('=')[1] ?? '';
    return {
        query: decodeURIComponent(query),
        note: note === '' ? undefined : decodeURIComponent(note),
    };
};

type State = {query: string; note?: string};

const useUrlChangableState = (): [State, React.Dispatch<SetStateAction<State>>] => {
    const [state, setState] = React.useState<State>(() => getStateFromURL(window.location.search));
    React.useEffect(() => {
        const onChange = (): void => setState(getStateFromURL(window.location.search));
        window.addEventListener('popstate', onChange);
        return () => window.removeEventListener('popstate', onChange);
    }, [setState]);

    const setStateAndUrl = React.useCallback(
        (stateF: SetStateAction<State>) => {
            setState((old) => {
                const newState = typeof stateF === 'function' ? stateF(old) : stateF;
                const params = [`q=${encodeURIComponent(newState.query)}`];
                if (newState.note) {
                    params.push(`n=${encodeURIComponent(newState.note)}`);
                }

                const newSearch = `?${params.join('&')}`;
                if (newSearch !== window.location.search) {
                    window.history.pushState(newState, '', newSearch);
                }
                return newState;
            });
        },
        [setState]
    );

    return [state, setStateAndUrl];
};

const App: React.FC = () => {
    const [{notes, fieldOrder, groupByFields, error}, setEntries] = React.useState<{
        notes: ApiNote[];
        fieldOrder: string[];
        groupByFields: string[];
        error?: ApiParseError & {query: string};
    }>(() => ({notes: [], fieldOrder: [], groupByFields: []}));
    const [{query, note}, setState] = useUrlChangableState();
    const [selectedNote, setSelectedNote] = React.useState<ApiNote>();

    const executeQuery = React.useCallback(
        (query: string) => {
            setState({query});
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
        [setEntries, setState]
    );

    React.useEffect(() => {
        setState(({query}) => ({query, note: selectedNote?.id}));
    }, [selectedNote]);

    const onChipClick = React.useCallback(
        (key: string, value: string | string[]) => (e: React.MouseEvent) => {
            e.stopPropagation();
            const arrayValue = Array.isArray(value) ? value : [value];
            executeQuery(arrayValue.map((v) => `${key}=${v}`).join(' or '));
        },
        [executeQuery]
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        executeQuery(query);
        if (note) {
            axios
                .get(`/note?query=${encodeURIComponent('id=' + note)}`)
                .then((resp) => {
                    const [respNote] = resp.data.notes;
                    if (respNote) {
                        setSelectedNote(respNote);
                    } else {
                        setState(({query}) => ({query}));
                    }
                    return;
                })
                .catch(() => {
                    setState(({query}) => ({query}));
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search
                query={query}
                setQuery={(query) => setState({query})}
                executeQuery={executeQuery}
                error={error}
                groupByFields={groupByFields}
            />
            <div>
                {notes.map((entry) => (
                    <SummaryNote
                        key={entry.id}
                        entry={entry}
                        selectNote={setSelectedNote}
                        fieldOrder={fieldOrder}
                        onChipClick={onChipClick}
                    />
                ))}
            </div>
            {selectedNote ? (
                <Backdrop open={true} style={{zIndex: 1}}>
                    <ClickAwayListener onClickAway={() => setSelectedNote(undefined)}>
                        <Paper className="noteBody">
                            <FullNote
                                note={selectedNote}
                                fieldOrder={fieldOrder}
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
    executeQuery: FQuery;
    setQuery: FQuery;
    error?: ApiParseError & {query: string};
    groupByFields: string[];
}

const Search: React.FC<SearchProps> = ({query, executeQuery, setQuery, error, groupByFields}) => {
    const [exportOpen, setExportOpen] = React.useState(false);
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
                    value={query}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            executeQuery(query);
                        }
                    }}
                    onChange={(e) => setQuery(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {query !== '' ? (
                                    <IconButton onClick={() => executeQuery('')} size="small">
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
            <ExportDialog groupByFields={groupByFields} query={query} open={exportOpen} setOpen={setExportOpen} />
        </div>
    );
};

export default App;
