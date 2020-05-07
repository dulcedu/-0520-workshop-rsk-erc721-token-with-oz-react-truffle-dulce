const fs = require('fs');
const path = require('path');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic =
  fs.readFileSync(".secret")
    .toString()
    .trim();
if (!mnemonic || mnemonic.split(' ').length !== 12) {
  throw new Error('unable to retrieve mnemonic from .secret');
}

const gasPriceTestnetRaw =
  fs.readFileSync(".gas-price-testnet.json")
    .toString()
    .trim();
const gasPriceTestnet = parseInt(JSON.parse(gasPriceTestnetRaw).result, 16);
if (typeof gasPriceTestnet !== 'number' || isNaN(gasPriceTestnet)) {
  throw new Error('unable to retrieve network gas price from .gas-price-testnet.json');
}

//console.log('mnemonic:', mnemonic);
console.log('gas price on testnet:', gasPriceTestnet);  

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // ...
    testnet: {
      provider: () => new HDWalletProvider(
        mnemonic,
        'https://public-node.testnet.rsk.co/1.3.0/',
      ),
      network_id: 31,
      gasPrice: Math.floor(gasPriceTestnet * 1.1),
      networkCheckTimeout: 1e9
    },
    regtest: {
      host: '127.0.0.1',
      port: 4444,
      network_id: 33,
      networkCheckTimeout: 1e3,
    },
    // ...
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.5.7',
      // version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },
  contracts_build_directory: path.join(__dirname, 'app/src/contracts')

}
