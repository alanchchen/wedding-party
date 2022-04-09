const { ethers, network } = require('hardhat');

async function main() {
  const { name: networkName } = network;

  console.log('Network:', networkName);

  try {
    const creature = await ethers.getContractAt(
      'FakeApe',
      '0x89dAD29054791aF138785D6fB122cA9733b2c8a1'
    );

    const uri = await creature.tokenURI(0);

    console.log(`tokenURI:`, uri);
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
