import React from 'react';
import ReactMarkdown, {ReactMarkdownProps} from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {makeStyles} from '@material-ui/core/styles';
import {Link} from '@material-ui/core';

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

export const Markdown = React.memo(({content}: {content: string}) => {
    const classes = useStyles();
    return <ReactMarkdown source={content} renderers={renderers} className={classes.root + ' markdown-body'} />;
});

const MarkdownCodeBlock: React.FC<{language?: string; value: string}> = ({value, language}) => (
    <SyntaxHighlighter language={language}>{value}</SyntaxHighlighter>
);
const MarkdownLink: React.FC<any> = (props) => <Link {...props} onClick={stopPropagation} />;

const stopPropagation = (e: React.MouseEvent): void => e.stopPropagation();

const renderers: ReactMarkdownProps['renderers'] = {
    code: MarkdownCodeBlock,
    link: MarkdownLink,
};
