import React, { Component } from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';import NotAuthenticated from '../containers/notAuthenticated/notAuthenticated'

class NotAuthenticatedRouter extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/notAuthenticated" component={NotAuthenticated}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default NotAuthenticatedRouter;
