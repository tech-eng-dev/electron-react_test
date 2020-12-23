import React from "react";
import { StyleSheet, css } from "aphrodite";

export default () =>
  <div className={css(styles.NotFound)}>
    <h1>Hello, page not found!</h1>
  </div>;

const styles = StyleSheet.create({
  NotFound: {
    display: 'flex',
    justifyContent: 'center',
    color: 'red'
  }
});