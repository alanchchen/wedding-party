require('@nomiclabs/hardhat-ethers');
require('xdeployer');

require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.11',
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
  defaultNetwork: 'rinkeby',
  networks: {
    hardhat: {},
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  mocha: {
    timeout: 40000,
  },
  xdeploy: {
    contract: 'EternalLove',
    constructorArgsPath: './contract-args.js',
    salt: 'EternalLove',
    signer: process.env.PRIVATE_KEY,
    networks: ['rinkeby'],
    rpcUrls: [`https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`],
    gasLimit: '5000000',
  },
};
