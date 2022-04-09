import * as ethers from 'ethers';

const signRequest = async (signer, tx) => {
  const chainId = await signer.getChainId();
  const relayTransactionHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'bytes', 'uint', 'uint', 'string'],
      [tx.to, tx.data, tx.gas, chainId, tx.schedule]
    )
  );

  return await signer.signMessage(ethers.utils.arrayify(relayTransactionHash));
};

const mint = (contractAddress, to) => {
  const iface = new ethers.utils.Interface(['function mint(address to)']);
  const callData = iface.encodeFunctionData('mint', [to]);

  return {
    toMetaTransaction: async (signer, contractName, nonce, deadline) => {
      const chainId = await signer.getChainId();

      const iface = new ethers.utils.Interface([
        'function executeMetaTransaction(address authorizer,bytes32 nonce,bytes memory callData,uint256 deadline,uint8 v,bytes32 r,bytes32 s)',
      ]);

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          MetaTransaction: [
            { name: 'authorizer', type: 'address' },
            { name: 'nonce', type: 'bytes32' },
            { name: 'callData', type: 'bytes' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        domain: {
          name: contractName,
          version: '1',
          chainId,
          verifyingContract: contractAddress,
        },
        primaryType: 'MetaTransaction',
        message: {
          authorizer: signer.address,
          nonce,
          callData,
          deadline,
        },
      };

      const { message, types, domain } = typedData;
      const { MetaTransaction } = types;

      const signature = await signer._signTypedData(
        domain,
        { MetaTransaction },
        message
      );
      const { r, s, v } = ethers.utils.splitSignature(signature);

      const data = iface.encodeFunctionData('executeMetaTransaction', [
        signer.address,
        nonce,
        callData,
        deadline,
        v,
        r,
        s,
      ]);

      return {
        to: contractAddress,
        data,
        send: async (signer, gasLimit, schedule = 'fast') => {
          const tx = {
            to: contractAddress,
            data,
            gas: gasLimit,
            schedule,
          };

          const signature = await signRequest(signer, tx);
          const { relayTransactionHash } = await signer.provider.send(
            'relay_sendTransaction',
            [tx, signature]
          );

          console.log(`ITX relay hash: ${relayTransactionHash}`);

          return relayTransactionHash;
        },
      };
    },

    to: contractAddress,
    data: callData,
    send: async (signer, gasLimit) => {
      const tx = {
        to: contractAddress,
        data: callData,
        gas: gasLimit,
      };

      const { hash: txHash } = await signer.sendTransaction(tx);

      console.log(`transaction hash: ${txHash}`);

      return txHash;
    },
  };
};

export default async function handler(req, res) {
  const {
    query: { address },
  } = req;

  const itxProvider = new ethers.providers.InfuraProvider(
    'rinkeby', // or 'ropsten', 'rinkeby', 'kovan', 'goerli'
    process.env.INFURA_PROJECT_ID
  );

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, itxProvider);

  const metaTx = await mint(
    '0x44410313C0C95209297D59A7951D63343959e82F',
    address
  ).toMetaTransaction(
    signer,
    'FakeApe',
    ethers.utils.randomBytes(32),
    Math.floor(Date.now() / 1000) + 3600
  );

  const relayTransactionHash = await metaTx.send(signer, '150000');

  // 0xb50fac40626ae6a491c87941195c038f0a26ae6a2d780d53c911f50e8cfbf3ec

  res.status(200).json({ txHash: relayTransactionHash });
}
