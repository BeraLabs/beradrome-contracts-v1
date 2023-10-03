const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

// TOKENS
const WETH = '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9';
const QUICK = '0x68286607A1d43602d880D349187c3c48c0fD05E6';
const USDC = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035';
const QLP = '0xC8E48fD037D1C4232F294b635E74d33A0573265a';

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// Plugin settings
const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise (( resolve) => setTimeout (resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {

    // plugin = await ethers.getContractAt("contracts/plugins/zkevm/QLPPlugin.sol:QLPPlugin", "0x0000000000000000000000000000000000000000");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPlugin() {
    console.log('Starting PluginFactory Deployment');
    const pluginArtifact = await ethers.getContractFactory("QLPPlugin");
    const pluginContract = await pluginArtifact.deploy(VOTER_ADDRESS, [QLP], [WETH, QUICK, USDC], { gasPrice: ethers.gasPrice, });
    plugin = await pluginContract.deployed();
    await sleep(5000);
    console.log("PluginDeployed at:", plugin.address);
    console.log('**************************************************************');
    console.log("Plugin: ", plugin.address);
    console.log('**************************************************************');
}

async function verifyPlugin() {
    console.log('Starting Plugin Verification');
    await hre.run("verify:verify", {
        address: plugin.address,
        contract: "contracts/plugins/zkevm/QLPPlugin.sol:QLPPlugin",
        constructorArguments: [
            VOTER_ADDRESS,
            await plugin.getTokensInUnderlying(),
            await plugin.getBribeTokens(),
        ],  
    });
    console.log("LPMockPlugin Verified");
}

async function main() {

    const [wallet] = await ethers.getSigners();
    console.log('Using wallet: ', wallet.address);
  
    await getContracts();
    
    //===================================================================
    // 1. Deploy Plugin
    //===================================================================
    // Only deploy one plugin at a time

    // await deployPlugin();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 2. Verify Plugin
    //===================================================================

    // await verifyPlugin();
  
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });