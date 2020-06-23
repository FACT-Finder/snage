import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    DialogContentText,
    FormControlLabel,
    FormGroup,
    Checkbox,
    Typography,
} from '@material-ui/core';

export const ExportDialog = ({
    query,
    open,
    setOpen,
}: {
    query: string;
    open: boolean;
    setOpen: (x: boolean) => void;
}): React.ReactElement => {
    const [tags, setTags] = React.useState(true);

    const href = `export?query=${encodeURIComponent(query)}&tags=${tags ? 'true' : 'false'}`;

    return (
        <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Export</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {query === '' ? (
                        <Typography>Export all notes as plain text in markdown format.</Typography>
                    ) : (
                        <>
                            <Typography>
                                Export notes matching the query below as plain text in markdown format.
                            </Typography>
                            <Typography style={{marginTop: 10}}>
                                <b>Query: </b>
                                <code>{query}</code>
                            </Typography>
                        </>
                    )}
                </DialogContentText>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={tags}
                                onChange={(_, checked) => setTags(checked)}
                                name="tags"
                                color="primary"
                            />
                        }
                        label="Include note tags"
                    />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="primary">
                    Cancel
                </Button>
                <Button
                    color="primary"
                    href={href}
                    onClick={() => setOpen(false)}
                    target="_blank"
                    rel="noreferrer noopener">
                    Export
                </Button>
            </DialogActions>
        </Dialog>
    );
};
