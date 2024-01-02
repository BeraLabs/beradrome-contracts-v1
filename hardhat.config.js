const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-foundry");
require("solidity-coverage");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const CHAIN_ID = 2061; // bera testnet

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SCAN_API_KEY = process.env.SCAN_API_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
         // yul: true
        }
      },
    },
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      //gasPrice: 1000000000,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
  },
  customChains: [
    {
      network: "basegoerli",
      chainId: 84531,
      urls: {
        apiURL: "https://api-goerli.basescan.org/api",
        browserURL: "https://goerli.basescan.org",
      },
    },
  ],
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
