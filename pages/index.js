import { useEffect, useState } from "react";
import WeaveDB from "weavedb-sdk";
import { ethers } from "ethers";
import lf from "localforage";
import { is, isNil } from "ramda";

export default function Home() {
  const contractTxId = "bts0yJq2-1JxO0R2Qco1yg2OFLdz4U2dmOfeFLxhst4";
  const sonarLink = `https://sonar.warp.cc/?#/app/contract/${contractTxId}`;

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [db, setDb] = useState(null);
  const [initDb, setInitDb] = useState(false);
  const [user, setUser] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const setupWeaveDB = async () => {
    try {
      const _db = new WeaveDB({
        contractTxId: contractTxId,
      });
      await _db.init();
      setDb(_db);
      setInitDb(true);
    } catch (e) {
      console.error("setupWeaveDB", e);
    }
  };

  useEffect(() => {
    setupWeaveDB();
  }, []);

  const login = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum, "any");
    const signer = await provider.getSigner();
    await provider.send("eth_requestAccounts", []);
    const wallet_address = await signer.getAddress();

    let identity = await lf.getItem(
      `temp_address:${contractTxId}:${wallet_address}`
    );

    let tx;

    // check if the value is null or undefined
    if (isNil(identity)) {
      ({ tx, identity } = await db.createTempAddress(wallet_address));
      const linked = await db.getAddressLink(identity.address);
      if (isNil(linked)) {
        alert("something went wrong");
        return;
      }
    } else {
      await lf.setItem("temp_address:current", wallet_address);

      setUser({
        wallet: wallet_address,
        privateKey: identity.privateKey,
      });
      setIsWalletConnected(true);
      return;
    }

    if (!isNil(tx) && isNil(tx.err)) {
      identity.tx = tx;
      identity.linked_address = wallet_address;
      await lf.setItem("temp_address:current", wallet_address);
      await lf.setItem(
        `temp_address:${contractTxId}:${wallet_address}`,
        JSON.parse(JSON.stringify(identity))
      );
      setUser({
        wallet: wallet_address,
        privateKey: identity.privateKey,
      });
    }
  };

  const logout = async () => {
    await lf.removeItem("temp_address:current");
    setUser(null, "temp_current");
    setIsWalletConnected(false);
    console.log("<<logout()");
  };

  const handleLoginClick = async () => {
    try {
      login();
      console.log("<<handleLoginClick()");
    } catch (e) {
      console.error("handleLoginClick", e);
    }
  };

  const handleAddClick = async () => {
    const UserData = { name: name, age: Number(age), country: country };

    try {
      const res = await db.add(UserData, Workers);
      console.log("submitted: ", res);
      if (res) {
        alert("Data submitted sucessfully");
      } else {
        alert("Error while submitting");
      }

      console.log(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div
        style={{
          color: "white",
        }}
      >
        <br />
        <br />
        <div className="flex justify-end px-[30px] sm:px-[50px]">
          {!isNil(user) ? (
            <button
              className="bg-[#6442af] border rounded  px-4 py-4"
              onClick={logout}
            >
              {user.wallet.slice(0, 5)}...{user.wallet.slice(-5)}
            </button>
          ) : (
            <button
              className="bg-[#6442af] border rounded  px-4 py-4"
              onClick={handleLoginClick}
            >
              Connect Wallet
            </button>
          )}
        </div>

        <h1 className="flex pb-[100px] sm:pb-[150px] px-[60px] sm:mx-[0px] text-center sm:px-[0px] font-semibold leading-snug justify-center text-5xl sm:text-5xl justify-center py-[40px]">
          Dive into a Decentralised Database with Weavedb
        </h1>

        <form
          className="grid items-center 
          justify-center px-[60px] sm:px-[0px]"
        >
          {/* Name */}
          <div
            className="w-full 
           block text-white pb-[40px] flex flex-col "
          >
            <label
              className="text-[20px] sm:text-[30px]
                  text-sm pb-[10px]"
            >
              Name
            </label>
            <input
              className="border rounded w-full md:w-[600px] py-3 px-3 text-gray-700 leading-tight "
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Age */}
          <div
            className="w-full 
           block text-white pb-[40px] flex flex-col "
          >
            <label
              className="text-[20px] sm:text-[30px]
                  text-sm pb-[10px]"
            >
              Age
            </label>
            <input
              className="border rounded w-full md:w-[600px] py-3 px-3 text-gray-700 leading-tight "
              placeholder="Age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          {/* Location */}
          <div
            className="w-full 
           block text-white pb-[40px] flex flex-col "
          >
            <label
              className="text-[20px] sm:text-[30px]
                  text-sm pb-[10px]"
            >
              Location
            </label>
            <input
              className="border rounded w-[400px] md:w-[600px] py-3 px-3 text-gray-700 leading-tight "
              placeholder="Enter Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {!isWalletConnected ? (
            <button
              onClick={async () => {
                alert("Connect your wallet pls");
              }}
              className="bg-[#6442af] border rounded  px-2 py-2"
            >
              pls connect your wallet
            </button>
          ) : (
            <button
              className="bg-[#6442af] border rounded  px-2 py-2"
              onClick={handleAddClick}
            >
              Submit
            </button>
          )}

          <a
            className="grid items-center 
          justify-center py-[80px]"
            href={sonarLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contract Transactions
          </a>
        </form>
      </div>
    </>
  );
}
