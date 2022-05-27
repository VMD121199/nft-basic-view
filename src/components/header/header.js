import "./header.scss";
import React, { useCallback, useEffect, useRef, useState } from "react";
import configData from "../../config.json";
import Web3 from "web3";
import { Link } from 'react-router-dom'
const Header = ({ loadDataBlockchain, account, setAccount, myBalance = 0 }) => {
  useEffect(async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.on("accountsChanged", async function () {
        await disConnect();
      });
      window.ethereum.on("chainChanged", async function (chainId) {
        chainId = await window.web3.utils.hexToNumberString(chainId);
        if (chainId != configData.networkId) {
          await disConnect();
        }
      });
    }
  }, []);

  const connectMetamask = async () => {
    if (window.ethereum) {
      window.ethereum
        .request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        })
        .then(async (permissions) => {
          const accountsPermission = permissions.find(
            (permission) => permission.parentCapability === "eth_accounts"
          );
          if (accountsPermission) {
            console.log("eth_accounts permission successfully requested!");
            window.web3 = new Web3(window.ethereum);
            const { eth, utils } = window.web3;
            const address = accountsPermission.caveats[0].value[0];
            await changeNetworkInMetamask(configData.networkId);

            let networkId = await window.ethereum.request({
              method: "eth_chainId",
            });
            networkId = await utils.hexToNumberString(networkId);

            if (address && networkId == configData.networkId) {
              setAccount({ address, isConnect: true });
              localStorage.setItem("account", JSON.stringify(address));
              await loadDataBlockchain();
            }
          }
        })
        .catch((error) => {
          if (error.code === 4001) {
            // EIP-1193 userRejectedRequest error
            console.log("Permissions needed to continue.");
          } else {
            console.error(error);
          }
        });
    } else {
      alert("Install Metamask");
    }
  };

  const changeNetworkInMetamask = async (chainId) => {
    var params;
    // eslint-disable-next-line default-case
    switch (chainId) {
      case 97:
        params = [
          {
            chainId: "0x61",
            chainName: "BSC Testnet",
            nativeCurrency: {
              symbol: "BNB",
              decimals: 18,
            },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          },
        ];
        break;
    }
    if (window.ethereum) {
      await window.ethereum.enable();
      try {
        // eslint-disable-next-line default-case
        switch (chainId) {
          case 97:
            // check if the chain to connect to is installed
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x61" }], // chainId must be in hexadecimal numbers
            });
            break;
        }
      } catch (switchError) {
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: params,
            });
          } catch (addError) {
            console.error(addError);
          }
        }
      }
    } else {
      window.location.href =
        "https://metamask.app.link/dapp/" + configData.path_dapp;
      // handleOpenMetaMaskWarning()
      // if no window.ethereum then MetaMask is not installed
      // alert('MetaMask is not installed. Please consider installing it: https://metamask.io/download.html');
    }
  };

  const disConnect = async () => {
    localStorage.removeItem("account");
    setAccount({ isConnect: false });
    window.location.reload();
  };
  return (
    <div className="cn-header">
      <div className="header-left">
        <div className="header-logo hover">
          <b>Logo</b>
        </div>
        <div className="header-menu">
          <div>
            <Link to={'/'}>Home</Link>
          </div>
          <div>
            <Link to={'/market'}>Marketplace</Link>
          </div>
        </div>
      </div>
      <div className="header-right">
        {!account.isConnect ? (
          <div>
            <button className="header-connect hover" onClick={connectMetamask}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div>
            <button className="header-connect hover" onClick={disConnect}>
              Disconnect
            </button>
            <br />
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
