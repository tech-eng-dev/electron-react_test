import React from "react";
import { iohttp } from '../../services';
export default class ErrorBoundary extends React.Component {
    state = { hasError: false };


    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
        iohttp.post('/log/bet', true, { log: { error: error.message || error, info } });
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }
        return this.props.children;
    }
}