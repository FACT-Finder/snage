import React from 'react';
import {createRoot} from 'react-dom/client';
import 'github-markdown-css/github-markdown-light.css';
import './index.css';
import App from './App';
import {ThemeProvider} from '@mui/styles';
import {createTheme} from '@mui/material/styles';

const theme = createTheme();

const root = createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
