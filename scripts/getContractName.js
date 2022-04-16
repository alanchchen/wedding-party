const { ethers, network } = require('hardhat');

async function main() {
  const { name: networkName } = network;

  console.log('Network:', networkName);

  try {
    const contract = await ethers.getContractAt(
      'EternalLove',
      process.env.CONTRACT_ADDRESS
    );

    const name = await contract.name();

    console.log(`name:`, name);
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
