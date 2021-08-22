import React, { Component } from 'react';
import PropTypes from 'prop-types';
class NotAuthenticated extends Component{
  render(){
    const {token} = this.props;
    return(
      <h1>notAuthenticated</h1>
    );
  }
}

NotAuthenticated.PropTypes = {
  token: PropTypes.String
}

export default NotAuthenticated;
