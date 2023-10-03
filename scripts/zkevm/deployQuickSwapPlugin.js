const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Plugin settings
const LP_SYMBOL = 'LP-QUICK/WETH-WIDE Farm';   // Desired symbol for LP plugin
const LP_ADDRESS = '0x686CFe074dD4ac97caC25f37552178b422041a1a';    // Address of LP token
const LP_PID = '14';    // PoolID for LP from MasterChef

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

    // pluginFactory = await ethers.getContractAt("contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPluginFactory", "0x0000000000000000000000000000000000000000");
    // plugin = await ethers.getContractAt("contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPlugin", "0x0000000000000000000000000000000000000000");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
    console.log('Starting PluginFactory Deployment');
    const pluginFactoryArtifact = await ethers.getContractFactory("BPTGaugePluginFactory");
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
        contract: "contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPluginFactory",
        constructorArguments: [
            VOTER_ADDRESS,  
        ],
    });
    console.log("PluginFactory Verified");
}

async function deployPlugin() {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createPlugin(LP_ADDRESS, LP_PID, LP_SYMBOL, { gasPrice: ethers.gasPrice, });
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
        contract: "contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPlugin",
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