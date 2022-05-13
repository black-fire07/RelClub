import React, { useState } from "react";
import "./App.css";
import { chainID, abi, NftAddress, chainName } from "./helper";
import Web3Modal from "web3modal";
import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import whiteListAddresses from "./addresses.json";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import truncate from "./truncate";

let web3Modal;
let provider;
let web3;
async function init() {
  console.log("initalzing");
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
          // 4: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
          56: "https://bsc-dataseed.binance.org/",
        },
        network: "Binance",
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false,
    providerOptions,
  });
}

function App() {
  const [val, setval] = useState(0);
  const [Tree, setTree] = useState({});
  const [nft, setnft] = useState({});
  const [address, setaddress] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [chain, setchain] = useState(0);
  const [active, setactive] = useState(false);
  const [mintCharge, setmintCharge] = useState(0);
  const [supply, setsupply] = useState(0);
  const [totalSupply, settotalSupply] = useState(0);

  const connect = async (_active) => {
    if (!_active) {
      async function fet() {
        await init();
        await loadBlockdata();
      }
      fet();
    } else {
      if (address !== "0x0000000000000000000000000000000000000000")
        window.location.reload();
    }
    setactive(!_active);
  };

  const loadBlockdata = async () => {
    try {
      provider = await web3Modal.connect();
    } catch (e) {
      console.log("Could not get a wallet connection", e);
      return;
    }
    web3 = new Web3(provider);

    loadBlockdat();
  };
  const loadBlockdat = async () => {
    let _chain;
    const Accounts = await web3.eth.getAccounts();

    if (Accounts.length === 0) {
      return;
    }
    setaddress(Accounts[0]);
    await web3.eth.getChainId().then((values) => {
      _chain = values;
      setchain(values);
    });
    if (_chain === chainID) {
      const _whiteListAddressesLeaves = whiteListAddresses.map((x) =>
        keccak256(x)
      );
      const tree = new MerkleTree(_whiteListAddressesLeaves, keccak256, {
        sortPairs: true,
      });
      setTree(tree);
      const _nft = new web3.eth.Contract(abi, NftAddress);
      setnft(_nft);
      const cost = await _nft.methods.cost().call();
      setmintCharge(cost);

      const total = await _nft.methods.maxSupply().call();
      settotalSupply(total);

      if (!whiteListAddresses.includes(Accounts[0])) {
        alert("You are not whitelisted");
      }
    } else {
      setactive(false);
      alert(`Connect to ${chainName} and refresh`);
    }

    return;
  };

  setInterval(async () => {
    if (
      nft.methods !== undefined &&
      address !== 0x0000000000000000000000000000000000000000
    ) {
      const _total = await nft.methods.totalSupply().call();
      setsupply(_total);
    }
  }, 3000);

  const buf2hex = (x) => "0x" + x.toString("hex");
  const mint = async (num) => {
    if (address === "0x0000000000000000000000000000000000000000") return;
    let proof = Tree.getProof(keccak256(address)).map((x) => buf2hex(x.data));
    await nft.methods
      .whitelistMint(num, proof)
      .send({ value: mintCharge * num, from: address });
  };

  return (
    <div className="App">
      <video className="background_video" autoPlay loop muted poster="true">
        <source src="https://assets.codepen.io/8134734/ReiClub.Whitelist.mp4" />
      </video>
      <div className="header">
        <img
          src="https://assets.codepen.io/8134734/ReiGroup.I+Logo_7.png?height=49&format=webp&fit=cover"
          alt="logo"
        />
        <Button
          className="button"
          variant="outlined"
          onClick={() => {
            connect(active);
          }}
        >
          {" "}
          {chain === chainID &&
          address !== "0x0000000000000000000000000000000000000000"
            ? truncate(address)
            : "Sign in with Metamask"}
        </Button>
      </div>
      <div className="outer">
        <div className="minting">
          <h2>Gold Membership Whitelist Event</h2>
          <p
            style={{
              marginTop: "0",
              color: "black",
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            {supply}/{totalSupply} Minted
          </p>
          <TextField
            className="input"
            id="outlined-basic"
            label="Enter NFT Amount"
            variant="outlined"
            type="number"
            onChange={(event) => {
              setval(event.target.value);
            }}
          />
          <br />
          <Button variant="contained" onClick={() => mint(val)}>
            Mint
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
