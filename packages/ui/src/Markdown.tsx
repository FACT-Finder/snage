import React from 'react';
import ReactMarkdown, {ReactMarkdownProps} from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {makeStyles} from '@material-ui/core/styles';
import {Link} from '@material-ui/core';
import {getStateFromURL, NavigateNote} from './state';

const useStyles = makeStyles(
    (theme) => ({
        root: {
            '& h1': {
                ...theme.typography.h1,
                fontSize: '1.8em',
                borderBottom: 0,
            },
            '& a, & a code': {
                color: theme.palette.primary.main,
            },
        },
    }),
    {name: 'Markdown'}
);

export const Markdown = React.memo(({content, navigateNote}: {content: string; navigateNote: NavigateNote}) => {
    const classes = useStyles();
    return (
        <ReactMarkdown
            source={content}
            renderers={renderers(navigateNote)}
            className={classes.root + ' markdown-body'}
        />
    );
});

const MarkdownCodeBlock: React.FC<{language?: string; value: string}> = ({value, language}) => (
    <SyntaxHighlighter language={language}>{value}</SyntaxHighlighter>
);

const toNoteURL = (href: string): string => {
    const {query} = getStateFromURL(window.location.search);
    return `/?q=${encodeURIComponent(query)}&n=${href}`;
};

const MarkdownLink: (navigateNote: NavigateNote) => React.FC<any> = (navigateNote) => (props) => {
    const href = props?.href ?? '';
    const isNoteLink =
        !href.includes('://') && !href.startsWith('//') && !href.startsWith('/') && !href.startsWith('#');

    const hrefWithNote = isNoteLink ? toNoteURL(href) : href;

    return (
        <Link
            {...props}
            href={hrefWithNote}
            onClick={(e) => {
                e.stopPropagation();
                if (isNoteLink) {
                    e.preventDefault();
                    navigateNote(href);
                }
            }}
        />
    );
};

const flatten = (text, child): any =>
    typeof child === 'string' ? text + child : React.Children.toArray(child.props.children).reduce(flatten, text);

const HeadingRenderer: React.FC<any> = ({level, children}) => {
    const text = children.reduce(flatten, '');
    const slug = text.toLowerCase().replace(/\W/g, '-');
    return React.createElement('h' + level, {id: slug}, React.Children.toArray(children));
};

const renderers: (n: NavigateNote) => ReactMarkdownProps['renderers'] = (navigateNote) => ({
    code: MarkdownCodeBlock,
    link: MarkdownLink(navigateNote),
    heading: HeadingRenderer,
});
