import React from 'react';
import './App.css';
import {Note} from "../../shared/type";
import Chip from '@material-ui/core/Chip';
import ReactMarkdown from "react-markdown";
import axios from 'axios';

function App() {
    const [entries, setEntries] = React.useState<Note[]>([]);


    return (
        <div className="App">
            <h1 style={{textAlign: 'center'}}>FACT-Finder Changelog</h1>
            <Search setEntries={setEntries}/>
            <div>
                {entries.map(entry => <Entry key={entry.id} entry={entry}/>)}
            </div>
        </div>
    );
}

const Search = ({setEntries}: any) => {
    const [query, setQuery] = React.useState('');

    React.useEffect(() => {
        axios.get(`/note?query=${query}`).then(resp => {
            setEntries(resp.data);
        });
    }, [query, setEntries]);

    return <div style={{textAlign: 'center', padding: 30}}><input type="text" style={{width: 500}} value={query} onChange={(e) => setQuery(e.target.value)}/></div>
};

const Entry = React.memo(({entry: {name, content, ...other}}: {entry: Note}) => {
    return <div style={{}}>
        <div>
            {Object.entries(other).map(([key, value]) => <Chip key={key} style={{marginRight: 10}} label={key+ ': ' + value}/>)}
        </div>
        <ReactMarkdown source={content}/>
        <hr/>
    </div>;
});

export default App;
