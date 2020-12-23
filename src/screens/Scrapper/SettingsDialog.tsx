import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import DialogActions from '@material-ui/core/DialogActions';
import NativeSelect from '@material-ui/core/NativeSelect';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import { util, Settings } from '../../services';
import { UserSettings } from '../../models';
import * as Common from '../../services/Common';

export interface Props {
  onClosed: () => void;
  onSaved?: () => void;
}
interface States {
  open: boolean;
  settings?: UserSettings
};

class SettingDialog extends React.Component<Props, States> {
  state: States = {
    open: true,
    settings: undefined
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };
  handleClose = () => {
    this.setState({ open: false });
    this.props.onClosed && this.props.onClosed();
  };
  handleSave = () => {
    const { settings } = this.state;

    Settings.saveUserSettings(settings!);

    this.setState({ settings: { ...settings! } });
    const { onSaved } = this.props;
    onSaved && onSaved();
  }

  handleChange = (path: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {


    const { settings } = this.state;
    if (!settings) return;

    const val: string | number | boolean = event.target.value;

    if (path.startsWith('user.site.extensions')) {
      util.setJValue(settings, path, val);
    }
    else if (path.startsWith('user.proxies.turnOn')) {
      const checked = (event.target as HTMLInputElement).checked;
      util.setJValue(settings, path, checked);
    }
    else if (path.startsWith('user.proxies.account')) {
      util.setJValue(settings, path, val);
    }

    else if (path.startsWith('user.proxies.countries')) {
      let v: string | undefined = val;
      if (v === 'NONE') v = undefined;

      util.setJValue(settings, path, v);

    }

    this.setState({ settings: { ...settings } });
  }
  componentDidMount() {
    this.setState({ settings: Settings.getUserSettings() });
  }
  render() {
    const appSettings = Settings.getAppSettings();

    const { settings } = this.state;
    if (settings == null) return null;
    return (
      <div>
        <Dialog
          maxWidth='md'
          fullWidth={true}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">Settings</DialogTitle>
          <DialogContent>
            <Paper style={{ marginTop: 15, padding: 30 }}>
              <div style={{ flex: 1 }}>
                <React.Fragment>
                  <Typography variant="body1" style={{ marginBottom: 15 }}>Site Extensions</Typography>
                  {Common.BookmakerList.map((bookmaker, index) => {
                    return (<FormControl key={bookmaker} style={{ marginRight: 15 }}>
                      <InputLabel htmlFor={bookmaker}>{bookmaker}</InputLabel>
                      < NativeSelect
                        value={(settings["user.site.extensions"] || {})[bookmaker]}
                        onChange={this.handleChange(`user.site.extensions->${bookmaker}`)}
                        input={<Input name={bookmaker} id={bookmaker} />}
                      >
                        {
                          (appSettings['site.extensions'][bookmaker] || ['.com']).map(ex => {
                            return (<option value={ex} key={ex}>{ex}</option>)
                          })
                        }
                      </NativeSelect>
                    </FormControl>
                    );
                  })}
                  <Typography variant="body1" style={{ marginBottom: 15, marginTop: 48 }}>Proxy Settings</Typography>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={util.getJValue(settings, `user.proxies.turnOn`) || false}
                          onChange={this.handleChange(`user.proxies.turnOn`)}
                          value="1"
                        />
                      }
                      label="Proxy"
                    />
                    {settings['user.proxies.turnOn'] && (<div style={{ flex: 1, marginLeft: 30 }}>
                      <Typography variant="caption">Please contact admin to request your proxy account</Typography>
                      <div style={{ flexDirection: 'row', alignItems: 'center', flex: 1, display: 'flex' }}>
                        <TextField fullWidth style={{ marginRight: 30 }}
                          label="User Name"
                          value={(settings['user.proxies.account'] || { username: '' }).username}
                          onChange={this.handleChange(`user.proxies.account->username`)}
                          margin="normal"
                        />
                        <TextField fullWidth style={{ marginLeft: 30 }}
                          label="Password"
                          value={(settings['user.proxies.account'] || { password: '' }).password}
                          onChange={this.handleChange(`user.proxies.account->password`)}
                          margin="normal"
                        />
                      </div>
                    </div>)
                    }
                  </div>
                  {Common.BookmakerList.map((bookmaker, index) => {
                    return (<FormControl key={bookmaker} style={{ marginRight: 15 }}>
                      <InputLabel htmlFor={bookmaker}>{bookmaker}</InputLabel>
                      < NativeSelect
                        value={(settings["user.proxies.countries"] || {})[bookmaker] || 'NONE'}
                        onChange={this.handleChange(`user.proxies.countries->${bookmaker}`)}
                        input={<Input name={bookmaker} id={bookmaker} />}
                      >
                        {
                          (['NONE', ...appSettings['common.proxy.countries']]).map(ex => {
                            return (<option value={ex} key={ex}>{ex}</option>)
                          })
                        }
                      </NativeSelect>
                    </FormControl>
                    );
                  })}
                </React.Fragment>
              </div>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleSave} variant="contained" color="primary">
              Save
            </Button>
            <Button onClick={this.handleClose} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div >
    );
  }
}

export default SettingDialog;

