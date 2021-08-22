import React, { Component } from 'react';
import AuthenticatedRouter from './AuthenticatedRouter';
import NotAuthenticatedRouter from './NotAuthenticatedRouter'
import CheckToken from './CheckToken'
import PropTypes from 'prop-types';

class AppNavigation extends Component {

  render() {
    return (
    <CheckToken token={this.props.token} />

    );
  }
}

export default AppNavigation;
