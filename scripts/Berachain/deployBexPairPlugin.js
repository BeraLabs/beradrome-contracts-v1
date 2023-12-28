const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0xFBE5cABd9F9cAd8f8DcE61BE672ff7034d2e8924";

// Plugin settings
const LP_SYMBOL = "50WBERA-50HONEY"; // Desired symbol for LP plugin
const LP_ADDRESS = "0x3a995543A9c6a9c5FE56d2d9024195aE7f3373e8"; // Address of LP token
const TOKEN0 = "0x5806E416dA447b267cEA759358cF22Cc41FAE80F"; // WBERA address
const TOKEN1 = "0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B"; // HONEY address

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let pluginFactory;
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  // pluginFactory = await ethers.getContractAt("contracts/plugins/berachain/BexPairPluginFactory.sol:BexPairPluginFactory", "0x0000000000000000000000000000000000000000");
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/BexPairPluginFactory.sol:BexPairPlugin", "0x0000000000000000000000000000000000000000");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
  console.log("Starting PluginFactory Deployment");
  const pluginFactoryArtifact = await ethers.getContractFactory(
    "BexPairPluginFactory"
  );
  const pluginFactoryContract = await pluginFactoryArtifact.deploy(
    VOTER_ADDRESS,
    { gasPrice: ethers.gasPrice }
  );
  pluginFactory = await pluginFactoryContract.deployed();
  await sleep(5000);
  console.log("PluginFactory Deployed at:", pluginFactory.address);
}

async function printFactoryAddress() {
  console.log("**************************************************************");
  console.log("PluginFactory: ", pluginFactory.address);
  console.log("**************************************************************");
}

async function verifyPluginFactory() {
  console.log("Starting PluginFactory Verification");
  await hre.run("verify:verify", {
    address: pluginFactory.address,
    contract:
      "contracts/plugins/berachain/BexPairPluginFactory.sol:BexPairPluginFactory",
    constructorArguments: [VOTER_ADDRESS],
  });
  console.log("PluginFactory Verified");
}

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  await pluginFactory.createPlugin(LP_ADDRESS, TOKEN0, TOKEN1, LP_SYMBOL, {
    gasPrice: ethers.gasPrice,
  });
  await sleep(5000);
  let pluginAddress = await pluginFactory.last_plugin();
  console.log("Plugin Deployed at:", pluginAddress);
  console.log("**************************************************************");
  console.log("Plugin: ", pluginAddress);
  console.log("**************************************************************");
}

async function verifyPlugin() {
  console.log("Starting Plugin Verification");
  await hre.run("verify:verify", {
    address: plugin.address,
    contract:
      "contracts/plugins/berachain/BexPairPluginFactory.sol:BexPairPlugin",
    constructorArguments: [
      await plugin.getUnderlyingAddress(),
      VOTER_ADDRESS,
      await plugin.getTokensInUnderlying(),
      await plugin.getBribeTokens(),
      await plugin.getProtocol(),
      await plugin.getUnderlyingSymbol(),
    ],
  });
  console.log("Plugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Plugin Factory
  //===================================================================

   await deployPluginFactory();
   await printFactoryAddress();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify Plugin Factory
  //===================================================================

  // await verifyPluginFactory();

  //===================================================================
  // 3. Deploy Plugin
  //===================================================================
  // Only deploy one plugin at a time

  // await deployPlugin();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 4. Verify Plugin
  //===================================================================

  // await verifyPlugin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });