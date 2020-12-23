import React, { ChangeEvent, PureComponent } from 'react';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { css, StyleSheet } from 'aphrodite';
import { KOServerSettings } from '../../models';
import { util, Common } from '../../services';

export interface Props {
    settings: KOServerSettings;
    onSave: (s: KOServerSettings) => void
}

interface States {
    settings: KOServerSettings;
    selectedMode: 'prematch' | 'live'
}

class ServerSettings extends PureComponent<Props, States> {
    state: States = {
        settings: JSON.parse(JSON.stringify(this.props.settings)),
        selectedMode: 'prematch'
    };

    componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {
        if (this.props.settings !== prevProps.settings) {
            this.setState({ settings: JSON.parse(JSON.stringify(this.props.settings)) });
        }
    }

    componentDidMount() {

    }

    handleSave = () => {
        const { settings } = this.state;

        if (settings.clientScrabCapacity === 0) settings.clientScrabCapacity = 2;
        if (!settings.modes) settings.modes = ['prematch'];

        if (settings.prematch.prematchBeforeInM === 0) settings.prematch.prematchBeforeInM = 10;
        if (settings.prematch.horsePrematchBeforeInM === 0) settings.prematch.horsePrematchBeforeInM = 10;

        this.setState({ settings: { ...settings } });
        const { onSave } = this.props;
        onSave && onSave(settings);
    };

    handleChange = (path: string) => (event: ChangeEvent<HTMLInputElement>) => {

        console.log(path);
        const { settings } = this.state;

        let val: string | number = (event.target as HTMLInputElement).value;
        if (path === 'clientScrabCapacity') {
            val = +val;
            if (Number.isNaN(val) || val > 8) val = 2;
            settings[path] = val;
        }
        else if (path === 'modes') {
            const checked = event.target.checked;
            const wrapVal = val as 'live' | 'prematch';
            const options = settings[path] || [];
            const index = options.indexOf(wrapVal);
            if (checked && index === -1) {
                options.push(wrapVal);
            }
            else if (!checked && index >= 0) {
                options.splice(index, 1);
            }
            settings[path] = [...options];
        }

        if (path.endsWith('externalBookmakers') || path.endsWith('sports') || path.endsWith('bookmakers')) {
            let allOptions: any[] = [];
           
            if (path.endsWith('externalBookmakers')) {
                allOptions = Common.ExternalBookmakerList;
            }
            else if (path.endsWith('sports')) {
                allOptions = Common.SportList;
            }
            else if (path.endsWith('bookmakers')) {
                allOptions = Common.BookmakerList;
            }
            const checked = event.target.checked;

            const options: any[] = util.getJValue(settings, path) || [];
            const index = options.indexOf(val);
            if (checked && index === -1) {
                options.push(val);
            }
            else if (!checked && index >= 0) {
                options.splice(index, 1);
            }
            const optionLen = options.length;
            for (let index = optionLen - 1; index >= 0; index--) {
                const curOption = options[index];
                if (allOptions.indexOf(curOption) === -1) {
                    options.splice(index, 1);
                }
            }
            util.setJValue(settings, path, [...options]);

        }

        else if (path.endsWith('prematchBeforeInM') || path.endsWith('horsePrematchBeforeInM')) {
            val = +val;
            if (Number.isNaN(val)) val = 10;
            util.setJValue(settings, path, val);
        }
        else if (path.endsWith('betfairSelectionLiquidity')) {
            val = +val;
            if (Number.isNaN(val)) val = 20;
            util.setJValue(settings, path, val);
        }


        console.log({ val, settings });
        this.setState({ settings: { ...settings } });
    }
    onTabChanged = (event: any, value: number) => {
        this.setState({ selectedMode: value === 0 ? 'prematch' : 'live' });
    }
    render() {
        const { settings, selectedMode } = this.state;

        if (settings == null) return null;
        const { modes, clientScrabCapacity, live, prematch } = settings;
        const modeSettings = selectedMode === 'live' ? live : prematch;

        return (
            <Paper className={css(styles.container)}>

                <div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', alignItems: 'center', margin: '15px 0' }}>

                        <div style={{ marginRight: 30 }}>
                            {
                                Common.BetModes.map(mode => {
                                    return (
                                        <FormControlLabel key={mode}
                                            control={
                                                <Checkbox
                                                    checked={modes.indexOf(mode) >= 0}
                                                    onChange={this.handleChange(`modes`)}
                                                    value={mode}
                                                />
                                            }
                                            label={mode}
                                        />
                                    );
                                })
                            }
                        </div>
                        <div>
                            <TextField style={{ width: 250 }}
                                label="Scrab Number Per Client"
                                value={clientScrabCapacity}
                                onChange={this.handleChange(`clientScrabCapacity`)}
                                margin="normal"
                                type="number"
                            />

                        </div>
                    </div>
                </div>
                <Tabs classes={{ root: css(styles.tabsRoot) }}
                    value={selectedMode === 'prematch' ? 0 : 1}
                    onChange={this.onTabChanged}>
                    {['prematch', 'live']
                        .map((name, index) => {
                            return (<Tab key={name}
                                classes={{ root: css(styles.tabRoot), label: css(styles.tabLabel) }}
                                label={name} />);
                        })}
                </Tabs>
                <div>

                    <div style={{ flex: 1, overflow: 'auto', paddingLeft: 15, paddingRight: 15 }}>
                        <div style={{ margin: '15px 0' }}><Typography>External Bookmakers</Typography></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {
                                Common.ExternalBookmakerList.map(b => {
                                    return (
                                        <FormControlLabel key={b}
                                            control={
                                                <Checkbox
                                                    checked={modeSettings.externalBookmakers.indexOf(b) >= 0}
                                                    onChange={this.handleChange(`${selectedMode}->externalBookmakers`)}
                                                    value={b}
                                                />
                                            }
                                            label={b}
                                        />
                                    );
                                })
                            }
                        </div>

                        <div style={{ margin: '15px 0' }}><Typography>Bookmakers</Typography></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {
                                Common.BookmakerList.map(b => {
                                    return (
                                        <FormControlLabel key={b}
                                            control={
                                                <Checkbox
                                                    checked={modeSettings.bookmakers.indexOf(b) >= 0}
                                                    onChange={this.handleChange(`${selectedMode}->bookmakers`)}
                                                    value={b}
                                                />
                                            }
                                            label={b}
                                        />
                                    );
                                })
                            }
                        </div>

                        <div style={{ margin: '15px 0' }}><Typography>Sports</Typography></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {
                                Common.SportList.map(b => {
                                    return (
                                        <FormControlLabel key={b}
                                            control={
                                                <Checkbox
                                                    checked={modeSettings.sports.indexOf(b) >= 0}
                                                    onChange={this.handleChange(`${selectedMode}->sports`)}
                                                    value={b}
                                                />
                                            }
                                            label={b}
                                        />
                                    );
                                })
                            }
                        </div>

                    </div>

                    <div style={{ flex: 1, overflow: 'auto', paddingLeft: 15, paddingRight: 15 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                            <div style={{ flex: 1, marginRight: 30 }}>
                                <TextField style={{ width: 250 }}
                                    label="Betfair Selection Liquility"
                                    value={modeSettings.betfairSelectionLiquidity}
                                    onChange={this.handleChange(`${selectedMode}->betfairSelectionLiquidity`)}
                                    margin="normal"
                                    type="number"
                                />
                            </div>
                        </div>
                    </div>

                    {selectedMode === 'prematch' && (
                        <div style={{ flex: 1, overflow: 'auto', paddingLeft: 15, paddingRight: 15 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                                <div style={{ marginRight: 30 }}>
                                    <TextField style={{ width: 250 }}
                                        label="Scrab Before Start time:(Prematch)"
                                        value={settings['prematch'].prematchBeforeInM}
                                        onChange={this.handleChange(`${selectedMode}->prematchBeforeInM`)}
                                        margin="normal"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <TextField style={{ width: 450 }}
                                        label="[Horse Race / GreyHound] Scrab Before Start time:(Prematch)"
                                        value={settings['prematch'].horsePrematchBeforeInM}
                                        onChange={this.handleChange(`${selectedMode}->horsePrematchBeforeInM`)}
                                        margin="normal"
                                        type="number"
                                    />
                                </div>

                            </div>
                        </div>)
                    }
                </div>

                <div style={{ alignSelf: 'center', margin: 15 }}>
                    <Button onClick={this.handleSave} variant="contained" color="primary">Save</Button>
                </div>

            </Paper >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1, display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        overflow: 'auto',
        padding: '0 15px'
    },
    tabsRoot:
    {
        margin: '15px 0'
    },
    tabRoot:
    {
        fontSize: '0.65rem'
    },
    tabLabel: {
        fontSize: '0.75rem'
    },
    fieldItem: { marginRight: '30px' }
});
export default ServerSettings;

