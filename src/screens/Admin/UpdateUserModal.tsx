import React, { ChangeEvent } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import AutoRenewIcon from '@material-ui/icons/Autorenew';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { KOUser } from '../../models';
import { util } from '../../services';
export interface Props {
    onUserUpdate: (user: KOUser) => void;
    onClose: () => void;
    user: KOUser;

}

interface States {
    user?: KOUser;
    errors: { [key: string]: string }
}


export default class UpdateUeserModal extends React.Component<Props, States> {
    state: States = {
        user: JSON.parse(JSON.stringify(this.props.user)),
        errors: {}
    };


    handleClose = () => {
        this.setState({ errors: {}, user: undefined });
        this.props.onClose && this.props.onClose();
    };



    handleSave = () => {
        const { user } = this.state;

        if (!user) return;

        let errors: { [key: string]: string } = {};
        if (!user.username) {
            errors['username'] = "user name is required";
        }
        if (!user.key) {
            errors['key'] = 'key is required';
        }
        if (user.capacity < 1) {
            errors['capacity'] = 'capacity need be an number and >1';
        }
        if (!user.tags) {
            errors['tags'] = 'you need setup the team';
        }

        if (Object.keys(errors).length > 0) {
            this.setState({ errors });
            return;
        }
        const { onUserUpdate } = this.props;
        onUserUpdate && onUserUpdate(user);


        this.handleClose();
    }

    handleFieldChanged = (path: string) => (event: ChangeEvent<HTMLInputElement>) => {
        let val = (event.target as HTMLInputElement).value;
        let { user } = this.state;
        if (!user) return;

        if (path === "username") {
            user['username'] = val;
        } else if (path === "key") {
            user['key'] = val;
        }
        else if (path === 'capacity') {
            user['capacity'] = +val;
        }
        else if (path === 'disabled') {
            user['disabled'] = (event.target as HTMLInputElement).checked;
        }
        else if (path === 'tags') {
            user['tags'] = val || 'Default';
        }
        this.setState({ user: { ...user } });
    };
    renewKey = () => {
        if (!this.state.user) return;
        this.setState({ user: { ...this.state.user, key: util.generateUUID() } });
    }


    render() {
        // const {username, keyAccess} = this.props;
        const { user, errors } = this.state;
        if (!user) return null;

        let { username, key, disabled, capacity, tags } = user;
        return (

            <Dialog
                open={true}
                maxWidth="md"
                fullWidth
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">
                    Edit User
                </DialogTitle>
                <DialogContent>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        type="text"
                        onChange={this.handleFieldChanged('username')}
                        value={username}
                        fullWidth
                        disabled
                        error={!!errors['username']}
                        helperText={errors['username']}
                    />
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <TextField
                            disabled
                            autoFocus
                            margin="dense"
                            label="Key Access"
                            type="text"
                            value={key}
                            error={!!errors['key']}
                            helperText={errors['key']}
                            fullWidth
                        />
                        <AutoRenewIcon onClick={this.renewKey} />
                    </div>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Capacity"
                        type="number"
                        error={!!errors['capacity']}
                        helperText={errors['capacity']}
                        defaultValue={capacity}
                        onChange={this.handleFieldChanged('capacity')}
                        fullWidth
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Team"
                        required={true}
                        error={!!errors['tags']}
                        helperText={errors['tags']}
                        defaultValue={tags}
                        onChange={this.handleFieldChanged('tags')}
                        fullWidth
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={disabled}
                                color="primary"
                                onChange={this.handleFieldChanged('disabled')}
                            />
                        }
                        label="Is Disabled?"
                    />

                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color="primary" variant="outlined">
                        Cancel
                  </Button>
                    <Button onClick={this.handleSave} color="primary" variant="contained">
                        Save
                  </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
