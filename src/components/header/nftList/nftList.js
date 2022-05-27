import React from "react";
import "./nftList.scss";

const NftList = ({ items = [], myNFT, buyItem, account, unSell }) => {
  return (
    <div className="nft-list-container ">
      {items?.map((item, i) => (
        <div key={i} className="nft-item">
          <div className="square" style={{ overflow: 'hidden' }}>
            <img src={item.image} alt="" style={{ maxWidth: "100%" }} />
          </div>
          <div className="nft-item-title">
            <b>{item.name}</b>
          </div>
          <div className="nft-item-sub-title">{item.description}</div>
          {myNFT == false ? (
            <>
              {
                item.seller.toLowerCase() == account[0] ? <div className="nft-item-action hover" onClick={() => {
                  unSell(item.itemId);
                }}>
                  Unsell
                </div> : <div className="nft-item-action hover" onClick={() => {
                  buyItem(item.itemId);
                }}>
                  Buy For {window.web3.utils.fromWei(String(item.price))} Token
                </div>
              }
            </>

          ) : (
            ""
          )}
        </div>
      ))}
    </div>
  );
};

export default NftList;
