
import React from "react";
import { Route, Switch } from "react-router-dom";
import {
    AsyncComponent
} from "../components";
import UnauthenticatedRoute from './UnauthenticatedRoute';
import AuthenticatedRoute from './AuthenticatedRoute';

const LoginScreen = AsyncComponent(() => import("../screens/Login"));
const HomeScreen = AsyncComponent(() => import("../screens/Home"));
const GrabberTestScreen = AsyncComponent(() => import("../screens/Tests/ScriptTest"));
const NotFoundScreen = AsyncComponent(() => import('../screens/PageNoFound'));
export default ({ childProps }: { childProps: any }) => (<Switch>
    <UnauthenticatedRoute path="/login" exact component={LoginScreen} props={childProps} />
    <UnauthenticatedRoute path="/test/grabber" exact component={GrabberTestScreen} props={childProps} />
    <AuthenticatedRoute path="/" component={HomeScreen} props={childProps} />
    <Route component={NotFoundScreen} />
</Switch>);