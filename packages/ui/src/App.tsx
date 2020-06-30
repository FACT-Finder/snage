import React from 'react';
import './App.css';
import {ApiNote, ApiParseError} from '../../shared/type';
import Chip from '@material-ui/core/Chip';
import axios, {AxiosError} from 'axios';
import {
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    IconButton,
    InputAdornment,
    Link,
    TextField,
    Tooltip,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import Export from '@material-ui/icons/FileCopy';
import {Markdown} from './Markdown';
import {ExportDialog} from './ExportDialog';
import {ErrorTooltip, ErrorTooltipBody} from './ErrorTooltip';

type FQuery = (x: string) => void;
const getQueryFromSearch = (search: string): string =>
    decodeURIComponent(
        search
            .slice(1)
            .split('&')
            .find((param) => param.startsWith('q='))
            ?.split('=')[1] ?? ''
    );

const useUrlChangeableQuery = (): [string, (v: string) => void] => {
    const [state, setState] = React.useState<string>(() => getQueryFromSearch(window.location.search));
    React.useEffect(() => {
        const onChange = (): void => setState(getQueryFromSearch(window.location.search));
        window.addEventListener('popstate', onChange);
        return () => window.removeEventListener('popstate', onChange);
    }, [setState]);
    return [state, setState];
};

const App: React.FC = () => {
    const [{notes, fieldOrder, error}, setEntries] = React.useState<{
        notes: ApiNote[];
        fieldOrder: string[];
        error?: ApiParseError & {query: string};
    }>(() => ({notes: [], fieldOrder: []}));
    const [query, setQuery] = useUrlChangeableQuery();

    const executeQuery = React.useCallback(
        (query: string) => {
            setQuery(query);
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
            const newSearch = `?q=${encodeURIComponent(query)}`;
            if (newSearch !== window.location.search) {
                window.history.pushState({query: query}, '', newSearch);
            }
        },
        [setEntries, setQuery]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => executeQuery(query), []);

    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search query={query} setQuery={setQuery} executeQuery={executeQuery} error={error} />
            <div>
                {notes.map((entry) => (
                    <Entry key={entry.id} entry={entry} fieldOrder={fieldOrder} executeQuery={executeQuery} />
                ))}
            </div>
        </div>
    );
};

interface SearchProps {
    query: string;
    executeQuery: FQuery;
    setQuery: FQuery;
    error?: ApiParseError & {query: string};
}

const Search: React.FC<SearchProps> = ({query, executeQuery, setQuery, error}) => {
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
            <ExportDialog query={query} open={exportOpen} setOpen={setExportOpen} />
        </div>
    );
};

const Entry = React.memo(
    ({
        entry: {content, summary, values, links, style, valueStyles},
        executeQuery,
        fieldOrder,
    }: {
        entry: ApiNote;
        executeQuery: FQuery;
        fieldOrder: string[];
    }) => {
        const handleClick = (key: string, value: string | string[]) => (e) => {
            e.stopPropagation();
            const arrayValue = Array.isArray(value) ? value : [value];
            executeQuery(arrayValue.map((v) => `${key}=${v}`).join(' or '));
        };
        return (
            <ExpansionPanel style={style}>
                <ExpansionPanelSummary>
                    <div>
                        <Markdown content={'# ' + summary} />
                        {fieldOrder.map((key) => {
                            const value = values[key];
                            if (value === null || value === undefined) {
                                return undefined;
                            }
                            return (
                                <Chip
                                    size="small"
                                    key={key}
                                    style={{marginRight: 10, ...valueStyles[key]}}
                                    label={key + '=' + value}
                                    onClick={handleClick(key, value)}
                                />
                            );
                        })}
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
                    </div>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <div style={{width: '100%'}}>
                        {content === '' ? '-- no content --' : <Markdown content={content} />}
                    </div>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        );
    }
);

export default App;
