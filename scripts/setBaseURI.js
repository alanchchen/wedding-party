const { ethers, network, getNamedAccounts } = require('hardhat');

async function main() {
  const { name: networkName } = network;

  console.log('Network:', networkName);

  const { eternalLove: eternalLoveAddress } = await getNamedAccounts();

  try {
    const contract = await ethers.getContractAt(
      'EternalLove',
      eternalLoveAddress
    );

    const { hash } = await contract.setBaseURI(
      'https://storage.googleapis.com/eternal-love/'
    );

    console.log(`hash:`, hash);

    //  await contract.setContractRI(
    //   'ipfs://QmZZ8ZqArTdDvy4WH2Hhk18LkPRE64dbnJpCSHsW7kDnWj/contract'
    // );
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
