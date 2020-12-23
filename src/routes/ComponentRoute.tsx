import React from "react";
import { Route } from "react-router-dom";

export default ({ component: C, props: cProps, ...rest }
  : { component: typeof React.Component, path?: string, props: any, [key: string]: any }) =>
  <Route {...rest} render={props => <C {...props} {...cProps} />} />;