import React, { useCallback, useEffect, useRef, useState } from "react";
import IERC721 from "./contracts/NFT721.sol/NFT721.json";
import IERC20 from "./contracts/ERC20.sol/Token.json";
import MarketABI from "./contracts/Marketplace.sol/Marketplace.json";
import configData from "./config.json";
import Web3 from "web3";
import testImg from "./assets/imgs/Rectangle 23870.jpg";
import { ImageUpload } from "react-ipfs-uploader";
import "./nft.scss";
import Header from "./components/header/header";
import NftList from "./components/header/nftList/nftList";
import { create } from "ipfs-http-client";
import {
  Route,
  Switch,
  useRouteMatch,
  useLocation,
  BrowserRouter as Router,
} from "react-router-dom";
import Market from "./marketplace";

const NFT721 = () => {
  const [account, setAccount] = useState({ address: null, isConnect: false });
  const [myNFT, setMyNFT] = useState([]);
  const [myTokenBalance, setMyBalance] = useState({ myTokenBalance: 0 });
  const [images, setImages] = React.useState([]);
  // const { url, path } = useRouteMatch()
  // const { pathname } = useLocation()
  const [nftContract, setNFTContract] = useState({
    nftContract: null,
    address: false,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await loadDataBlockchain();
    }
  }, []);
  const loadDataBlockchain = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      const { eth, utils } = window.web3;
      let networkId = await window.ethereum.request({ method: "eth_chainId" });
      networkId = await utils.hexToNumberString(networkId);

      if (
        networkId == configData.networkId &&
        localStorage.getItem("account")
      ) {
        const address = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount({ address, isConnect: true });
        const nftContract = new eth.Contract(
          IERC721.abi,
          configData.NFT721_Address
        );
        const tokenContract = new eth.Contract(
          IERC20.abi,
          configData.ERC20_Address
        );
        const marketContract = new eth.Contract(
          MarketABI.abi,
          configData.Marketplace_Address
        );
        setNFTContract({ nftContract, address: configData.NFT721_Address });
        var myBalance = await tokenContract.methods
          .balanceOf(address[0])
          .call();
        myBalance = window.web3.utils.fromWei(String(myBalance));
        setMyBalance({ myTokenBalance: myBalance });

        var totalNFT = await nftContract.methods.getTotalNFT().call();
        var getNFT = [];
        for (let i = 0; i < totalNFT; i++) {
          if (
            (await nftContract.methods.ownerOf(i).call()).toLowerCase() ==
            address[0]
          ) {
            var uri = await nftContract.methods.tokenURI(i).call();
            const response = await fetch(uri);
            const json = await response.json();
            getNFT.push(json);
          }
        }

        setMyNFT({ myNFT: getNFT });
      }
    }
  };

  const handleCreateNFT = async (uri) => {
    if (uri) {
      const txid = await nftContract.nftContract.methods
        .createNFT(uri)
        .send({ from: String(account.address) })
        .on("confirmation", () => {
          window.location.reload();
        });
      var myNFT = await nftContract.nftContract.methods
        .getMyNFTs()
        .call({ from: String(account.address) });
      setMyNFT({ myNFT });
    }
  };

  const client = create(new URL("https://ipfs.infura.io:5001/api/v0"));

  const renderJson = async () => {
    var nftName = document.getElementById("nft-name").value;
    var nftDescription = document.getElementById("nft-description").value;
    var jsonObj = {
      name: nftName,
      description: nftDescription,
      image: images,
    };

    var json = JSON.stringify(jsonObj);
    var cid = await client.add(json);
    var httpPath = "https://ipfs.infura.io/ipfs/" + cid.path;
    handleCreateNFT(httpPath);
  };

  return (
    <div className="cn-nft-container">
      <Header
        loadDataBlockchain={loadDataBlockchain}
        account={account}
        setAccount={setAccount}
        myBalance={myTokenBalance.myTokenBalance}
      />
      <Switch>
        <Route path={"/market"}>
          <Market myBalance={myTokenBalance.myTokenBalance} />
        </Route>
        <Route exact path={"/"}>
          <main className="cn-nft-main">
            <div className="page-title ">
              Create new NFT
              <span>My balance: {myTokenBalance.myTokenBalance}</span>
            </div>
            <div className="main-content">
              <div className="section-title">Upload File*</div>
              <ImageUpload setUrl={setImages}></ImageUpload>
              <div className="section-title">Name*</div>
              <div className="cn-nft-name">
                <input id="nft-name" type="text" placeholder="Item Name" />
              </div>
              <div className="section-title">Description</div>
              <div className="cn-nft-description">
                <textarea
                  name=""
                  id="nft-description"
                  rows="5"
                  placeholder="Decription of your item"
                ></textarea>
              </div>
            </div>
            <button
              className="cn-nft-create-list"
              onClick={() => {
                var nameField = document.getElementById("nft-name").value;
                console.log();
                if (!nameField) {
                  window.alert("Name field required");
                  return;
                }
                if (typeof images != "string") {
                  window.alert("Image must uploaded");
                  return;
                }
                renderJson();
              }}
            >
              Create & List NFT
            </button>
            {account?.isConnect ? (
              <div>
                <div className="page-title ">My list NFT</div>
                <NftList items={myNFT.myNFT} myNFT={true} />
              </div>
            ) : (
              ""
            )}
          </main>
        </Route>
      </Switch>
    </div>
  );
};

export default NFT721;
