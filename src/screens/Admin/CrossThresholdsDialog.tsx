import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import DialogContent from '@material-ui/core/DialogContent';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { util } from '../../services';
import { css, StyleSheet } from 'aphrodite';

export interface Props {
  onClosed: () => void;
  onSave: (newThresholds: { live: { betfair: number, pinnacle: number }, prematch: { betfair: number, pinnacle: number } }) => void;
  liveOddsThresholds: { betfair: number, pinnacle: number }
  prematchOddsThreholds: { betfair: number, pinnacle: number }
}
interface States {
  open: boolean;
  selectedMode: 'live' | 'prematch',
  liveOddsThresholds: { betfair: number, pinnacle: number }
  prematchOddsThreholds: { betfair: number, pinnacle: number }
};

export default class CrossThesholdsDialog extends React.PureComponent<Props, States> {
  state: States = {
    open: true,
    selectedMode: 'prematch',
    liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds)),
    prematchOddsThreholds: JSON.parse(JSON.stringify(this.props.prematchOddsThreholds))
  };

  componentDidMount() {
    console.log('SettingDialog:componentDidMount');
    this.setState({
      liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds)),
      prematchOddsThreholds: JSON.parse(JSON.stringify(this.props.prematchOddsThreholds))
    });
  }
  componentWillUnmount() {
    console.log('SettingDialog:componentWillUnmount');
  }
  componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {

    if (this.props.liveOddsThresholds !== prevProps.liveOddsThresholds) {

      this.setState({ liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds)) });
    }
    if (this.props.prematchOddsThreholds !== prevProps.prematchOddsThreholds) {

      this.setState({ prematchOddsThreholds: JSON.parse(JSON.stringify(this.props.prematchOddsThreholds)) });
    }
  }


  handleSave = () => {
    const { liveOddsThresholds, prematchOddsThreholds } = this.state;
    const { onSave } = this.props;
    onSave && onSave({ live: liveOddsThresholds, prematch: prematchOddsThreholds });
  }


  handleClose = () => {
    this.setState({ open: false });
    this.props.onClosed && this.props.onClosed();
  };

  handleChange = (mode: 'prematch' | 'live', path: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    console.log('handlechange', path, event.target.value);
    const { prematchOddsThreholds, liveOddsThresholds } = this.state;
    const oddsThresholds = mode === 'prematch' ? prematchOddsThreholds : liveOddsThresholds;

    let val: string | number | boolean = +event.target.value;

    if (Number.isNaN(val)) {
      val = 10;
    }
    util.setJValue(oddsThresholds, path, val);

    if (mode === 'prematch') {

      this.setState({ prematchOddsThreholds: { ...oddsThresholds } });
    }
    else {
      this.setState({ liveOddsThresholds: { ...oddsThresholds } });
    }
  }
  onTabChanged = (event: any, value: number) => {
    this.setState({ selectedMode: value === 0 ? 'prematch' : 'live' });
  }
  render() {
    const { liveOddsThresholds, prematchOddsThreholds, selectedMode } = this.state;
    console.log('render', selectedMode);
    if (liveOddsThresholds == null || prematchOddsThreholds == null) return null;

    const oddsThresholds = selectedMode === 'prematch' ? prematchOddsThreholds : liveOddsThresholds;
    return (
      <div>
        <Dialog
          maxWidth='md'
          fullWidth={true}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">{`Cross Thresholds Settings`} </DialogTitle>
          <DialogContent>

            <Typography>{`Odds Thresholds (%) = (1 - (1/bookmaker odds + 1/betfair or pinnacle odds)) * 100`}</Typography>
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
              <TextField
                fullWidth
                type="number"
                label={"Betfair Arbitrage %"}
                value={'' + oddsThresholds['betfair']}
                onChange={this.handleChange(selectedMode, `betfair`)}
                margin="normal"
              />
            </div>
            <div>
              <TextField
                fullWidth
                type="number"
                label={"pinnacle Arbitrage %"}
                value={'' + oddsThresholds['pinnacle']}
                onChange={this.handleChange(selectedMode, `pinnacle`)}
                margin="normal"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <div style={{ margin: '15px' }}>
              <Button onClick={this.handleSave} variant="contained" color="primary" style={{ marginRight: 15 }}>
                Save
            </Button>
              <Button onClick={this.handleClose} color="primary">
                Close
            </Button>
            </div>
          </DialogActions>
        </Dialog>
      </div >
    );
  }
}
const styles = StyleSheet.create({
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
  fieldItem: { marginRight: '30px', width: 80 }
});



