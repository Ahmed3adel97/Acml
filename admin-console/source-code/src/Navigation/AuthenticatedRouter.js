import React, { Component } from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Authenticated from '../containers/Authenticated/Authenticated'

class AuthenticatedRouter extends Component {
  render() {
    return(
      <BrowserRouter>
        <Switch>
          <Route path="/User" component={Authenticated}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default AuthenticatedRouter;
