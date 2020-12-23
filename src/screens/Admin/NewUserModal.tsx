import React, { ChangeEvent } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { KOUser } from '../../models';
import { util } from '../../services';

export interface Props {
    onUserCreate: (user: Partial<KOUser>) => void
    onClose: () => void
}

interface States {
    key: string;
    username: string;
    capacity: number;
    tags: string,
    errors: { [key: string]: string }
}

export default class NewUserModal extends React.Component<Props, States> {
    state: States = {
        key: util.generateUUID(),
        username: '',
        capacity: 5,
        tags: 'Default',
        errors: {}
    };


    handleClose = () => {
        this.setState({ errors: {}, username: '', key: '', capacity: 1 });
        this.props.onClose && this.props.onClose();
    };
    handleUsernameChanged = (event: ChangeEvent<HTMLInputElement>) => {
        const val: string | number = (event.target as HTMLInputElement).value;
        this.setState({ username: val });
    };
    handldeCapacityChanged = (event: ChangeEvent<HTMLInputElement>) => {
        const val: string | number = (event.target as HTMLInputElement).value;
        this.setState({ capacity: +val });
    };

    handldeTagsChanged = (event: ChangeEvent<HTMLInputElement>) => {
        const val: string | number = (event.target as HTMLInputElement).value;
        this.setState({ tags: val });
    };


    handleSave = () => {
        const { username, key, tags, capacity } = this.state;

        let errors: { [key: string]: string } = {};
        if (!username) {
            errors['username'] = "user name is required";
        }
        if (!key) {
            errors['key'] = 'key is required';
        }
        if (+capacity < 1) {
            errors['capacity'] = 'capacity need be an number and >1';
        }
        if (!tags) {
            errors['tags'] = 'setup the team name';
        }

        if (Object.keys(errors).length > 0) {
            this.setState({ errors });
            return;
        }
        const { onUserCreate } = this.props;
        onUserCreate && onUserCreate({ username, key, capacity,tags });

        this.setState({
            key: util.generateUUID(),
            errors: {}
        });
        this.handleClose();
    }

    render() {
        const { username, errors, key, capacity, tags } = this.state;
        return (
            <Dialog
                maxWidth='md'
                fullWidth={true}
                open={true}
                onClose={this.handleClose}
                aria-labelledby="form-dialog-title"
                style={{ padding: 30 }}
            >
                <DialogTitle id="form-dialog-title">
                    Add New User
                </DialogTitle>
                <DialogContent>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        type="text"
                        onChange={this.handleUsernameChanged}
                        fullWidth
                        required
                        defaultValue={username}
                        error={!!errors['username']}
                        helperText={errors['username']}

                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Key Access"
                        type="text"
                        defaultValue={key}
                        fullWidth
                        disabled
                    />

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Capacity"
                        type="number"
                        error={!!errors['capacity']}
                        helperText={errors['capacity']}
                        defaultValue={capacity}
                        onChange={this.handldeCapacityChanged}
                        fullWidth
                    />

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team"
                        error={!!errors['tags']}
                        helperText={errors['tags']}
                        defaultValue={tags}
                        onChange={this.handldeTagsChanged}
                        fullWidth
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} variant="outlined" color="primary">
                        Cancel
                  </Button>
                    <Button onClick={this.handleSave} variant="contained" color="primary">
                        ADD
                  </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
