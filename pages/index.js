/* eslint-disable react/jsx-no-target-blank */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Notify from 'bnc-notify';
import { default as axios } from 'axios';
import * as ethers from 'ethers';

const supportedNetworks = [
  {
    chainId: 137,
    name: 'matic',
  },
  {
    chainId: 4,
    name: 'rinkeby',
  },
];

const useInterval = (callback, delay) => {
  const savedCallbackRef = useRef();

  useEffect(() => {
    savedCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (...args) => savedCallbackRef.current(...args);

    if (delay !== null) {
      const intervalId = setInterval(handler, delay);
      return () => clearInterval(intervalId);
    }
  }, [delay]);
};

export default function Index() {
  const [isQubic, setIsQubic] = useState(false);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(supportedNetworks[0]);
  const [provider, setProvider] = useState(undefined);

  const [claimText, setClaimText] = useState('請使用 Qubic 錢包打開此頁面');

  const [notify, setNotify] = useState(null);

  const canClaim = isQubic && ethers.utils.isAddress(account);

  const [txHash, setTxHash] = useState(null);
  const [confirmations, setConfirmations] = useState(0);
  const [pending, setPending] = useState(false);

  const [relayTxHash, setRelayTxHash] = useState(null);

  const claimGift = useCallback(async () => {
    if (!account) return;

    if (pending) {
      if (notify) {
        notify.notification({
          eventCode: 'claimPending',
          type: 'hint',
          message: '正在努力處理中，請稍等 ...',
        });
      }
      return;
    }

    if (notify) {
      notify.notification({
        eventCode: 'claim',
        type: 'hint',
        message: '正在準備您的婚禮小物，請稍等 ...',
        autoDismiss: 10000,
      });
    }

    const hash = await axios
      .get(`/api/claim/${account}?network=${network.name}`)
      .then(function (response) {
        const { data } = response;
        const { txHash: hash } = data;
        return hash;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
        return null;
      });
    console.log('RelayTransactionHash', hash);
    setTxHash(null);
    setRelayTxHash(hash);
    setPending(true);
  }, [account, network, notify, pending]);

  const complete = useCallback(() => {
    setPending(false);
    setConfirmations(0);
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      if (window.ethereum.isMetaMask) {
        setProvider(window.ethereum);
        setIsQubic(true);
        setClaimText('點此領取您的婚禮小物');
        window.ethereum.on('chainChanged', (_chainId) =>
          window.location.reload()
        );
      } else {
        setProvider(undefined);
        setIsQubic(false);
        setClaimText('請使用 Qubic 錢包打開此頁面');
      }
    }
  }, []);

  useEffect(() => {
    if (!isQubic) return;

    const setupAccount = async () => {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    };

    setupAccount();

    const setupNetwork = async () => {
      const chainIdStr = await provider.request({
        method: 'eth_chainId',
      });

      const chainId = Number(chainIdStr);

      const n = supportedNetworks.find((sn) => sn.chainId === chainId);

      if (!n) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: supportedNetworks[0].chainId }],
        });

        return;
      }

      setNetwork(n);
    };

    setupNetwork();
  }, [isQubic, provider]);

  useEffect(() => {
    if (!process.env.BNC_API_KEY) return;

    const option = {
      dappId: process.env.BNC_API_KEY, // [String] The API key created by step one above
      networkId: network.chainId, // [Integer] The Ethereum network ID your Dapp uses.
    };
    console.log('notify', option);
    setNotify(Notify(option));
  }, [network]);

  // useEffect(() => {
  //   if (!isQubic || !notify || !account || !canClaim) {
  //     return;
  //   }

  //   notify.notification({
  //     message: `帳號: ${account}`,
  //   });
  // }, [isQubic, notify, account, canClaim]);

  useInterval(
    () => {
      const getTxHash = async () => {
        const { txHash: newTxHash, confirmations: incomingConfirmations = 0 } =
          await axios
            .get(`/api/transaction/${relayTxHash}?network=${network.name}`)
            .then(function (response) {
              const { data } = response;
              return data;
            })
            .catch(function (error) {
              // handle error
              console.log(error);
              return null;
            });

        console.log(newTxHash, incomingConfirmations);
        setTxHash(newTxHash);
        setConfirmations(incomingConfirmations);
      };

      getTxHash();
    },
    pending && relayTxHash && !txHash ? 1000 : null
  );

  useEffect(() => {
    if (!notify || !txHash || !pending) return;

    if (confirmations === 0) {
      const { emitter } = notify.hash(txHash);
      emitter.on('txRequest', (tx) => {
        return false;
      });
      emitter.on('txSent', (tx) => {
        return {
          message: `婚禮小物寄送中，請稍等 ...`,
          autoDismiss: 10000,
        };
      });
      emitter.on('txPool', (tx) => {
        return false;
      });
      emitter.on('txSpeedUp', (tx) => {
        return false;
      });
      emitter.on('txConfirmed', (tx) => {
        complete();

        return {
          message: `五分鐘內就可以在錢包裡的收藏品頁看到您的婚禮小物囉 !!`,
          autoDismiss: 10000,
        };
      });
      emitter.on('txFailed', (tx) => {
        complete();

        return {
          message: `糟糕，婚禮小物送丟了，請再試一次`,
        };
      });
    } else if (confirmations > 0) {
      notify.notification({
        eventCode: 'claimComplete',
        type: 'success',
        message: `五分鐘內就可以在錢包裡的收藏品頁看到您的婚禮小物囉 !!`,
        autoDismiss: 10000,
      });

      complete();
    }
  }, [confirmations, txHash, notify, pending, complete]);

  return (
    <>
      {
        <section className="md:mt-40 mt-10 mb-10 relative bg-blueGray-100">
          <div
            className="-mt-20 top-0 bottom-auto left-0 right-0 w-full absolute h-20"
            style={{ transform: 'translateZ(0)' }}
          >
            <svg
              className="absolute bottom-0 overflow-hidden"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              version="1.1"
              viewBox="0 0 2560 100"
              x="0"
              y="0"
            >
              <polygon
                className="text-blueGray-100 fill-current"
                points="2560 0 2560 100 0 100"
              ></polygon>
            </svg>
          </div>
          <div className="container mx-auto">
            <div className="sm:flex sm:flex-wrap items-center">
              <div className="w-11/12 md:w-/12 lg:w-4/12 px-12 md:px-4 mr-auto ml-auto">
                <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded-lg bg-blueGray-700">
                  <img
                    src="/img/wedding-party-cover.png"
                    alt="..."
                    className="w-full align-middle rounded-t-lg"
                  />
                  <blockquote className="relative p-8 mb-4">
                    <svg
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 583 95"
                      className="absolute left-0 w-full block h-95-px -top-94-px"
                    >
                      <polygon
                        points="-30,95 583,95 583,65"
                        className="text-blueGray-700 fill-current"
                      ></polygon>
                    </svg>
                    <h4 className="text-xl font-bold text-white">
                      歡迎來到 Alan 與 Ariel 的婚禮派對
                    </h4>
                    {/* <p className="text-md font-light mt-2 text-white">
                      錢包地址: {account}
                    </p> */}
                    {network.name === 'rinkeby' && (
                      <p className="text-md font-light mt-2 text-white">
                        網路: {network.name}
                      </p>
                    )}
                    <button
                      className="w-full bg-blueGray-400 text-white active:bg-blueGray-600 font-bold uppercase text-base px-3 py-4 rounded shadow-md hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 mt-8"
                      type="button"
                      onClick={claimGift}
                      disabled={!canClaim}
                    >
                      {claimText}
                    </button>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </>
  );
}
