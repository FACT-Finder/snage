import React from 'react';
import ReactDOM from 'react-dom';
import 'github-markdown-css/github-markdown-light.css';
import './index.css';
import App from './App';
import {ThemeProvider} from '@mui/styles';
import {createTheme} from '@mui/material/styles';

const theme = createTheme();

ReactDOM.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
