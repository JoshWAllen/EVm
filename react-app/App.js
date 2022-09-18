import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";
import React from "react";

function App() {
  const [metamask, setMetamask] = React.useState(
    typeof window.ethereum !== "undefined"
  );
  const [isConnected, setIsConnected] = React.useState(false);
  const [ethValue, setEthValue] = React.useState(1);
  const [price, setPrice] = React.useState(1);
  const [watts, setWatts] = React.useState(0);
  const [realWatts, setRealWatts] = React.useState(0);

  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.log(error);
      }
      setIsConnected(true);
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      console.log(accounts);
    } else {
      setMetamask(false);
    }
  }

  async function withdraw() {
    console.log(`Withdrawing...`);
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.withdraw();
        await listenForTransactionMine(transactionResponse, provider);
        // await transactionResponse.wait(1)
      } catch (error) {
        console.log(error);
      }
    } else {
      setMetamask(false);
    }
  }

  async function fund() {
    const ethAmount = parseInt(realWatts * price);
    console.log(ethAmount);
    console.log(`Funding with ${ethAmount}...`);
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.buy({
          value: ethers.utils.parseEther(ethAmount.toString()),
        });
        await listenForTransactionMine(transactionResponse, provider);
      } catch (error) {
        console.log(error);
      }
    } else {
      setMetamask(false);
    }
  }

  async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        const balance = await provider.getBalance(contractAddress);
        console.log(ethers.utils.formatEther(balance));
      } catch (error) {
        console.log(error);
      }
    } else {
      setMetamask(false);
    }
  }

  async function setActualWatts() {
    console.log(`Setting Watts...`);
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.setActualWattsUsed(50);
        const result = await listenForTransactionMine(
          transactionResponse,
          provider
        );
        // await transactionResponse.wait(1)
        console.log(`result: ${result}`);
        setRealWatts(result);
      } catch (error) {
        console.log(error);
      }
    } else {
      setMetamask(false);
    }
  }

  async function getPrice() {
    let data;
    if (typeof window.ethereum !== "undefined") {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        data = await contract.pricePerWatt();
        console.log(`Price: ${data.toString()}`);
        setPrice(data.toString());
      } catch (error) {
        console.log(error);
      }
      // try {
      //   watts = await contract.actualWattsUsed();
      //   console.log(`watts:${watts.toString()}`);
      // } catch (error) {
      //   console.log(error);
      // }
      // cost = price * watts;
      // console.log(`Cost: ${cost}`);
    } else {
      setMetamask(false);
    }
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function transact() {
    await fetch("http://10.33.141.194:5000/interrupt");
    let kwh = 0;
    while (true) {
      fetch("http://10.33.141.194:5000/returns")
        .then((response) => response.json())
        .then((data) => (kwh = data));
      await delay(1000);
      console.log("hi");
      if (kwh.kwh !== 0) break;
    }
    console.log(kwh.kwh);
    await setActualWatts(kwh.kwh);
    await fund();
  }

  function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`);
    return new Promise((resolve, reject) => {
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations. `
        );
        resolve();
      });
    });
  }

  return (
    <div className="text-center">
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        id="connectButton"
        onClick={connect}
      >
        {metamask
          ? isConnected === true
            ? "Connected"
            : "Connect"
          : "Please Install Metamask"}
      </button>
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        id="balanceButton"
        onClick={getBalance}
      >
        getBalance
      </button>
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        id="priceButton"
        onClick={getPrice}
      >
        getPrice
      </button>
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        id="withdrawButton"
        onClick={withdraw}
      >
        Withdraw
      </button>
      {/*Form starts*/}
      {/* <label
        className="block text-gray-500 font-bold md:text-center mb-1 md:mb-0 pr-4"
        htmlFor="ethAmount"
      >
        ETH Amount
      </label>
      <input
        className="w-56 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="ethAmount"
        placeholder="0.1"
        />*/}
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        type="button"
        id="fundButton"
        onClick={fund}
      >
        Buy
      </button>
      <button
        className="m-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        type="button"
        id="fundButton"
        onClick={transact}
      >
        transact
      </button>

      <p>Price per kWh: {price}</p>
      <label
        className="block md:text-center mb-1 md:mb-0 pr-4"
        htmlFor="ethAmount"
      >
        Number of kWh
      </label>
      <input
        type="number"
        className="w-56 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="ethAmount"
        placeholder="0.1"
        onChange={(e) => setWatts(e.target.value)}
      />
      <p>Estimated cost: {price * watts}</p>

      <h1>Actual Transaction</h1>
      <p>Amount of electricty kWh: {realWatts}</p>
    </div>
  );
}

export default App;
