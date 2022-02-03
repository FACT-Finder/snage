import React from 'react';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import makeStyles from '@mui/styles/makeStyles';
import {Link, Theme} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import {getStateFromURL, NavigateNote} from './state';
import {CodeComponent} from 'react-markdown/lib/ast-to-react';
import {ReactMarkdownOptions} from 'react-markdown/lib/react-markdown';

const useStyles = makeStyles(
    (theme: Theme) => ({
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
        <ReactMarkdown components={renderers(navigateNote)} className={classes.root + ' markdown-body'}>
            {content}
        </ReactMarkdown>
    );
});

const MarkdownCodeBlock: CodeComponent = ({node, inline, className, children, ...props}) => {
    const match = /language-(\w+)/.exec(className ?? '');
    return !inline && match ? (
        <SyntaxHighlighter language={match[1]} PreTag="div" {...props}>
            {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

const toNoteURL = (href: string): string => {
    const {query} = getStateFromURL(window.location.search);
    return `/?q=${encodeURIComponent(query)}&n=${href}`;
};

const MarkdownLink: (navigateNote: NavigateNote) => React.FC<any> =
    (navigateNote) =>
    ({href: nullableHref, ...props}) => {
        const href = nullableHref ?? '';
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
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    typeof child === 'string' ? text + child : React.Children.toArray(child.props.children).reduce(flatten, text);

const HeadingRenderer: React.FC<any> = ({level, children}) => {
    const text = children.reduce(flatten, '');
    const slug = text.toLowerCase().replace(/\W/g, '-');
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return React.createElement('h' + level, {id: slug}, [
        ...React.Children.toArray(children),
        <React.Fragment key="link">
            {level !== 1 ? (
                <>
                    &nbsp;
                    <a className="slug-link" href={`#${slug}`}>
                        <LinkIcon fontSize="small" />
                    </a>
                </>
            ) : null}
        </React.Fragment>,
    ]);
};

const renderers: (n: NavigateNote) => ReactMarkdownOptions['components'] = (navigateNote) => ({
    code: MarkdownCodeBlock,
    a: MarkdownLink(navigateNote),
    h1: HeadingRenderer,
    h2: HeadingRenderer,
    h3: HeadingRenderer,
    h4: HeadingRenderer,
    h5: HeadingRenderer,
    h6: HeadingRenderer,
});
