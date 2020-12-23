import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from "react-router-dom";
import { Settings} from './services';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import './index.css';
import App from './App';

const theme = createMuiTheme({
  props: {
    MuiButtonBase: {
      disableRipple: true,
    },
  },
  typography: {
    useNextVariants: true,
  }
});

theme.transitions.create = (props, options) => "none";
ReactDOM.render(
  <HashRouter>
    <MuiThemeProvider theme={theme}>
      <App />
    </MuiThemeProvider>
  </HashRouter>,
  document.getElementById('root')
);

const debugOptions = Settings.getAppSettings();
if (!debugOptions['common.debug']) {
  console.log = () => { };
  console.warn = () => { };
  console.error = () => { };
  console.debug = () => { };
}


import('./unhandleError');