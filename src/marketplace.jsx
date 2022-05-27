import React, { useCallback, useEffect, useRef, useState } from "react";
import "./market.scss";
import testImg from "./assets/imgs/Rectangle 23870.jpg";
import Header from "./components/header/header";
import NftList from "./components/header/nftList/nftList";
import IERC721 from "./contracts/NFT721.sol/NFT721.json";
import configData from "./config.json";
import Web3 from "web3";
import MarketABI from "./contracts/Marketplace.sol/Marketplace.json";
import IERC20 from "./contracts/ERC20.sol/Token.json";
const Market = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState({ address: null, isConnect: false });
  const [myNFT, setMyNFT] = useState({ myNFT: [] });
  const [myTokenBalance, setMyBalance] = useState({ myBalance: 0 });
  const [marketItems, setMarketItems] = useState({ marketItems: [] });

  const [nftContract, setNFTContract] = useState({
    nftContract: null,
    address: false,
  });
  const [tokenContract, settokenContract] = useState({
    tokenContract: null,
    address: false,
  });
  const [marketContract, setMarketContract] = useState({
    marketContract: null,
    address: false,
  });
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
        settokenContract({ tokenContract, address: configData.ERC20_Address });
        setMarketContract({
          marketContract,
          address: configData.Marketplace_Address,
        });
        var myBalance = await tokenContract.methods
          .balanceOf(address[0])
          .call();
        myBalance = window.web3.utils.fromWei(String(myBalance));
        setMyBalance({ myBalance });
        var data = [];
        var marketItems = await marketContract.methods.getMarketItems().call();
        marketItems
          ?.filter((item) => item.sold == false && item.isCanceled == false)
          .map(async (item) => {
            var uri = await nftContract.methods.tokenURI(item.tokenId).call();
            const response = await fetch(uri);
            const json = await response.json();
            data.push({
              ...item,
              ...json,
            });
          });
        setMarketItems({ marketItems: data });

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
            getNFT.push({ i, json });
          }
        }
        console.log(getNFT);
        setMyNFT({ myNFT: getNFT });
      }
    }
  };

  const handleCreateMarket = async (nftAdress, tokenId, price) => {
    if (nftAdress && tokenId && price) {
      price = window.web3.utils.toWei(String(price), "ether");
      await nftContract.nftContract.methods
        .approve(marketContract.address, tokenId)
        .send({ from: String(account.address) });
      const txid = await marketContract.marketContract.methods
        .createMarketItem(nftAdress, tokenId, price)
        .send({ from: String(account.address) })
        .on("confirmation", () => {
          window.location.reload();
        });
    }
  };

  const handleCancelMarket = async (itemId) => {
    if (itemId) {
      await marketContract.marketContract.methods
        .cancelSell(itemId)
        .send({ from: String(account.address) })
        .on("confirmation", () => {
          window.location.reload();
        });
    }
  };
  const handleBuy = async (itemId) => {
    if (itemId) {
      const data = await marketContract.marketContract.methods
        .marketItem(itemId)
        .call();
      var price = data.price;
      if (
        (await tokenContract.tokenContract.methods
          .allowance(account.address[0], marketContract.address)
          .call()) < price
      ) {
        let max_int256 =
          "115792089237316195423570985008687907853269984665640564039457584007913129639935";
        await tokenContract.tokenContract.methods
          .approve(marketContract.address, max_int256)
          .send({ from: String(account.address[0]) });
      }
      await marketContract.marketContract.methods
        .buyItem(itemId)
        .send({
          from: String(account.address),
        })
        .on("confirmation", () => {
          window.location.reload();
        });
    }
  };
  return (
    <div className="cn-market-container">
      <Header
        loadDataBlockchain={loadDataBlockchain}
        account={account}
        setAccount={setAccount}
        myBalance={myTokenBalance.myBalance}
      />
      <main className="cn-market-main">
        <div className="cn-title">
          My NFT
          <span>My balance: {myTokenBalance.myBalance}</span>
        </div>
        <div className="card-action">
          <div className="card-action-nft">
            <select id="nft-id">
              {myNFT.myNFT?.map((item) => (
                <option value={item.i}>{item.json.name}</option>
              ))}
            </select>
          </div>
          <div className="card-action-price">
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Price"
              id="price"
            />
          </div>
          <button
            className="card-action-sell hover"
            onClick={() => {
              var tokenId = document.getElementById("nft-id").value;
              var price = document.getElementById("price").value;
              if (price) {
                handleCreateMarket(configData.NFT721_Address, tokenId, price);
              } else {
                window.alert("Price field required");
              }
            }}
          >
            Sell
          </button>
        </div>
        <div className="discover">
          <b>
            <span>Discover</span> more NFTs
          </b>
        </div>
        <div>
          <NftList
            items={marketItems.marketItems}
            myNFT={false}
            buyItem={handleBuy}
            unSell={handleCancelMarket}
            account={account?.address}
          />
        </div>
      </main>
    </div>
  );
};

export default Market;
