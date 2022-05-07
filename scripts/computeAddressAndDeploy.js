const { ethers, network, getNamedAccounts } = require('hardhat');

async function main() {
  const { name: networkName } = network;

  console.log('Network:', networkName);

  const { deployer: deployerAddress } = await getNamedAccounts();

  try {
    const accounts = await ethers.getSigners();
    const signer = accounts[0];

    const deployer = await ethers.getContractAt('Create2Deployer', deployerAddress);

    const targetContract = await ethers.getContractFactory('EternalLove');

    const tx = targetContract.getDeployTransaction(
      signer.address,
      'Eternal Love',
      'ipfs://QmZSczBxTzdvqZM4YRUW9pPfASTTCaeM2VhEVauxJfVUwc/',
      'ipfs://QmZSczBxTzdvqZM4YRUW9pPfASTTCaeM2VhEVauxJfVUwc/contract'
    );

    const { data } = tx;

    const { hash: txHash } = await deployer.deploy(
      0,
      ethers.utils.id('Eternal Love'),
      data
    );

    console.log(`hash:`, txHash);
  } catch (e) {
    console.error(e);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
