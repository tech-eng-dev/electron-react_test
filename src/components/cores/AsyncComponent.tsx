import React, { Component } from "react";

export default function asyncComponent(importComponent: () => Promise<{ default: any }>) {
  class AsyncComponent extends Component<object, { component?: typeof Component }> {
    private unmount: boolean = false;
    constructor(props: any) {
      super(props);

      this.state = {
        component: undefined
      };
    }

    async componentDidMount() {
      this.unmount = false;
      const { default: component } = await importComponent();


      (!this.unmount) && this.setState({
        component: component
      });
    }
    componentWillUnmount() {
      this.unmount = true;
    }

    render() {
      const C = this.state.component;

      return C ? <C {...this.props} /> : null;
    }
  }
  return AsyncComponent;
}