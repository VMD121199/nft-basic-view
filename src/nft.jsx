import React, { useCallback, useEffect, useRef, useState } from "react";
import IERC721 from "./contracts/NFT721.sol/NFT721.json";
import IERC20 from "./contracts/ERC20.sol/Token.json";
import MarketABI from "./contracts/Marketplace.sol/Marketplace.json";
import configData from "./config.json";
import Web3 from "web3";
const NFT721 = () => {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.on("accountsChanged", async function () {
        await disConnect();
        await loadDataBlockchain();
      });
      window.ethereum.on("chainChanged", async function (chainId) {
        chainId = await window.web3.utils.hexToNumberString(chainId);
        if (chainId != configData.networkId) {
          await disConnect();
          await loadDataBlockchain();
        }
      });
      await loadDataBlockchain();
      console.log(myNFT.myNFT);
    }
  }, []);

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
  };

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
        var totalNFT = await nftContract.methods.getTotalNFT().call();
        var myNFT = [];
        for (let i = 0; i < totalNFT; i++) {
          if (
            (await nftContract.methods.ownerOf(i).call()).toLowerCase() ==
            address[0]
          ) {
            myNFT.push(i);
          }
        }
        setMyNFT({ myNFT });
        var myBalance = await tokenContract.methods
          .balanceOf(address[0])
          .call();
        myBalance = window.web3.utils.fromWei(String(myBalance));

        setMyBalance({ myBalance });
        console.log(myBalance);
        var marketItems = await marketContract.methods.getMarketItems().call();
        console.log(marketItems);
        setMarketItems({ marketItems });
      }
    }
  };

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
            }
          }
          await loadDataBlockchain();
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

  const handleCreateNFT = async (uri) => {
    if (uri) {
      console.log(nftContract);
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

  const handleCreateMarket = async (nftAdress, tokenId, price) => {
    console.log({ nftAdress, tokenId, price });
    if (nftAdress && tokenId && price) {
      price = window.web3.utils.toWei(String(price), "ether");
      console.log(price);
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
      console.log(price);
      console.log(
        await tokenContract.tokenContract.methods
          .allowance(account.address[0], marketContract.address)
          .call()
      );
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
    <div>
      {!account.isConnect ? (
        <button onClick={() => connectMetamask()}>Connect Metamask</button>
      ) : (
        <button onClick={() => disConnect()}>Disconnect</button>
      )}
      <div>{account.address}</div>
      {myNFT.myNFT.length > 0 ? (
        <div>
          <h1>My NFT</h1>
          List Token ID:
          {myNFT.myNFT.map((item) => (
            <a>{item} </a>
          ))}
          <br />
        </div>
      ) : (
        ""
      )}
      TOKEN ERC20 Balance: {myTokenBalance.myBalance}
      <div>
        <h1>NFT</h1>
        URI:
        <input type="text" id="uri" />
        <button
          onClick={() => handleCreateNFT(document.getElementById("uri").value)}
        >
          Create NFT
        </button>
      </div>
      <div>
        <h1>MarketPlace</h1>
        <div>
          <div>
            TokenID:
            <input type="text" id="tokenId" />
          </div>
          <br></br>
          <div>
            Price:
            <input type="text" id="price" />
          </div>
          <br></br>
          <button
            onClick={() =>
              handleCreateMarket(
                nftContract.address,
                document.getElementById("tokenId").value,
                document.getElementById("price").value
              )
            }
          >
            Sell
          </button>
        </div>
        <br></br>
        <div>================================</div>
        <div>
          <div>
            Item ID:
            <input type="text" id="itemId-unsell" />
          </div>
          <br></br>
          <button
            onClick={() =>
              handleCancelMarket(document.getElementById("itemId-unsell").value)
            }
          >
            UnSell
          </button>
        </div>
        <br></br>
        <div>================================</div>
        <div>
          <div>
            Item ID:
            <input type="text" id="itemId-buy" />
          </div>
          <br></br>
          <button
            onClick={() =>
              handleBuy(document.getElementById("itemId-buy").value)
            }
          >
            Buy
          </button>
          <p>List token in Market:</p>
          <table border="2px">
            <tr>
              <th>Item ID</th>
              <th>Address NFT</th>
              <th>Token ID</th>
              <th>Price</th>
            </tr>
            {marketItems.marketItems
              .filter((item) => item.sold == false && item.isCanceled == false)
              .map((id) => (
                <tr>
                  <th>{id.itemId}</th>
                  <th>{id.nftAddress}</th>
                  <th>{id.tokenId}</th>
                  <th>{window.web3.utils.fromWei(String(id.price))}</th>
                </tr>
              ))}
          </table>
        </div>
      </div>
    </div>
  );
};

export default NFT721;
