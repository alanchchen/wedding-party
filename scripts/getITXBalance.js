const axios = require('axios').default;
const { ethers, network } = require('hardhat');

async function main() {
  const { config: networkConfig } = network;
  const { url } = networkConfig;

  const signers = await ethers.getSigners();
  if (!signers) {
    console.error('No signer');
    return;
  }

  const signer = signers[0];

  const { data: responseData } = await axios.post(`${url}#relay_getBalance`, {
    id: 1,
    jsonrpc: '2.0',
    method: 'relay_getBalance',
    params: [signer.address],
  });

  const { result } = responseData;
  const { balance } = result;

  console.log(
    `Remaining balance: ${ethers.utils.formatEther(balance, 'ether')}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
