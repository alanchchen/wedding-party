const { ethers } = require('hardhat');

async function main() {
  const signers = await ethers.getSigners();
  if (!signers) {
    console.error('No signer');
    return;
  }

  const signer = signers[0];
  const chainId = await signer.getChainId();
  const depositValue = '0.1';
  console.log(
    `Deposit ${depositValue} for ${signer.address} on chain ${chainId}`
  );

  const tx = await signer.sendTransaction({
    // ITX deposit contract (same address for all public Ethereum networks)
    to: '0x015C7C7A7D65bbdb117C573007219107BD7486f9',
    // Choose how much ether you want to deposit to your ITX gas tank
    value: ethers.utils.parseUnits(depositValue, 'ether'),
  });

  // Waiting for the transaction to be mined
  const { status, transactionHash } = await tx.wait();

  console.log(
    `Depositing ${status ? 'succeeded' : 'failed'}:`,
    transactionHash
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
