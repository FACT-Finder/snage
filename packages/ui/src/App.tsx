import React from 'react';
import './App.css';
import {ApiNote} from '../../shared/type';
import Chip from '@material-ui/core/Chip';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {Typography, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, makeStyles} from '@material-ui/core';

const App: React.FC = () => {
    const [entries, setEntries] = React.useState<ApiNote[]>([]);

    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>Changelog</h1>
            <Search setEntries={setEntries} />
            <div>
                {entries.map((entry) => (
                    <Entry key={entry.__id} entry={entry} />
                ))}
            </div>
        </div>
    );
};

const Search: React.FC<{setEntries: (e: ApiNote[]) => void}> = ({setEntries}) => {
    const [query, setQuery] = React.useState('');

    React.useEffect(() => {
        axios.get(`/note?query=${query}`).then((resp) => {
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

const Entry = React.memo(({entry: {__content, __summary, __id, ...other}}: {entry: ApiNote}) => {
    const classes = useStyles();
    return (
        <ExpansionPanel>
            <ExpansionPanelSummary>
                <div>
                    <Typography variant="h5" component="div" className={classes.header}>
                        <ReactMarkdown source={__summary} />
                    </Typography>
                    {Object.entries(other).map(([key, value]) => (
                        <Chip key={key} style={{marginRight: 10}} label={key + ': ' + value} />
                    ))}
                </div>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div>{__content === '' ? '-- no content --' : <ReactMarkdown source={__content} />}</div>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
});

const useStyles = makeStyles({
    header: {
        '& > p': {margin: '0'},
    },
});

export default App;
