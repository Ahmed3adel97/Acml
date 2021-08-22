import React, { Component } from 'react';
import AuthenticatedRouter from './AuthenticatedRouter';
import NotAuthenticatedRouter from './NotAuthenticatedRouter'

class CheckToken extends Component{

  render(){
    const{token} = this.props;
    if (this.props.token) {
      return(
        <AuthenticatedRouter />
      )
    }
    else {
      return(
      < NotAuthenticatedRouter />
      )
    }
  }
}
export default CheckToken;
