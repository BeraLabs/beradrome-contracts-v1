const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

// Tokens
const BVM = '0xd386a121991E51Eab5e3433Bf5B1cF4C8884b47a';
const WETH = '0x4200000000000000000000000000000000000006';
/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const MULTISIG = '0x0000000000000000000000000000000000000000';

// PluginFactory settings
const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Plugin settings
const LP_SYMBOL = 'vLP-BVM/WETH Gauge';   // Desired symbol for LP Gauge plugin
const LP_ADDRESS = '0x53713F956A4DA3F08B55A390B20657eDF9E0897B';    // Address of LP token
const GAUGE_REWARDS = [BVM, WETH];

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

    // pluginFactory = await ethers.getContractAt("contracts/plugins/base/VelociGaugePluginFactory.sol:VelociGaugePluginFactory", "0x0000000000000000000000000000000000000000");
    // plugin = await ethers.getContractAt("contracts/plugins/base/VelociGaugePluginFactory.sol:VelociGaugePlugin", "0x0000000000000000000000000000000000000000");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
    console.log('Starting PluginFactory Deployment');
    const pluginFactoryArtifact = await ethers.getContractFactory("VelociGaugePluginFactory");
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
        contract: "contracts/plugins/base/VelociGaugePluginFactory.sol:VelociGaugePluginFactory",
        constructorArguments: [
            VOTER_ADDRESS,  
        ],
    });
    console.log("PluginFactory Verified");
}

async function deployPlugin() {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createPlugin(LP_ADDRESS, GAUGE_REWARDS, LP_SYMBOL, { gasPrice: ethers.gasPrice, });
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
        contract: "contracts/plugins/base/VelociGaugePluginFactory.sol:VelociGaugePlugin",
        constructorArguments: [
            await plugin.getUnderlyingAddress(),
            await plugin.velociGauge(),
            pluginFactory.address,
            await plugin.getTokensInUnderlying(),
            await plugin.getBribeTokens(),
            GAUGE_REWARDS,
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

    //===================================================================
    // 4. Transfer Factory Ownership to multisig
    //===================================================================

    // await pluginFactory.transferOwnership(MULTISIG);
  
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });