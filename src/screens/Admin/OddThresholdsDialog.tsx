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
import { OddsOptions } from '../../models';

export interface Props {
  onClosed: () => void;
  onSave: (newThresholds: { live: OddsOptions, prematch: OddsOptions }) => void;
  title: string;
  subhead: string;
  liveOddsThresholds: OddsOptions,
  premtachOddsThresholds: OddsOptions
}
interface States {
  open: boolean;
  selectedMode: 'prematch' | 'live',
  liveOddsThresholds: OddsOptions,
  premtachOddsThresholds: OddsOptions
};

export default class OddsThresholdsDialog extends React.PureComponent<Props, States> {
  state: States = {
    open: true,
    selectedMode: 'prematch',
    premtachOddsThresholds: JSON.parse(JSON.stringify(this.props.premtachOddsThresholds)),
    liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds))
  };

  componentDidMount() {
    console.log('SettingDialog:componentDidMount');
    this.setState({
      premtachOddsThresholds: JSON.parse(JSON.stringify(this.props.premtachOddsThresholds)),
      liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds))
    });
  }
  componentWillUnmount() {
    console.log('SettingDialog:componentWillUnmount');
  }
  componentDidUpdate(prevProps: Props, prevState: States, snapshot: any) {

    if (this.props.premtachOddsThresholds !== prevProps.premtachOddsThresholds) {
      this.setState({ premtachOddsThresholds: JSON.parse(JSON.stringify(this.props.premtachOddsThresholds)) });
    }
    if (this.props.liveOddsThresholds !== prevProps.liveOddsThresholds) {
      this.setState({ liveOddsThresholds: JSON.parse(JSON.stringify(this.props.liveOddsThresholds)) });
    }
  }

  handleSave = () => {
    const { liveOddsThresholds, premtachOddsThresholds: prematchOddsThresholds } = this.state;
    const { onSave } = this.props;
    onSave && onSave({ live: liveOddsThresholds, prematch: prematchOddsThresholds });
  }


  handleClose = () => {
    this.setState({ open: false });
    this.props.onClosed && this.props.onClosed();
  };

  handleChange = (mode: 'live' | 'prematch', path: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

    console.log('handlechange', path, event.target.value);
    const { premtachOddsThresholds, liveOddsThresholds } = this.state;
    const oddsThresholds = mode === 'prematch' ? premtachOddsThresholds : liveOddsThresholds;
    let val: string | number | boolean = +event.target.value;

    if (Number.isNaN(val)) {
      val = 10;
    }
    util.setJValue(oddsThresholds, path, val);

    if (mode === 'prematch') {

      this.setState({ premtachOddsThresholds: { ...oddsThresholds } });
    }
    else {
      this.setState({ liveOddsThresholds: { ...oddsThresholds } });
    }
  }
  onTabChanged = (event: any, value: number) => {
    this.setState({ selectedMode: value === 0 ? 'prematch' : 'live' });
  }
  render() {

    const { premtachOddsThresholds, liveOddsThresholds, selectedMode } = this.state;
    console.log('render', selectedMode);

    const { title, subhead } = this.props;
    if (premtachOddsThresholds == null || liveOddsThresholds == null) return null;

    const oddsThresholds = selectedMode === 'prematch' ? premtachOddsThresholds : liveOddsThresholds;
    return (
      <div>
        <Dialog
          maxWidth='md'
          fullWidth={true}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description">
          <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
          <DialogContent>

            <Typography>{subhead}</Typography>
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
            <div style={{ display: 'flex', flex: '1', paddingLeft: 15, paddingRight: 15, flexWrap: 'wrap' }}>
              {
                Object.keys(oddsThresholds).map((odds, index) => {
                  return (<div key={odds || index} className={css(styles.fieldItem)}>
                    <TextField
                      fullWidth
                      type="number"
                      label={odds}
                      value={oddsThresholds[odds]}
                      onChange={this.handleChange(selectedMode, `${odds}`)}
                      margin="normal"
                    />
                  </div>);
                })
              }
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


