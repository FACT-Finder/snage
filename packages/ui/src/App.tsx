import React from 'react';
import './App.css';
import {ApiNote} from '../../shared/type';
import Chip from '@material-ui/core/Chip';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import axios from 'axios';
import {Typography, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, makeStyles, Link} from '@material-ui/core';

const App: React.FC = () => {
    const [entries, setEntries] = React.useState<ApiNote[]>([]);

    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search setEntries={setEntries} />
            <div>
                {entries.map((entry) => (
                    <Entry key={entry.id} entry={entry} />
                ))}
            </div>
        </div>
    );
};

const Search: React.FC<{setEntries: (e: ApiNote[]) => void}> = ({setEntries}) => {
    const [query, setQuery] = React.useState('');

    React.useEffect(() => {
        axios.get(`/note?query=${encodeURIComponent(query)}`).then((resp) => {
            setEntries(resp.data);
            return;
        });
    }, [query, setEntries]);

    return (
        <div style={{textAlign: 'center', padding: 30}}>
            <input type="text" style={{width: 500}} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
    );
};

const Entry = React.memo(({entry: {content, summary, values, links}}: {entry: ApiNote}) => {
    const classes = useStyles();
    return (
        <ExpansionPanel>
            <ExpansionPanelSummary>
                <div>
                    <Typography variant="h5" component="div" className={classes.header + ' markdown-body'}>
                        <ReactMarkdown source={summary} />
                    </Typography>
                    {Object.entries(values).map(([key, value]) => (
                        <Chip size="small" key={key} style={{marginRight: 10}} label={key + ': ' + value} />
                    ))}
                    {links.map(({href, label}) => (
                        <Link key={label + href} href={href} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}>
                            {label}
                        </Link>
                    ))}
                </div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div style={{width: '100%'}}>
                    {content === '' ? (
                        '-- no content --'
                    ) : (
                        <ReactMarkdown source={content} renderers={{code: CodeBlock}} className={'markdown-body'} />
                    )}
                </div>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
});

const useStyles = makeStyles({
    header: {
        '& > p': {margin: '0'},
    },
});

const CodeBlock: React.FC<{language?: string; value: string}> = ({value, language}) => {
    return <SyntaxHighlighter language={language}>{value}</SyntaxHighlighter>;
};

export default App;
