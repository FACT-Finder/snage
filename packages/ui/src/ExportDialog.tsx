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
    Select,
    FormControl,
    MenuItem,
    InputLabel,
} from '@material-ui/core';

export const ExportDialog = ({
    query,
    open,
    setOpen,
    groupByFields,
}: {
    groupByFields: string[];
    query: string;
    open: boolean;
    setOpen: (x: boolean) => void;
}): React.ReactElement => {
    const [tags, setTags] = React.useState(true);
    const [groupBy, setGroupBy] = React.useState('');

    const groupByUrl = groupBy ? `&groupBy=${groupBy}` : '';
    const href = `export?query=${encodeURIComponent(query)}&tags=${tags ? 'true' : 'false'}${groupByUrl}`;

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
                <FormControl fullWidth>
                    <InputLabel>Group By</InputLabel>
                    <Select value={groupBy} onChange={({target: {value}}) => setGroupBy(value as string)}>
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {groupByFields.map((field) => (
                            <MenuItem key={field} value={field}>
                                {field}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
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
