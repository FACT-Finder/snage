import React from 'react';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import makeStyles from '@mui/styles/makeStyles';
import {Link, Theme} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import remarkGfm from 'remark-gfm';
import {getStateFromURL, NavigateNote} from './state';
import Markdown, {Components, ExtraProps} from 'react-markdown';
import {ElementContent} from 'hast';

const useStyles = makeStyles(
    (theme: Theme) => ({
        root: {
            '& h1': {
                ...theme.typography.h1,
                fontSize: '1.8em',
                borderBottom: 0,
            },
            '& pre': {
                background: 'rgb(245, 242, 240)',
            },
            '& a, & a code': {
                color: theme.palette.primary.main,
            },
        },
        code: {
            padding: '0 !important',
            margin: '0 !important',
        },
    }),
    {name: 'Markdown'}
);

export const ReactMarkdown = React.memo(({content, navigateNote}: {content: string; navigateNote: NavigateNote}) => {
    const classes = useStyles();
    return (
        <Markdown
            components={renderers(navigateNote)}
            remarkPlugins={[remarkGfm]}
            className={classes.root + ' markdown-body'}
        >
            {content}
        </Markdown>
    );
});

const MarkdownCodeBlock: (
    props: React.JSX.IntrinsicElements['code'] & ExtraProps
) => React.JSX.Element | string | null | undefined = ({node, className, children}) => {
    const classes = useStyles();
    const match = /language-(\w+)/.exec(className ?? '');
    return !node?.properties?.inline && match ? (
        <SyntaxHighlighter className={classes.code} language={match[1]} PreTag="div" {...node?.properties}>
            {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
    ) : (
        <code className={className} {...node?.properties}>
            {children}
        </code>
    );
};

const toNoteURL = (href: string): string => {
    const {query} = getStateFromURL(window.location.search);
    return `/?q=${encodeURIComponent(query)}&n=${href}`;
};

const MarkdownLink: (
    navigateNote: NavigateNote
) => (props: React.JSX.IntrinsicElements['a'] & ExtraProps) => React.JSX.Element | string | null | undefined =
    (navigateNote) =>
    ({href: nullableHref, node}) => {
        const href = nullableHref ?? '';
        const isNoteLink =
            !href.includes('://') && !href.startsWith('//') && !href.startsWith('/') && !href.startsWith('#');

        const hrefWithNote = isNoteLink ? toNoteURL(href) : href;

        return (
            <Link
                {...node?.properties}
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

const flatten = (text: string, child: ElementContent): string =>
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    child.type === 'text' ? text + child.value : child.type === 'element' ? child.children.reduce(flatten, text) : '';

const getHeadingRenderer =
    <TagName extends keyof React.JSX.IntrinsicElements>(
        level: number
    ): ((props: React.JSX.IntrinsicElements[TagName] & ExtraProps) => React.JSX.Element | string | null | undefined) =>
    ({node, children}) => {
        const text = node?.children?.reduce(flatten, '');
        const slug = text?.toLowerCase().replace(/\W/g, '-') ?? 'No headline text';
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        return React.createElement('h' + level, {id: slug}, [
            ...React.Children.toArray(children),
            <React.Fragment key="link">
                {level === 1 ? null : (
                    <>
                        &nbsp;
                        <a className="slug-link" href={`#${slug}`}>
                            <LinkIcon fontSize="small" />
                        </a>
                    </>
                )}
            </React.Fragment>,
        ]);
    };

const renderers: (n: NavigateNote) => Components = (navigateNote) => ({
    code: MarkdownCodeBlock,
    a: MarkdownLink(navigateNote),
    h1: getHeadingRenderer<'h1'>(1),
    h2: getHeadingRenderer<'h2'>(2),
    h3: getHeadingRenderer<'h3'>(3),
    h4: getHeadingRenderer<'h4'>(4),
    h5: getHeadingRenderer<'h5'>(5),
    h6: getHeadingRenderer<'h6'>(6),
});
