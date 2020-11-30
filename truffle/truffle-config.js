const HDWalletProvider = require("truffle-hdwallet-provider");

const fs = require("fs");
const infuraApiKey = fs.readFileSync("infura-api-key.txt").toString().trim();
const etherscanApiKey = fs.readFileSync("etherscan-api-key.txt").toString().trim();
const testnetPrivateKey = fs.readFileSync("private-key-testnet.txt").toString().trim();
const mainnetPrivateKey = fs.readFileSync("private-key-mainnet.txt").toString().trim();

module.exports = {
  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: etherscanApiKey,
  },

  networks: {
    ropsten: {
      provider: () => {
        return new HDWalletProvider(
          testnetPrivateKey,
          `https://ropsten.infura.io/v3/${infuraApiKey}`,
          0,
          6
        );
      },
      network_id: 3,
      gas: 8000000,
      gasPrice: 30000000000,
      confirmations: 3,
      timeoutBlocks: 500,
      skipDryRun: true,
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(
          testnetPrivateKey,
          `https://rinkeby.infura.io/v3/${infuraApiKey}`,
          0,
          6
        );
      },
      network_id: 4,
      gas: 8000000,
      gasPrice: 30000000000,
      confirmations: 3,
      timeoutBlocks: 500,
      skipDryRun: true,
    },

    mainnet: {
      provider: () => {
        return new HDWalletProvider(
          mainnetPrivateKey,
          `https://mainnet.infura.io/v3/${infuraApiKey}`
        );
      },
      network_id: 1,
      gas: 8000000,
      gasPrice: 30000000000,
      confirmations: 3,
      timeoutBlocks: 1000,
      skipDryRun: true,
    },
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.7.0",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200,
        },
        evmVersion: "byzantium",
      },
    },
  },
};
