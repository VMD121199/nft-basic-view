
import "./App.css";
import React, { Fragment } from "react";

import { Route, BrowserRouter,Routes } from "react-router-dom";

import NFT from "./nft";
function App() {
    return (
      <BrowserRouter>
        <Fragment>
          <Routes>
            <Route path="/" element={<NFT />} />
          </Routes>
        </Fragment>
      </BrowserRouter>
    );
}

export default App;
