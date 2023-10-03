const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Plugin settings
const LP_SYMBOL = 'vLP-AERO/WETH Gauge';   // Desired symbol for LP Gauge plugin
const LP_ADDRESS = '0x7f670f78B17dEC44d5Ef68a48740b6f8849cc2e6';    // Address of LP token

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise (( resolve) => setTimeout (resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let pluginFactory;
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {

    // pluginFactory = await ethers.getContractAt("contracts/plugins/base/AeroGaugePluginFactory.sol:AeroGaugePluginFactory", "0x0000000000000000000000000000000000000000");
    // plugin = await ethers.getContractAt("contracts/plugins/base/AeroGaugePluginFactory.sol:AeroGaugePlugin", "0x0000000000000000000000000000000000000000");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
    console.log('Starting PluginFactory Deployment');
    const pluginFactoryArtifact = await ethers.getContractFactory("AeroGaugePluginFactory");
    const pluginFactoryContract = await pluginFactoryArtifact.deploy(VOTER_ADDRESS, { gasPrice: ethers.gasPrice, });
    pluginFactory = await pluginFactoryContract.deployed();
    await sleep(5000);
    console.log("PluginFactory Deployed at:", pluginFactory.address);
}

async function printFactoryAddress() {
    console.log('**************************************************************');
    console.log("PluginFactory: ", pluginFactory.address);
    console.log('**************************************************************');
}

async function verifyPluginFactory() {
    console.log('Starting PluginFactory Verification');
    await hre.run("verify:verify", {
        address: pluginFactory.address,
        contract: "contracts/plugins/base/AeroGaugePluginFactory.sol:AeroGaugePluginFactory",
        constructorArguments: [
            VOTER_ADDRESS,  
        ],
    });
    console.log("PluginFactory Verified");
}

async function deployPlugin() {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createPlugin(LP_ADDRESS, LP_SYMBOL, { gasPrice: ethers.gasPrice, });
    await sleep(5000);
    let pluginAddress = await pluginFactory.last_plugin();
    console.log("Plugin Deployed at:", pluginAddress);
    console.log('**************************************************************');
    console.log("Plugin: ", pluginAddress);
    console.log('**************************************************************');
}

async function verifyPlugin() {
    console.log('Starting Plugin Verification');
    await hre.run("verify:verify", {
        address: plugin.address,
        contract: "contracts/plugins/base/AeroGaugePluginFactory.sol:AeroGaugePlugin",
        constructorArguments: [
            await plugin.getUnderlyingAddress(),
            await plugin.aeroGauge(),
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
    console.log('Using wallet: ', wallet.address);
  
    await getContracts();
    
    //===================================================================
    // 1. Deploy Plugin Factory
    //===================================================================

    // await deployPluginFactory();
    // await printFactoryAddress();

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