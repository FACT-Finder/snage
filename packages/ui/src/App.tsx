import React from 'react';
import './App.css';
import {ApiNote} from '../../shared/type';
import Chip from '@material-ui/core/Chip';
import axios from 'axios';
import {
    IconButton,
    InputAdornment,
    Link,
    TextField,
    Tooltip,
    ExpansionPanel,
    ExpansionPanelSummary,
    ExpansionPanelDetails,
} from '@material-ui/core';
import {useDebounce} from 'use-debounce';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import Export from '@material-ui/icons/FileCopy';
import {Markdown} from './Markdown';
import {ExportDialog} from './ExportDialog';

type SetQuery = (x: DebounceableQuery) => void;
const getQueryFromSearch = (search: string): string =>
    decodeURIComponent(
        search
            .slice(1)
            .split('&')
            .find((param) => param.startsWith('q='))
            ?.split('=')[1] ?? ''
    );

interface DebounceableQuery {
    query: string;
    debounce: boolean;
}

const useUrlChangeableQuery = (): [DebounceableQuery, (v: DebounceableQuery) => void] => {
    const [state, setState] = React.useState<DebounceableQuery>(() => ({
        query: getQueryFromSearch(window.location.search),
        debounce: false,
    }));
    React.useEffect(() => {
        const onChange = (): void => setState({query: getQueryFromSearch(window.location.search), debounce: false});
        window.addEventListener('popstate', onChange);
        return () => window.removeEventListener('popstate', onChange);
    }, [setState]);
    return [state, setState];
};

const App: React.FC = () => {
    const [{notes, fieldOrder}, setEntries] = React.useState<{
        notes: ApiNote[];
        fieldOrder: string[];
    }>(() => ({notes: [], fieldOrder: []}));
    const [query, setQuery] = useUrlChangeableQuery();
    const [debounceQuery] = useDebounce(query.query, query.debounce ? 500 : 0);

    React.useEffect(() => {
        axios.get(`/note?query=${encodeURIComponent(debounceQuery)}`).then((resp) => {
            setEntries(resp.data);
            return;
        });
        const newSearch = `?q=${encodeURIComponent(debounceQuery)}`;
        if (newSearch !== window.location.search) {
            window.history.pushState({query: debounceQuery}, '', newSearch);
        }
    }, [debounceQuery, setEntries]);

    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search query={query.query} setQuery={setQuery} />
            <div>
                {notes.map((entry) => (
                    <Entry key={entry.id} entry={entry} fieldOrder={fieldOrder} setQuery={setQuery} />
                ))}
            </div>
        </div>
    );
};

interface SearchProps {
    query: string;
    setQuery: SetQuery;
}

const Search: React.FC<SearchProps> = ({query, setQuery}) => {
    const [exportOpen, setExportOpen] = React.useState(false);
    return (
        <div style={{textAlign: 'center', padding: 30}}>
            <TextField
                type="text"
                variant="outlined"
                style={{maxWidth: 600, width: '100%'}}
                value={query}
                onChange={(e) => setQuery({query: e.target.value, debounce: true})}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            {query !== '' ? (
                                <IconButton onClick={() => setQuery({query: '', debounce: false})} size="small">
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
                                <IconButton size="small" onClick={() => setExportOpen(true)}>
                                    <Export />
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                    ),
                }}
            />
            <ExportDialog query={query} open={exportOpen} setOpen={setExportOpen} />
        </div>
    );
};

const Entry = React.memo(
    ({
        entry: {content, summary, values, links, style, valueStyles},
        setQuery,
        fieldOrder,
    }: {
        entry: ApiNote;
        setQuery: SetQuery;
        fieldOrder: string[];
    }) => {
        const handleClick = (key: string, value: string | string[]) => (e) => {
            e.stopPropagation();
            const arrayValue = Array.isArray(value) ? value : [value];
            setQuery({query: arrayValue.map((v) => `${key}=${v}`).join(' or '), debounce: false});
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
