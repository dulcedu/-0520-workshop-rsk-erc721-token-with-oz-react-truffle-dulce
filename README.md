# ERC721 token with OpenZeppelin, React, and Truffle - RSK Workshop - Walkthrough

What we will do in this workshop:

1. [Pre-requisites](#step-0-pre-requisites)

## Part 0 - Set up pre-requisites

 - Set up pre-requisites

You will need the following software installed
on your computer in order to work through this tutorial.

**POSIX compliant shell**

- Mac OSX and Linux distributions:
  Use the standard terminal
- Windows:
  If you use the standard `cmd` terminal, or PowerShell,
  the commands here may not work.
  Consider installing
  [Git for Windows](https://gitforwindows.org/),
  which comes with Git Bash bundled.
  Here's a great
  [tutorial on installing and using Git Bash](https://www.atlassian.com/git/tutorials/git-bash).

**NodeJs**

- The most fuss-free way to install and manage
  multiple versions of `node` on your computer is
  [nvm](https://github.com/nvm-sh/nvm).
- This tutorial assumes that you have version 12 or later

```shell
nvm install 12
nvm use 12

```

**Truffle project related tools**

Install [Truffle](https://www.npmjs.com/package/truffle),
which is the main development tool that we'll be using;
[Truffle flattener](https://www.npmjs.com/package/truffle-flattener),
which allows us to join multiple related smart contracts into a single one,
as well as [`mnemonics`](https://www.npmjs.com/package/mnemonics),
which is a simple utility that can be used to generate
[BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
mnemonics;
using the following command:

```shell
npm i -g truffle@5.1.22 truffle-flattener@1.4.4 mnemonics@1.1.3

```

**Java**

- You will need Java 8 in order to run RSKj
- If `java -version` displays an error,
  or displays a version other than `1.8`,
  you will need to install it.

There are a variety of ways to do this,
and SDKman is one which allows you to install and switch between multiple versions as needed:

```shell
curl -s "https://get.sdkman.io/" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
# to get a filtered list of available java versions
sdk list java  | grep "8\." # copy a selection for use below

# install the version of java copied above
# (replace accordingly)
sdk install java 8.0.242.j9-adpt

# show installed versions, and switch to the selected one
# (replace accordingly)
sdk list java | grep installed
sdk use java 8.0.242.j9-adpt
java -version

```

**curl**

- This is a system command that is likely
  already installed on your system
- If `curl --version` displays an error,
  [download `curl`](https://curl.haxx.se/download.html).

**Code editor**

- Software that is able to edit text files
- Preferably one that has support for syntax highlighting for both SOlidity and Javascript
- [VS Code](https://code.visualstudio.com)
  is a good choice if you don't already have one

**RSKj**

Get RSKj running locally, this will provide you with a `localhost`-only network,
for fast testing.

For this part, open up a new shell,
as you will need to leave processes running in the background while you continue with the rest of your tutorial.

Now you're ready to download and install RSKj,
which is the RSK node.
This enables you to run an instance locally,
connecting various RSK networks:
Mainnet, Testnet, and Regtest.

```shell
cd ~/code/rsk
mkdir -p ~/code/rsk/rskj-node
cd ~/code/rsk/rskj-node
curl \
  -L \
  https://github.com/rsksmart/rskj/releases/download/WASABI-1.3.0/rskj-core-1.3.0-WASABI-all.jar \
  > ./rskj-core-1.3.0-WASABI-all.jar
sha256sum rskj-core-1.3.0-WASABI-all.jar
# 1343a100363d78db8c6563ec0778646b17af7fdaf7de2ac5932537582c079ddd  rskj-core-1.3.0-WASABI-all.jar

```

> Note: When installing and running the RSKj node,
> it is always a good idea to verify that your copy is legitimate.
> [Full instructions](/rsk/node/contribute/verify/ "Verify authenticity of RskJ source code and its binary dependencies")
> on how to do this.

For the purposes of this workshop,
we will run RSKj on Regtest.

```shell
java -cp rskj-core-1.3.0-WASABI-all.jar -Drpc.providers.web.cors=* co.rsk.Start --regtest

```

If you see no output - that is a good thing:
Its output is directed to a log file.

> Note the flag provided above: `-Drpc.providers.web.cors=*`
> This disables cross origin resource sharing protection,
> effectively allowing any web page to access it.
> As we want to make JSON-RPC requests from a browser,
> such as a DApp, we need this flag.

Leave this **running** in an open shell,
and switch back to your original shell for the rest of this workshop.

Back in your original shell,
it is a good idea to verify that you are able to
successfully make JSON-RPC requests before proceeding.

```shell
curl \
  http://localhost:4444/ \
  -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

```

If this command fails, it is likely that the Regtest node running locally
(running on your own computer) is not working properly.
You should see a response similar to the following:

```json
{"jsonrpc":"2.0","id":1,"result":"0x2246e"}

```

Now let's do the same thing, but this time,
instead of connecting to something running locally,
we connect to the [RSK Testnet](https://stats.testnet.rsk.co/).
You can run your own RSK Testnet node using the same RSKj used earlier, or
you can simply connect to public node.
THe latter option requires no setup, and that is what we'll be doing:

```shell
curl \
  https://public-node.testnet.rsk.co/1.3.0/ \
  -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

```

If this command fails,
it is likely that your connection to RSK's public node is impeded in some way,
and you should check for, and relax,
restrictive network firewall or proxy rules.
You should see a response similar to the following:

```json
{"jsonrpc":"2.0","id":1,"result":"0xca035"}

```

The `result` property is the number of the latest block that has been synced.
Note that this value (`0xca035`)
is the block number in hexadecimal (base 16),
so the output above indicates that the current block number
is `827445` in decimal (base 10).
This should match the "Best Block" field in the
[RSK Testnet Stats](https://stats.testnet.rsk.co/) site.

![](./img/stats-testnet-block-number.png)

## Part 1 - Init Truffle

### Git repository

We'll create a directory for this new project,
and then initialise a git repo in it.
In order to be able to `git push`,
you will need to create a new repository,
and copy its remote URL.

Change your folder name and git remote URL as appropriate.

```shell
mkdir -p ~/code/rsk/workshop-rsk-erc721-token-with-oz-react-truffle-bguiz-live
cd ~/code/rsk/workshop-rsk-erc721-token-with-oz-react-truffle-bguiz-live
git init
git remote add origin git@github.com:bguiz/workshop-rsk-erc721-token-with-oz-react-truffle-bguiz-live.git

```

Create the git remote as needed.

### Initialise Truffle project

The `truffle init` command sets up an skeletal Truffle project in the current directory

```shell
truffle init
git add contracts/ migrations/ truffle-config.js
git commit -m "step: 01-01: truffle init"

```

### Initialise npm project

The `npm init` command set up a `package.json` file,
which stores details about this project,
for example what dependencies we have installed.

```shell
npm init
git add package.json
git commit -m "step: 01-02: npm init"

```

### Git ignore file

Tell git not to care about the NodeJs dependencies -
we don't want to commit those!

```shell
echo "/node_modules" > .gitignore
echo ".secret" >> .gitignore #never add your seed phrase to your github project ;)
git add .gitignore
git commit -m "step: 01-03: .gitignore node_modules and.secret"

```

Let's inspect the directory structure and files
that were generated by `truffle init`.

```shell
tree -I node_modules

```

### Install local dependencies for Truffle

Install a dependency that allows Truffle to make use
of a Hierarchically Deterministic Wallet (BIP39).
We will make use of this shortly.

```shell
npm i --save-exact @truffle/hdwallet-provider@1.0.34 @openzeppelin/contracts@2.5.0
git add -p package.json
git commit -m "step: 01-04: npm install dependencies"
git push origin master

```

## Part 2 - Init React

### Create React application

```shell
npx create-react-app@3.4.1 app --use-npm

```

```shell
git add ./app
git commit -m "step: 02-01: react init"

```

### Install local dependencies for front end

```shell
cd app
npm i --save-exact web3@1.2.7 bootstrap@4.4.1
cd ..

```

```shell
git add -p app/package.json
git commit -m "step: 02-02: add front end dependencies - web3, bootstrap"

```

## Part 3 - Truffle config

### BIP39 mnemonic

Generate a 12-word BIP39 mnemonic using
[iancoleman.io/bip39](https://iancoleman.io/bip39/),
and save to `.secret`.
Alternatively, use `mnemonics` to do the same.

```shell
mnemonics > .secret
```

### Custom gas price

Get the current gas price for RSK's Testnet,
and save to `.gas-price-testnet.json`.

```shell
curl \
  https://public-node.testnet.rsk.co/1.3.0/ \
  -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' \
  > .gas-price-testnet.json

```

```shell
git add .gas-price-testnet.json
git commit -m "step: 03-02: save gas price JSON-RPC responses for testnet"

```

### Parse mnemonic and gas price

Open up the config file used by Truffle in your code editor.
Specify the version of the solidity compiler that you wish to use.

```shell
code truffle-config.js

```

```javascript
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

console.log('mnemonic:', mnemonic);
console.log('gas price on testnet:', gasPriceTestnet);

```

Let's test whether that worked:

```shell
truffle console

```

This should give you output similar to the following

```shell
mnemonic: shop lecture rookie zero oak salon fault social copy melt dinner candy
gas price on testnet: 60000000
> Something went wrong while attempting to connect to the network. Check your network configuration.

```

At this point we are **expecting** the network connection to fail -
configuration for that comes in the next steps -
but it is important that "mnemonic" and "gas price on testnet"
are parsed and appear correctly.
If these values are not, and some other error occurs before that,
please check that you have completed the prior steps correctly.

If it works, then we're ready to continue configuring Truffle.

```shell
git add -p truffle-config.js
git commit -m "step: 03-03: read gas prices and BIP39 mnemonic in from files"

```

### Specify compiler version

Continue editing the `truffle-config.js` file to specify the exact version
of the solidity compiler you wish to use.

```javascript
  compilers: {
    solc: {
      version: '0.5.7',
      // ...
    },
  },

```

```shell
git add -p truffle-config.js
git commit -m "step: 03-04: specify compiler version"

```

### Specify custom Truffle build path

By default, Truffle stores its build outputs to `build/contracts`,
however, we would like these to be accessible to our front end application,
within the `app` directory,
so let's specify a custom build directory that points there instead.

```javascript
  contracts_build_directory: path.join(__dirname, 'app/src/contracts'),

```

```shell
git add -p truffle-config.js
git commit -m "step: 03-05: configure custom truffle build outputs directory"

```

### Configure RSK Testnet connection

Add a new configuration object under `networks`,
named `testnet`.
This connects to a network of RSKj instances running
all over the world, mining on the RSK Testnet.
You can see some of them at [stats.testnet.rsk.co](https://stats.testnet.rsk.co/).

```javascript
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
    // ...
  },

```

Note that we specify a gas price that is slightly higher (by 10%)
than the minimum specified by the network.
For example, the gas price at the time of creating
this workshop was 60 million,
and we configure a gas price of 66 million.
The effect that this has is to get a slightly higher priority
for our transactions being added to blocks.

Test the connection to RSK Testnet.

```shell
truffle console --network testnet

```

```javascript
(await web3.eth.getBlockNumber()).toString()

(await web3.eth.net.getId()).toString()

.exit

```

(Typing `.exit` quits the Truffle console.)

```shell
git add -p truffle-config.js
git commit -m "step: 03-06: configure RSK Testnet connection"

```

> Note: Another way to connect to the RSK Testnet,
> instead of using the public node,
> is to run your own copy of RSKj,
> but configured to connect to Testnet instead of Regtest.
> If this is the case,
> you should modify your Truffle config accordingly.

### Save list of accounts

The addresses of the first 10 wallets in our
hierarchically deterministic wallet can be obtained now,
and we write them to a file named `.accounts-testnet`

Enter to the truffle console again
```bash
truffle console --network testnet
```
then inside the console

```javascript
const accounts = Object.keys(web3.currentProvider.wallets)

accounts

await require('fs').promises.writeFile('.accounts-testnet', accounts.join('\n'))

.exit

```

Save this list of account addresses.

```shell
git add .accounts-testnet
git commit .accounts-testnet -m "step: 03-07: save list of account addresses"

```

### Fund an account using the Testnet faucet

Fund your first Testnet account with some tR-BTC
using the RSK Testnet faucet -
[faucet.rsk.co](https://faucet.rsk.co/).
Use the address which is in the first line of the `.accounts-testnet` file.

You will need this in order to pay for the gas need for smart contract deployment.

```shell
head -n 1 < .accounts-testnet

```

Check that you have tR-BTC

```shell
truffle console --network testnet

```

```javascript
const accounts = Object.keys(web3.currentProvider.wallets)

web3.eth.getBalance(accounts[0])

.exit

```

### Configure RSK Regtest connection

Add a new configuration object under `networks`,
named `regtest`.
This connects to a single RSKj instance running on your own computer.

```javascript
  networks: {
    // ...
    regtest: {
      host: '127.0.0.1',
      port: 4444,
      network_id: 33,
      networkCheckTimeout: 1e3,
    },
    // ...
  },

```

Note that it is not necessary to configure any custom gas price here,
as the gas price is always zero (free) for Regtest instances -
any computational and storage costs incurred are,
by definition, your own after all!

Test the connection to RSK Regtest.

```shell
truffle console --network regtest

```

Note that if you see an error similar to:
`> Something went wrong while attempting to connect to the network. Check your network configuration.`
... you should check to ensure that you do indeed have
an RSKj instance running on your system.

```javascript
(await web3.eth.getBlockNumber()).toString()

(await web3.eth.net.getId()).toString()
.exit

```

```shell
git add -p truffle-config.js
git commit -m "step: 03-08: configure RSK Regtest connection"
git push origin master

```

## Part 4 - Smart contract

### Flattened OZ contracts

We'll use the `truffle-flattener` tool,
installed earlier,
to generate a single Solidity file that includes
all of the Solidity files that comprise `ERC721Full.sol`.

```shell
truffle-flattener ./node_modules/@openzeppelin/contracts/token/ERC721/ERC721Full.sol > contracts/ERC721Full.sol

less contracts/ERC721Full.sol

.q

```

Note that this step is not required when using a tool like Truffle, as it is able to manage the deployment for you.
However, if you wish to deploy a smart contract via another tool,
for example Remix, it can come in quite handy.

```shell
git add contracts/ERC721Full.sol
git commit -m "step: 04-01: flattened OZ ERC721 implementation"

```

### Non-fungible token smart contract

Now we can create a new smart contract,
which "extends" the ERC-721 from Open Zeppelin.

```shell
touch contracts/Colours.sol
code contracts/Colours.sol

```

```solidity
pragma solidity 0.5.7;

import "./ERC721Full.sol";

contract Colours is ERC721Full {

  bytes3[] public colours;
  mapping(bytes3 => bool) private colourExists;

  constructor()
    ERC721Full("Colour", "FARBE")
    public
  {
    // do nothing
  }

  function mint(bytes3 colour) public {
    require(
      !colourExists[colour],
      "Colour already exists"
    );
    uint _id = colours.push(colour);
    _mint(msg.sender, _id);
    colourExists[colour] = true;
  }
}

```

Note that:

- The constructor of `Colours` calls the constructor of `ERC721Full`
- We're using the `bytes3` Solidity data type to store colours

```shell
git add contracts/Colours.sol
git commit -m "step: 04-02: Create colours non-fungible token smart contract"

```

### Compile NFT contract

```shell
truffle compile

```

```shell
git add app/src/contracts
git commit -m "step: 04-03: Compile colours non-fungible token smart contract"

```

### Deployment script

```shell
touch migrations/2_deploy_colours.js
code migrations/2_deploy_colours.js

```

```javascript
const Colours = artifacts.require("Colours");

module.exports = function(deployer) {
  deployer.deploy(Colours);
};

```

```shell
git add migrations/2_deploy_colours.js
git commit -m "step: 04-04: deployment script for colours smart contract"

```

### Deploy to Regtest

Enter the following command to deploy to Regtest.

```shell
time truffle migrate --network regtest

```

Note that the `truffle migrate` command was preceded with `time`.
This simply tells the system to measure/ track
how long the command took to complete.
It is optional, and you can leave that out.

You should get some output similar to the following:

```
Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.

Starting migrations...
======================
> Network name:    'regtest'
> Network id:      33
> Block gas limit: 6800000 (0x67c280)

1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0x13f544bf26e1bfffc24abc6f67d3e4e1753042ca9e340f87587ac3d7f70ba7ad
   > Blocks: 0            Seconds: 0
   > contract address:    0x911F77160b2d4f929CD22De8EAa586b8761F1859
   > block number:        129746
   > block timestamp:     1588666952
   > account:             0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826
   > balance:             999999999999.83579664965
   > gas used:            186135 (0x2d717)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.0037227 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:           0.0037227 ETH

2_deploy_colours.js
===================

   Deploying 'Colours'
   -------------------
   > transaction hash:    0x8cb1e29f966b644fe8db6579466d030991a2cb534855212dd8fae98ca7b244ef
   > Blocks: 0            Seconds: 0
   > contract address:    0x62Aacde67191F40055257ED66456546179652f78
   > block number:        129750
   > block timestamp:     1588666956
   > account:             0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826
   > balance:             999999999999.77402240965
   > gas used:            3046711 (0x2e7d37)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.06093422 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.06093422 ETH

Summary
=======
> Total deployments:   2
> Final cost:          0.06465692 ETH

real  0m11.419s
user  0m4.598s
sys   0m0.384s

```

The output from `time` at the bottom indicates that it took
about 11 seconds in total to complete the deployment onto Regtest.

The most significant output from the deployment which we care about
is the `contract address` that is output while running
the `2_deploy_colours.js` migration.
This value is saved in the Truffle build outputs folder,
which you can always retrieve using the following command:

```shell
jq '.networks."33".address' < app/src/contracts/Colours.json

```

```shell
git add -p app/src/contracts
git commit -m "step: 04-05: deploy to regtest"

```

### Deploy to Testnet

The deployment to Testnet is very similar,
we simply use `testnet` instead of `regtest` for the `network` flag.

```shell
time truffle migrate --network testnet

```

You should get some output similar to the following:

```
Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.

Starting migrations...
======================
> Network name:    'testnet'
> Network id:      31
> Block gas limit: 6800000 (0x67c280)

1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0x4f13a2d76fa68d5dbcc701c18723b38208e7a17ae7546cb81fd4370c0a0ca78c
   > Blocks: 1            Seconds: 29
   > contract address:    0x30fC9aD5F2dE9E4454Ef50093600ACB8e7Fcb0F2
   > block number:        825341
   > block timestamp:     1588667343
   > account:             0xA2ddF2191f35D2eD784d40dCEAE65390e0c06510
   > balance:             0.049769793122
   > gas used:            186135 (0x2d717)
   > gas price:           0.066 gwei
   > value sent:          0 ETH
   > total cost:          0.00001228491 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:       0.00001228491 ETH

2_deploy_colours.js
===================

   Deploying 'Colours'
   -------------------
   > transaction hash:    0xa8e49c7182f40a628fea2f43f08c1529f483e40ef06deadd34737bf6d13dc51d
   > Blocks: 1            Seconds: 33
   > contract address:    0x676419Ba52bE9b9730954056e8a936Af2CB14D85
   > block number:        825343
   > block timestamp:     1588667402
   > account:             0xA2ddF2191f35D2eD784d40dCEAE65390e0c06510
   > balance:             0.04956593813
   > gas used:            3046711 (0x2e7d37)
   > gas price:           0.066 gwei
   > value sent:          0 ETH
   > total cost:          0.000201082926 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:      0.000201082926 ETH

Summary
=======
> Total deployments:   2
> Final cost:          0.000213367836 ETH

real  2m42.234s
user  0m11.490s
sys   0m1.241s

```

The output from `time` at the bottom indicates that it took
close to 3 minutes in total to complete the deployment onto Testnet - much slower than the 11 seconds for Regtest!

At the time of writing, the average block time
on the RSK Testnet is about 30 seconds,
and since this deployment involves 4 transactions
which must be executed in sequence,
the theoretical fastest this deployment could take is 2 minutes.

The most significant output from the deployment
is the `contract address`.
This value is saved in the Truffle build outputs folder,
which you can always retrieve using the following command:

```shell
jq '.networks."31".address' < app/src/contracts/Colours.json

```

Note that `31` here refers to the chain ID of the
network it was deployed to.

```shell
git add -p app/src/contracts
git commit -m "step: 04-06: deploy to testnet"
git push origin master

```

## Part 5 - Front end

### Update HTML and CSS

Let's change the `<title>` tag in the HTML.

```shell
code app/public/index.html

```

```diff
-    <title>React App</title>
+    <title>Colours! - ERC721 token with OpenZeppelin, React, and Truffle - RSK Workshop</title>

```

Let's also use the CSS from the bootstrap dependency that we installed earlier.

```shell
code app/src/index.js

```

```diff
 import ReactDOM from 'react-dom';
-import './index.css';
+import 'bootstrap/dist/css/bootstrap.css';
 import App from './App';
```

For the CSS of the main application,
delete the entire lot, and replace it with just this one selector,
as that is all that we need.

```shell
code app/src/App.css

```

```css
.token {
  height: 150px;
  width: 150px;
  border-radius: 50%;
  display: inline-block;
}

```

```shell
git add -p app/public/index.html app/src/index.js code app/src/App.css
git commit -m "step: 05-01: update HTML and CSS"

```

### Update JS

```shell
code app/src/App.js

```

Clear the contents of this file,
and add the following imports.

```javascript
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Colours from './contracts/Colours.json';

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-02: app imports"

```

Note that the final line which imports `Colours`,
is the Truffle build output.
We will be using the ABI and deployed adddress fields from this
to initialise the web3.js smart contract JS object.

Let's add a couple of utility functions to convert between
`bytes3` which is how the smart contract stores colours, and
`string` which we use to represent colours in a web browser.

```javascript
function colourHexToString(hexStr) {
  return '#' + hexStr.substring(2);
}

function colourStringToBytes(str) {
  if (str.length !== 7 || str.charAt(0) !== '#') {
    throw new Error('invalid colour string');
  }
  const hexStr = '0x' + str.substring(1);
  return Web3.utils.hexToBytes(hexStr);
}

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-03: colour representation conversion utility functions"

```

Define the main `App` component, and export it.
We will be suing the component's `state` to track/ mirror
the parts of the smart contract's state that we wish to display.

```javascript

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      contract: null,
      totalSupply: 0,
      colours: [],
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

}

export default App;

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-04: app component"

```

Next, we create a function that initialises an instance of web3.js.

```javascript
  async loadWeb3() {
    if (window.ethereum) {
      // current web3 providers
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      // fallback for older web3 providers
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      // no web3 provider, user needs to install one in their browser
      window.alert(
        'No injected web3 provider detected');
    }
    console.log(window.web3.currentProvider);
  }

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-05: web3 init"

```

Next, we create a function that loads the initial state of the
smart contract, and populates the component's state,
which will be used in the render function that we see later.

Note that the `bytes3` data type from the smart contract is
returned as a "hex string",
and we make use of our `colourHexToString` from earlier
to convert it.

```javascript
  async loadBlockchainData() {
    const web3 = window.web3;

    // Load account
    const accounts = await web3.eth.getAccounts();
    console.log ('account: ', accounts[0]);
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = Colours.networks[networkId];
    if (!networkData) {
      window.alert('Smart contract not deployed to detected network.');
      return;
    }

    const abi = Colours.abi;
    const address = networkData.address;

    const contract = new web3.eth.Contract(abi, address);
    this.setState({ contract });

    const totalSupply = await contract
      .methods.totalSupply().call();
    this.setState({ totalSupply });

    // Load Colors
    for (var i = 1; i <= totalSupply; i++) {
      const colourBytes = await contract
        .methods.colours(i - 1).call();
      const colourStr = colourHexToString(colourBytes);
      this.setState({
        colours: [...this.state.colours, colourStr],
      });
    }
  }

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-06: smart contract state init"

```

Next, we create a function to handle user interaction.
In this case, they are creating a new Colour NFT.

Note that the user is expected to enter the colour
as a "hex string", so we use the `colourStringToBytes` function
defined earlier to convert it to `bytes3`,
as required by the smart contract.

```javascript
  mint = (colourStr) => {
    const colourBytes = colourStringToBytes(colourStr);
    this.state.contract.methods
      .mint(colourBytes)
      .send({ from: this.state.account })
      .once('receipt', (receipt) => {
        console.log ('transaction receipt: ', receipt)
        this.setState({
          colours: [...this.state.colours, colourStr],
        });
      });
  }

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-07: mint smart contract transaction"

```

Finally, we create a render function which displays the app.
This does two things:

- Display a form which calls the `mint` function defined earlier,
  with the colour input by the user.
- Display a list of all the colours.

```javascript
  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <span className="navbar-brand col-sm-3 col-md-2 mr-0">
            Colour Tokens
          </span>

          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white"><span id="account">{this.state.account}</span></small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Issue Token</h1>
                <form onSubmit={(event) => {
                  event.preventDefault();
                  const colourStr = this.colour.value;
                  this.mint(colourStr);
                }}>
                  <input
                    type='text'
                    className='form-control mb-1'
                    placeholder='e.g. #FF00FF'
                    ref={(input) => { this.colour = input }}
                  />
                  <input
                    type='submit'
                    className='btn btn-block btn-primary'
                    value='MINT'
                  />
                </form>
              </div>
            </main>
          </div>
          <hr/>
          <div className="row text-center">
            { this.state.colours.map((colourStr, key) => {
              return (
                <div key={key} className="col-md-3 mb-3">
                  <div className="token" style={{ backgroundColor: colourStr }}></div>
                  <div>{colourStr}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

```

```shell
git add -p app/src/App.js
git commit -m "step: 05-08: render component"

```

### Run the application

Run the front end for the DApp using the following command.
Do this in a new terminal.

```shell
cd app
npm start

```

Open up Chrome that already has a copy of MetaMask installed,
and a **Custom RPC** for RSK Testnet configured.
Then visit `http://localhost:3000/`.

MetaMask will prompt you to ask whether
you allow this particular DApp to connect.

![](./img/metamask-connection-permission.png)

Click on the MetaMask icon in the browser to ensure that:

- You are connected to the RSK Testnet
- You has some tR-BTC (to pay gas fees)

![](./img/metamask-account-before.png)

Above the **MINT** button,
enter any valid hexadecimal colour string,
e.g. `#006e3c`, and then press **MINT**.

![](./img/browser-dapp-before.png)

MetaMask will show a pop up dialog to ask
you to confirm the transaction.
If you click **Confirm**,
it will sign the transaction using your private key,
and send that to the RSK Testnet over JSON-RPC.

![](./img/metamask-confirm-tx-for-mint.png)

The transaction needs to be added to a block,
which we will have to wait for.
While this is happening, we should see the transaction
in a **PENDING** state.

![](./img/metamask-account-tx-pending.png)

After waiting a bit, the browser should pop up this
system notification to say that the
transaction has been added to a block,
and that the block has been mined.

![](./img/metamask-tx-confirmed-notification.png)

Once this happens, the DApp will display the new colour!
Congratulations, you're the proud new owner of a
non-fungible token representing this particular colour!

![](./img/browser-dapp-after.png)

Now, remember that you have multiple accounts,
thanks to BIP39 hierarchical deterministic wallets.
Switch to another account which has a tR-BTC balance.

If your other accounts do not have any tR-BTC,
you can use the faucet again,
or you can simply transfer from this account to the other,
by opening up Truffle console and entering the following command.

```shell
truffle console --network testnet

```

```javascript
const transferTxInfo = await web3.eth.sendTransaction({ to: 'YOUR_ACCOUNT_ADDRESS_TO', from: 'YOUR_ACCOUNT_ADDRESS_FROM', value: web3.utils.toWei('0.01', 'ether')})
```

![](./img/metamask-account-switch-before.png)

MetaMask should now display the new account.

![](./img/metamask-account-switch-after.png)

In the DApp, enter a new colour, e.g. `#aa00bb`,
and press the **MINT** button.

As before, MetaMask will prompt you to sign the transaction.

![](./img/metamask-confirm-tx-for-mint-2.png)

This time, let's peek under the hood a little,
and instead of pressing **Confirm** right away,
press the **Data** tab.

You should see that the data

- starts with `0x`,
- followed by 4 bytes (which is 8 hexadecimal characters) -
  `80bcefab` -
  that represent the unique identifier of the `mint`
  function in the smart contract,
  and is generated at compile time by `solc`.
- followed by the input data for the function call,
  which in this case contains
  3 bytes (which is 6 hexadecimal characters) -
  `aa00bb` -
  the colour which we entered.
  The remaining zeroes are simply *padding*.

![](./img/metamask-confirm-tx-for-mint-2-data.png)

The next few steps should be familiar now.

You should see a **PENDING** transaction ...

![](./img/metamask-account-tx-pending-2.png)

... and once the transaction has been confirmed,
you should see the DApp update,
and display the new Colour token.

![](./img/browser-dapp-after-2.png)

If you open up the
[RSK Testnet Explorer](https://explorer.testnet.rsk.co/),
you should be able to
search for the address of your smart contract
and find it.

> TIP: If you don't have the address of your smart contract handy,
> run the following command in order to obtain it.
>
> ```shell
> jq '.networks."31".address' < app/src/contracts/Colours.json
> ```

At the bottom, click on the **Accounts** tab,
and it will show a list of accounts which own these
Colours non-fungible tokens.

Here's
[an example](https://explorer.testnet.rsk.co/address/0x676419ba52be9b9730954056e8a936af2cb14d85?__tab=accounts&__ctab=general)

![](./img/browser-explorer-contract-nft.png)
