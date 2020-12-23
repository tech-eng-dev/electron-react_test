import React, { Component } from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import IconButton from '@material-ui/core/IconButton';
import FormHelperText from '@material-ui/core/FormHelperText';


import Lock from '@material-ui/icons/Lock';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { Settings } from '../services';
import { auth } from '../actions';
import { StyleSheet, css } from 'aphrodite';

import logo from '../assets/logo.png';
import { AppUser, Nullable } from '../models';
import { AppDispatch } from '../reducers/store';

export interface Props {

  login: (uname: string, passwrod: string, anyValue?: object) => Promise<{ user?: AppUser, error?: string }>
  onDecrement: () => void;
}
interface States {
  userName: string,
  key: string,
  errors?: { [key: string]: string },
  appName?: string
}
class LoginContainer extends Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = {
      userName: '',
      key: '',
      errors: undefined,
      appName: undefined
    };
  }
  componentDidMount() {
    const { 'common.app': app } = Settings.getAppSettings();
    if (app === 'scrapper') {
      this.setState({ appName: 'Scrapper'});
    }
    else if (app === 'betplayer') {
      this.setState({ appName: 'Bet player' });

    }
    else if (app === 'admin') {
      this.setState({ appName: 'Administrator'});
    }

    const user = auth.getPersistentUser();
    if (user) {
      this.setState({ userName: user.username, key: user.key });
    }

    //the code will be removed automatically after build (dead code elimination)
    if (process.env.NODE_ENV === 'development') {
      if (app === 'admin') {
        this.setState({ userName: '', key: '' });
      }
      else if (app === 'scrapper') {
        this.setState({ userName: '', key: '' });
      }
    }
  }

  login = async () => {
    const { login } = this.props;
    const { userName, key } = this.state;
    let valid = this.validInput();
    if (!valid) return;

    const { "betplayer.oddsPanel": oddsPanel } = Settings.getAppSettings();
    const anyValue = { odds_panel: oddsPanel };

    const result = await login(userName, key, anyValue);
    if (result.error || !result.user) {
      this.setState({ errors: { loginFailure: result.error || 'error,user is null' } });
    }
  }
  validInput() {
    let errors: Nullable<{ [key: string]: string }> = undefined;
    if (!this.state.userName) {
      errors = {};
      errors.userName = 'User Name is required';
    }


    if (!this.state.key) {
      errors = errors || {};
      errors.key = 'key is required';
    }

    this.setState({ errors: errors });

    return !errors;
  }
  render() {
    const { errors, userName, appName, key } = this.state;
    return (
      <div className={css(styles.loginContainer)}>
        <Grid justify='center' spacing={0} container alignContent='center'>
          <Grid item sm={4} xs={6}>
            <Card>
              <CardContent>
                <Grid container spacing={24} direction='column' justify='flex-start' alignItems='stretch'>
                  <Grid item style={{ alignSelf: 'center' }}>
                    <div className='logo'>
                      <img src={logo} className={css(styles.loginLogo)} alt='logo' />
                    </div>
                  </Grid>
                  <Grid item style={{ alignSelf: 'center' }}>
                    <Typography component='h5' variant='h5'>{appName}</Typography>
                  </Grid>
                  <Grid item>
                    <FormControl fullWidth
                      error={errors && errors['userName'] != null}>
                      <InputLabel htmlFor="userName">User Name</InputLabel>
                      <Input
                        id="userName"
                        value={userName}
                        onChange={(e) => { this.setState({ userName: e.target.value }); }}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton tabIndex={1}><AccountCircle /></IconButton>
                          </InputAdornment>}
                      />
                      {errors && errors['userName'] &&
                        <FormHelperText>{errors['userName']}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item>
                    <FormControl fullWidth
                      error={errors && errors['key'] != null}>
                      <InputLabel htmlFor="key">Key</InputLabel>
                      <Input
                        type='text'
                        id="key"
                        value={key}
                        onChange={(e) => { this.setState({ key: e.target.value }); }}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton tabIndex={1}><Lock /></IconButton>
                          </InputAdornment>
                        }
                      />
                      {errors && errors['key'] && <FormHelperText>{errors['key']}</FormHelperText>}

                    </FormControl>
                  </Grid>

                  <Grid item style={{ alignSelf: 'center' }}>
                    <Button variant={'contained'} color="primary" onClick={this.login}>Login</Button>
                  </Grid>
                  {errors && errors['loginFailure'] &&
                    < Grid item style={{ alignSelf: 'center' }}>
                      <Typography component='h1' variant='body1' color="error">{errors['loginFailure']}</Typography>
                    </Grid>
                  }
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid >
      </div >
    )
  }
}

const mapDispatchToProps = (dispatch: AppDispatch) => (
  {
    login: (username: string, key: string, anyValue?: object) => dispatch(auth.login(username, key, anyValue)),
    logout: () => dispatch(auth.logout())
  }
);

export default connect(
  null, mapDispatchToProps
)(LoginContainer);

const loginLogoSpin = {
  'from': { transform: 'rotate(0deg)' },
  'to': { transform: 'rotate(360deg)' }
};

const styles = StyleSheet.create({
  loginContainer:
  {
    marginTop: '30px'
  },
  loginLogo: {
    width: '120px',
    height: '120px',
    animationName: [loginLogoSpin],
    animationDuration: '20s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear'
  }

});