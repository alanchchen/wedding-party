require('@nomiclabs/hardhat-ethers');
require('xdeployer');
require('hardhat-deploy');

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
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  namedAccounts: {
    deployer: {
      rinkeby: '0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2',
      polygon: '0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2',
    },
    eternalLove: {
      rinkeby: '0x501ab3b5b8d9b186ca79da36d26b07273ccd3f92',
      polygon: '0x501ab3b5b8d9b186ca79da36d26b07273ccd3f92',
    },
  },
  mocha: {
    timeout: 40000,
  },
  // xdeploy: {
  //   contract: 'EternalLove',
  //   constructorArgsPath: './contract-args.js',
  //   salt: 'Eternal Love 2022',
  //   signer: process.env.PRIVATE_KEY,
  //   networks: ['rinkeby', 'polygon'],
  //   rpcUrls: [`https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`, `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`],
  // },
  xdeploy: {
    contract: 'Deployer',
    constructorArgsPath: './contract-args.js',
    salt: 'Deployer using create2',
    signer: process.env.PRIVATE_KEY,
    networks: ['polygon'],
    rpcUrls: [
      // `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    ],
  },
};
