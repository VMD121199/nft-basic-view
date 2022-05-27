import "./App.css";
import React, { Fragment } from "react";

import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

import NFT from "./nft";
import Market from "./marketplace";
function App() {
  return (
    <Router>
      <NFT />
    </Router>
  );
}

export default App;
