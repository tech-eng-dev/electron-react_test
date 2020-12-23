import React from 'react';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import NewUserModal from './NewUserModal';
import UpdateUeserModal from './UpdateUserModal';
import { css, StyleSheet } from 'aphrodite/no-important';
import { KOUser } from '../../models';
import TextField from '@material-ui/core/TextField';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import CopyIcon from '@material-ui/icons/FileCopy';
import ConfirmDialog from '../../components/ConfirmDialog';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
const clipboard = (window as any).require('electron').clipboard;

export interface Props {
    onUserAdd: (user: Partial<KOUser>) => void,
    onUserUpdate: (user: KOUser) => void,
    onUserRemove: (uid: number) => void,
    onRefershUsers: () => void,
    users: KOUser[]

}
interface States {
    newUserModal: boolean;
    userOnUpdate?: KOUser;
    userDeleteConfirm?: number;
    copyTooltip?: number;
    keyword: string;
    hideTags: string[];
}


export default class UserManager extends React.PureComponent<Props, States>{
    state: States = {
        newUserModal: false,
        userDeleteConfirm: undefined,
        userOnUpdate: undefined,
        copyTooltip: undefined,
        keyword: '',
        hideTags: []

    };


    handleNewUserDialogOpen = () => {
        this.setState({ newUserModal: true });
    };

    handleNewUserDialogClose = () => {
        this.setState({ newUserModal: false });
    };
    handleUpdateUserDialogOpen = (user: KOUser) => {
        this.setState({ userOnUpdate: user });
    }
    handleUpdateUserDialogClose = () => {
        this.setState({ userOnUpdate: undefined });
    }

    onUserInfoCopy = (uid: number) => {
        const user = this.props.users.find(i => i.id === uid);
        if (!user) return;
        clipboard.writeText(`${user.username}\t${user.key} \t ${user.capacity}`);
        this.setState({ copyTooltip: uid });
        setTimeout(() => { this.setState({ copyTooltip: undefined }) }, 1500);

    }
    handleRefreshUsers = () => {
        this.props.onRefershUsers && this.props.onRefershUsers();
    }


    onKeywordChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ keyword: event.target.value });
    };

    handleSave = (user: Partial<KOUser>) => {
        const { onUserAdd } = this.props;
        onUserAdd && onUserAdd(user);
    };
    handleUpdateUser = (user: KOUser) => {
        const { onUserUpdate } = this.props;
        onUserUpdate && onUserUpdate(user);
    }
    removeUserConfirm = (uid: number) => {
        this.setState({ userDeleteConfirm: uid });

    };
    removeUser = () => {
        const { onUserRemove: onServerUserRemove } = this.props;
        onServerUserRemove && onServerUserRemove(this.state.userDeleteConfirm!);
        this.setState({ userDeleteConfirm: undefined });
    }
    tagListFromUsers = (users: KOUser[]) => {
        const tagList: string[] = [];
        for (const u of users) {
            const exist = tagList.some(i => i.toLowerCase() === u.tags.toLowerCase());
            if (!exist) {
                tagList.push(u.tags);
            }
        }
        return tagList.sort((a, b) => a.localeCompare(b));
    }
    handleTagExpand = (tag: string) => {
        const { hideTags: expandedTags } = this.state;
        if (expandedTags.includes(tag)) {
            expandedTags.splice(expandedTags.indexOf(tag), 1);
        }
        else {
            expandedTags.push(tag);
        }
        this.setState({ hideTags: [...expandedTags] });
    }
    filterUser = (users: KOUser[], keyword: string) => {
        const searchByTag = keyword.startsWith('tags:') || keyword.startsWith('tag:');
        let filterUsers: KOUser[] = [];
        if (searchByTag) {
            const searchTags = keyword.replace(/tags:|tag:/ig, '').split(',').map(i => i.trim().toLowerCase());
            filterUsers = users.filter(u =>
                u.tags && searchTags.some(t =>
                    u.tags.toLowerCase().startsWith(t)
                ));
        }
        else {
            const searchNames = keyword.replace(/user:|users:/ig, '').split(',').map(i => i.trim().toLowerCase());
            filterUsers = users.filter(u =>
                u.username && searchNames.some(t =>
                    u.username.toLowerCase().startsWith(t)
                ));
        }

        const sortUsers = filterUsers.sort((a, b) => {
            const tagCompare = a.tags.localeCompare(b.tags);
            if (tagCompare === 0) {
                return a.username.localeCompare(b.username);
            }
            return tagCompare;
        });
        return sortUsers;
    }
    render() {
        const { users } = this.props;
        const { keyword, hideTags } = this.state;
        const filterUsers = this.filterUser(users, keyword);
        const tags = this.tagListFromUsers(filterUsers);
        return (
            <Paper style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 }}>
                    <div style={{ flex: 1, marginRight: 30, marginLeft: 30 }}>
                        <TextField
                            label="Search By <user name1,user name2> or tag:<tag name1,tag name2>"
                            value={keyword}
                            onChange={this.onKeywordChanged}
                            margin="dense"
                            variant="outlined"
                            fullWidth
                        />
                    </div>
                    <div style={{ alignSelf: 'center', margin: 8 }}>
                        <Button onClick={this.handleNewUserDialogOpen} variant="contained" color="primary">Add New</Button>
                    </div>

                    <div style={{ alignSelf: 'center', margin: 8 }}>
                        <Button onClick={this.handleRefreshUsers} variant="outlined" color="default">Refresh</Button>
                    </div>

                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <div className={css(styles.table)}>
                        <div className={css(styles.tableRow, styles.tableHead)}>
                            <div className={css(styles.tableCell)} style={{ width: 220 }}>Username</div>
                            <div className={css(styles.tableCell)} style={{ width: 220 }}>Key</div>
                            <div className={css(styles.tableCell)} style={{ width: 120 }}>Capacity</div>
                            <div className={css(styles.tableCell)} style={{ width: 80 }}>Disabled</div>
                            <div className={css(styles.tableCell)} style={{ flex: 1, alignSelf: 'flex-end', paddingRight: 30 }}></div>
                        </div>

                        {tags.map(tag => {
                            const tagUsers = filterUsers.filter(i => i.tags.toLowerCase() === tag.toLowerCase());
                            return (
                                <div key={tag} className={css(styles.subTable)}>
                                    <div className={css(styles.tableRow, styles.tableHeader)}>
                                        {`${tag} (${tagUsers.length} users)`}
                                        <div>
                                            <IconButton onClick={() => this.handleTagExpand(tag)} color="primary">
                                                {!hideTags.includes(tag) ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                                            </IconButton>
                                        </div>
                                    </div>
                                    {!hideTags.includes(tag) && (<div className={css(styles.subTableContent)}>
                                        {tagUsers.map((user, index) => {
                                            return (
                                                <div className={css(styles.tableRow, index % 2 === 0 ? styles.oddsTableRow : styles.evenTableRow)}
                                                    key={user.id}>
                                                    <div className={css(styles.tableCell)} style={{ width: 220 }}>{user.username}</div>
                                                    <div className={css(styles.tableCell)} style={{ width: 220 }}>{user.key}</div>
                                                    <div className={css(styles.tableCell)} style={{ width: 120 }}>{user.capacity}</div>
                                                    <div className={css(styles.tableCell)} style={{ width: 80 }}>{user.disabled ? 'Yes' : 'No'}</div>
                                                    <div className={css(styles.tableCell)} style={{ flex: 1, alignSelf: 'flex-end', paddingRight: 30 }}>
                                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>

                                                            <Tooltip open={this.state.copyTooltip === user.id} title="Copy to clipboard">
                                                                <CopyIcon onClick={() => this.onUserInfoCopy(user.id)} style={{ paddingRight: 15 }} />
                                                            </Tooltip>
                                                            <EditIcon onClick={() => this.handleUpdateUserDialogOpen(user)} style={{ paddingRight: 15 }} />
                                                            <CloseIcon onClick={() => this.removeUserConfirm(user.id)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>)}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {this.state.newUserModal && <NewUserModal onUserCreate={this.handleSave} onClose={this.handleNewUserDialogClose} />}
                {this.state.userOnUpdate && <UpdateUeserModal user={this.state.userOnUpdate} onUserUpdate={this.handleUpdateUser} onClose={this.handleUpdateUserDialogClose} />}
                {this.state.userDeleteConfirm && <ConfirmDialog message={'Are you want to delete User?'} onCancel={() => this.setState({ userDeleteConfirm: undefined })}
                    onConfirm={this.removeUser} />}
            </Paper>
        );
    }
}


const styles = StyleSheet.create({

    table: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        fontSize: '0.75rem',
        fontWeight: 500,
    },
    tableRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '1px solid rgba(224, 224, 224, 1)'
    },
    oddsTableRow: { backgroundColor: 'rgb(241, 248, 233)' },
    evenTableRow: {},
    tableHead: {
        fontSize: '0.75rem',
        color: 'rgba(0, 0, 0, 0.54)',
        height: 48,
        paddingLeft: 42

    },
    subTable: {

        display: 'flex',
        flexDirection: 'column',
    },
    subTableContent: {
        marginLeft: 60,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(224, 224, 224, 1)'
    },
    tableHeader: {
        paddingLeft: 18,
        paddingRight: 8,
        paddingTop: 16,
        paddingBottom: 16,
        fontWeight: 'bold',
        fontSize: '0.85rem'
    },
    tableCell: {
        paddingLeft: 18,
        paddingRight: 8,
        paddingTop: 10,
        paddingBottom: 10
    }

});


