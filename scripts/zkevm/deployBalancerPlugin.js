const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

// TOKENS
const WETH = '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9';
const WSTETH = '0x5D8cfF95D7A57c0BF50B30b43c7CC0D52825D4a9';
const USDC = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035';
const MATIC = '0xa2036f0538221a77A3937F1379699f44945018d0';

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

// Plugin settings
const BPT_SYMBOL = 'B-wstETH-STABLE Gauge';   // Desired symbol for BPT plugin
const BPT_ADDRESS = '0xe1F2c039a68A216dE6DD427Be6c60dEcf405762A';   // Address of BPT token
const GAUGE_ADDRESS = '0x544BDCE27174EA8Ba829939bd3568efc6A6c9c53'; // BPT Gauge address from balancer
const UNDERLYING_TOKENS = [WETH, WSTETH];   // Tokens in BPT
const GAUGE_REWARDS = [USDC, MATIC];         // Reward tokens from BPT Gauge

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

    // pluginFactory = await ethers.getContractAt("contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePluginFactory", "0x0000000000000000000000000000000000000000");
    // plugin = await ethers.getContractAt("contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePlugin", "0x0000000000000000000000000000000000000000");

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
        contract: "contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePluginFactory",
        constructorArguments: [
            VOTER_ADDRESS,  
        ],
    });
    console.log("PluginFactory Verified");
}

async function deployPlugin(lpSymbol, token0Symbol, token1Symbol) {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createPlugin(BPT_ADDRESS, GAUGE_ADDRESS, UNDERLYING_TOKENS, GAUGE_REWARDS, BPT_SYMBOL, { gasPrice: ethers.gasPrice, });
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
        contract: "contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePlugin",
        constructorArguments: [
            await plugin.getUnderlyingAddress(),
            GAUGE_ADDRESS,
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