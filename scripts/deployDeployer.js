const { ethers, network, run } = require('hardhat');

async function main() {
  const { name: networkName } = network;

  console.log('Network:', networkName);

  try {
    await run('compile');

    const accounts = await ethers.getSigners();

    console.log(
      'Accounts:',
      accounts.map((a) => a.address)
    );

    const Contract = await ethers.getContractFactory('Deployer');

    console.log('Deploying ....');

    const c = await Contract.deploy();

    await c.deployed();

    console.log(`Deployer deployed to:`, c.address);
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
