import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import DialogActions from '@material-ui/core/DialogActions';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';


import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { util, Settings, Common } from '../../services';
import { css, StyleSheet } from 'aphrodite';
import { UserSettings } from '../../models';

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

  handleClose = () => {
    this.setState({ open: false });
    this.props.onClosed && this.props.onClosed();
  };
  handleSave = () => {
    const { settings } = this.state;
    if (!settings) return;
    const amount = util.getJValue(settings, 'user.betplayer.fixedReturns');
    if (!(+amount)) util.setJValue(settings, 'user.betplayer.fixedReturns', 2);


    Settings.saveUserSettings(settings);
    this.setState({ settings: { ...settings } });
    const { onSaved } = this.props;
    onSaved && onSaved();
  }

  handleChange = (path: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    const { settings } = this.state;
    if (!settings) return;

    let val: string | number | boolean = event.target.value;
    if (path === 'user.betplayer.fixedReturns') {
      val = +val;
      if (Number.isNaN(val)) val = 5;
      util.setJValue(settings, path, val);
    }
    else if (path === 'user.betplayer.roundDownDigit') {
      val = +val;
      if (Number.isNaN(val)) val = 5;
      util.setJValue(settings, path, val);
    }

    else if (path.includes('user.betplayer.credentials') && path.includes('active')) {
      val = (event.target as HTMLInputElement).checked;
      util.setJValue(settings, path, val);
    }
    else if (path.includes('user.betplayer.modes') || path.includes('user.betplayer.sports')) {
      const checked = (event.target as HTMLInputElement).checked;
      const options: string[] = util.getJValue(settings, path) || [];

      if (options.includes(val) && !checked) {
        options.splice(options.indexOf(val), 1);

      }
      else if (!options.includes(val) && checked) {
        options.push(val);
      }
      util.setJValue(settings, path, options);
    }
    else if (path.includes('user.betplayer.betOddsRange->0') || path.includes('user.betplayer.betOddsRange->1')) {
      val = +val;
      if (Number.isNaN(val) || val < 1) val = 1;
      util.setJValue(settings, path, val);
    }
    else if (path.includes('user.betplayer.rebetOddsFluctuation')) {
      const checkBox = event.target.type === 'checkbox';
      if (checkBox) {
        const checked = (event.target as HTMLInputElement).checked;
        checked ? util.setJValue(settings, path, 0.5) : util.setJValue(settings, path, undefined);
      }
      else {
        val = +val;
        if (val < 0 || Number.isNaN(val)) val = 0.5;
        util.setJValue(settings, path, val);
      }
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

    else {
      util.setJValue(settings, path, val);
    }

    this.setState({ settings: { ...settings } });
  }
  componentDidMount() {
    console.log('SettingDialog:componentDidMount');
    this.setState({ settings: Settings.getUserSettings() });
  }
  componentWillMount() {
    console.log('SettingDialog:componentWillMount');
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
          onClose={this.handleClose}>
          <DialogContent>
            <Paper style={{ marginTop: 15 }}>
              <ExpansionPanel defaultExpanded={true}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Bet</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <div style={{ width: '100%', flexDirection: 'column' }}>

                    <div style={{ flex: 1 }}>

                      <React.Fragment>
                        <Typography variant="caption">Mode</Typography>
                        {Common.PlayerBetModes.map((mode, index) => {
                          return (<FormControlLabel key={mode}
                            control={
                              <Checkbox
                                checked={(util.getJValue(settings, `user.betplayer.modes`) || []).includes(mode)}
                                onChange={this.handleChange(`user.betplayer.modes`)}
                                value={mode}
                              />
                            }
                            label={mode}
                          />);
                        })
                        }
                      </React.Fragment>

                    </div>
                    <div style={{ flex: 1, flexDirection: 'row', display: 'flex' }}>
                      <TextField style={{ flex: 4, marginRight: 30 }}
                        label="Fixed Returns"
                        type="number"
                        value={util.getJValue(settings, "user.betplayer.fixedReturns") as any}
                        onChange={this.handleChange(`user.betplayer.fixedReturns`)}
                        margin="normal"
                      />
                      <div style={{ flex: 6, marginRight: 30, flexDirection: 'row', display: 'flex' }}>
                        <TextField style={{ flex: 1, marginRight: 15 }}
                          label="Bet Odds Range From"
                          type="number"
                          inputProps={{ step: 0.1 }}
                          value={util.getJValue(settings, "user.betplayer.betOddsRange->0") as any}
                          onChange={this.handleChange(`user.betplayer.betOddsRange->0`)}
                          margin="normal"
                        />
                        <TextField style={{ flex: 1 }}
                          label="Bet Odds Range To"
                          type="number"
                          inputProps={{ step: 0.1 }}
                          value={util.getJValue(settings, "user.betplayer.betOddsRange->1") as any}
                          onChange={this.handleChange(`user.betplayer.betOddsRange->1`)}
                          margin="normal"
                        />
                      </div>


                    </div>

                    <div style={{ flex: 1, flexDirection: 'row', display: 'flex', alignItems: 'center' }}>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!util.getJValue(settings, `user.betplayer.rebetOddsFluctuation`)}
                            onChange={this.handleChange(`user.betplayer.rebetOddsFluctuation`)}
                            value="1"
                          />
                        }
                        label="Rebet Price Fluctuation (AH Only)"
                      />
                      {!!util.getJValue(settings, `user.betplayer.rebetOddsFluctuation`) &&
                        <TextField
                          type="number"
                          inputProps={{ step: 0.1 }}
                          value={util.getJValue(settings, "user.betplayer.rebetOddsFluctuation") as any}
                          onChange={this.handleChange(`user.betplayer.rebetOddsFluctuation`)}
                          margin="normal"
                        />
                      }
                    </div>
                    <div style={{ flex: 1 }}>

                      <React.Fragment>
                        <Typography variant="caption">Round Down Options</Typography>
                        {[1, 2, 5].map((digit, index) => {
                          return (<FormControlLabel key={'option_' + digit}
                            control={
                              <Checkbox
                                checked={+util.getJValue(settings, `user.betplayer.roundDownDigit`) === digit}
                                onChange={this.handleChange(`user.betplayer.roundDownDigit`)}
                                value={'' + digit}
                              />
                            }
                            label={digit === 1 ? 'Nothing' : digit}
                          />);
                        })
                        }
                      </React.Fragment>

                    </div>
                  </div>
                </ExpansionPanelDetails>
              </ExpansionPanel>
              <ExpansionPanel defaultExpanded={true}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Accounts</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', marginBottom: 15 }}>
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
                    {
                      appSettings['betplayer.bookmakers'].map((maker) => {

                        const credential = (settings['user.betplayer.credentials'][maker.name]) || { username: '', password: '', active: false };

                        return (<div key={maker.name} style={{ display: 'flex', alignItems: 'center' }}>
                          <div className={css(styles.fieldItem)}>
                            <Typography variant="subtitle1" style={{ width: 120 }}>{maker.name}</Typography>
                          </div>
                          <div className={css(styles.fieldItem)} style={{ flex: 1 }}>
                            <TextField fullWidth
                              label="User Name"
                              value={credential.username}
                              onChange={this.handleChange(`user.betplayer.credentials->${maker.name}->username`)}
                              margin="normal"
                            />
                          </div>
                          <div className={css(styles.fieldItem)} style={{ flex: 1 }}>
                            <TextField fullWidth
                              label="Password"
                              value={credential.password}
                              onChange={this.handleChange(`user.betplayer.credentials->${maker.name}->password`)}
                              margin="normal"
                            />
                          </div>

                          {appSettings['site.extensions'][maker.name] && (<FormControl style={{ width: 120, marginRight: 15 }}>
                            <InputLabel>Site Extension</InputLabel>
                            <NativeSelect
                              value={(settings["user.site.extensions"] || {})[maker.name]}
                              onChange={this.handleChange(`user.site.extensions->${maker.name}`)}
                              input={<Input name={maker.name} id={maker.name} />}>
                              {
                                appSettings['site.extensions'][maker.name].map(ex => {
                                  return (<option value={ex} key={ex}>{ex}</option>)
                                })
                              }
                            </NativeSelect>
                          </FormControl>
                          )
                          }
                          {settings['user.proxies.turnOn'] && (<FormControl style={{ width: 120, marginRight: 15 }}>
                            <InputLabel>Proxy Country</InputLabel>
                            < NativeSelect
                              value={(settings["user.proxies.countries"] || {})[maker.name] || 'NONE'}
                              onChange={this.handleChange(`user.proxies.countries->${maker.name}`)}
                              input={<Input name={maker.name + '-proxy'} id={maker.name + '-proxy'} />}
                            >
                              {
                                (['NONE', ...appSettings['common.proxy.countries']]).map(ex => {
                                  return (<option value={ex} key={ex}>{ex}</option>)
                                })
                              }
                            </NativeSelect>
                          </FormControl>
                          )
                          }
                          <div className={css(styles.fieldItem)} style={{ flex: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={util.getJValue(settings, `user.betplayer.credentials->${maker.name}->active`) || false}
                                  onChange={this.handleChange(`user.betplayer.credentials->${maker.name}->active`)}
                                  value="1"
                                />
                              }
                              label="Active"
                            />
                          </div>
                        </div>);
                      })
                    }
                  </div>
                </ExpansionPanelDetails>
              </ExpansionPanel>

              <ExpansionPanel defaultExpanded={true}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Sports</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <div style={{ display: 'flex', flex: 1 }}>
                    {
                      Common.PlayerSportList.map((sport) => {
                        return (<FormControlLabel key={sport}
                          control={
                            <Checkbox
                              checked={(util.getJValue(settings, `user.betplayer.sports`) || []).indexOf(sport) >= 0}
                              onChange={this.handleChange(`user.betplayer.sports`)}
                              value={sport}
                            />
                          }
                          label={sport}
                        />);
                      })
                    }
                  </div>
                </ExpansionPanelDetails>
              </ExpansionPanel>
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

const styles = StyleSheet.create({
  fieldItem: { marginRight: '30px' }
});
export default SettingDialog;

