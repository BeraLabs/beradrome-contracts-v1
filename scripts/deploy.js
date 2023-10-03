const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const MARKET_RESERVES = '1000';   // 1000 TOKEN in market reserves

const BASE_ADDRESS = '0x4200000000000000000000000000000000000006';  // BASE Token Address (eg WETH on zkEVM)
const MULTISIG = '0x317d250c6a3d66835fb9f798647b63e40b6c844a';      // Multisig Address

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise (( resolve) => setTimeout (resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const BUILDER_ADDRESS = '0xDeb7d9B443a3ab779DFe9Ff2Aa855b1eA5fD318e';

// Contract Variables
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let OTOKENFactory, VTOKENFactory, rewarderFactory;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {

     OTOKENFactory = await ethers.getContractAt("contracts/OTOKENFactory.sol:OTOKENFactory", "0xd54B64A096b785d19CFf3f19061509230736590c");
     VTOKENFactory = await ethers.getContractAt("contracts/VTOKENFactory.sol:VTOKENFactory", "0x5Ed50fbB15d047B2b6BC0E6FAdE25A3B1eee106d");
     feesFactory = await ethers.getContractAt("contracts/TOKENFeesFactory.sol:TOKENFeesFactory", "0x56DF157dec576Cc2596257FB17115a7ea0329e01");
     rewarderFactory = await ethers.getContractAt("contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory", "0x58Dd173F30EcfFdfEbCd242C71241fB2f179e9B9");

     TOKEN = await ethers.getContractAt("contracts/TOKEN.sol:TOKEN", "0x46e77D8349BA8AE9137B89196A61FFEE2c8c64B4");
     OTOKEN = await ethers.getContractAt("contracts/OTOKENFactory.sol:OTOKEN", await TOKEN.OTOKEN());
     VTOKEN = await ethers.getContractAt("contracts/VTOKENFactory.sol:VTOKEN", await TOKEN.VTOKEN());
     fees = await ethers.getContractAt("contracts/TOKENFeesFactory.sol:TOKENFees", await TOKEN.FEES());
     rewarder = await ethers.getContractAt("contracts/VTOKENRewarderFactory.sol:VTOKENRewarder", await VTOKEN.rewarder());
     governor = await ethers.getContractAt("contracts/TOKENGovernor.sol:TOKENGovernor", "0xE23E1a116090A0829b7Ab536a3aF463A5A36A5A5");

     gaugeFactory = await ethers.getContractAt("contracts/GaugeFactory.sol:GaugeFactory", "0x9714412E8838337E60C8f7b4C2Bc49247964c0fd");
     bribeFactory = await ethers.getContractAt("contracts/BribeFactory.sol:BribeFactory", "0x756fC5e6BdB26A85594346D7D0520E1c0e492452");
     voter = await ethers.getContractAt("contracts/Voter.sol:Voter", "0xF49222fCCBa2c149B3Ff3AE9D3A30eDb1f162576");
     minter = await ethers.getContractAt("contracts/Minter.sol:Minter", "0x3Bb30CA0Bf95D6a2Fc8aD9087BAC92711BF0947e");

     multicall = await ethers.getContractAt("contracts/Multicall.sol:Multicall", "0x1Eeb34B653d396Cdc60A9C434C09E1803dd4904E");
     controller = await ethers.getContractAt("contracts/Controller.sol:Controller", "0x48377A5b243a17e23b6A782a2e2172b39A786064");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployOTOKENFactory() {
    console.log('Starting OTOKENFactory Deployment');
    const OTOKENFactoryArtifact = await ethers.getContractFactory("OTOKENFactory");
    const OTOKENFactoryContract = await OTOKENFactoryArtifact.deploy({ gasPrice: ethers.gasPrice, });
    OTOKENFactory = await OTOKENFactoryContract.deployed();
    await sleep(5000);
    console.log("OTOKENFactory Deployed at:", OTOKENFactory.address);
}

async function deployVTOKENFactory() {
    console.log('Starting VTOKENFactory Deployment');
    const VTOKENFactoryArtifact = await ethers.getContractFactory("VTOKENFactory");
    const VTOKENFactoryContract = await VTOKENFactoryArtifact.deploy({ gasPrice: ethers.gasPrice, });
    VTOKENFactory = await VTOKENFactoryContract.deployed();
    await sleep(5000);
    console.log("VTOKENFactory Deployed at:", VTOKENFactory.address);
}

async function deployFeesFactory() {
    console.log('Starting FeesFactory Deployment');
    const feesFactoryArtifact = await ethers.getContractFactory("TOKENFeesFactory");
    const feesFactoryContract = await feesFactoryArtifact.deploy({ gasPrice: ethers.gasPrice, });
    feesFactory = await feesFactoryContract.deployed();
    await sleep(5000);
    console.log("FeesFactory Deployed at:", feesFactory.address);
}

async function deployRewarderFactory() {
    console.log('Starting RewarderFactory Deployment');
    const rewarderFactoryArtifact = await ethers.getContractFactory("VTOKENRewarderFactory");
    const rewarderFactoryContract = await rewarderFactoryArtifact.deploy({ gasPrice: ethers.gasPrice, });
    rewarderFactory = await rewarderFactoryContract.deployed();
    await sleep(5000);
    console.log("RewarderFactory Deployed at:", rewarderFactory.address);
}

async function printFactoryAddresses() {
    console.log('**************************************************************');
    console.log("OTOKENFactory: ", OTOKENFactory.address);
    console.log("VTOKENFactory: ", VTOKENFactory.address);
    console.log("FeesFactory: ", feesFactory.address);
    console.log("RewarderFactory: ", rewarderFactory.address);
    console.log('**************************************************************');
}

async function deployTOKEN() {
    console.log('Starting TOKEN Deployment');
    const TOKENArtifact = await ethers.getContractFactory("TOKEN");
    const TOKENContract = await TOKENArtifact.deploy(BASE_ADDRESS, convert(MARKET_RESERVES, 18), OTOKENFactory.address, VTOKENFactory.address, rewarderFactory.address, feesFactory.address, { gasPrice: ethers.gasPrice, });
    TOKEN = await TOKENContract.deployed();
    OTOKEN = await ethers.getContractAt("contracts/OTOKENFactory.sol:OTOKEN", await TOKEN.OTOKEN());
    VTOKEN = await ethers.getContractAt("contracts/VTOKENFactory.sol:VTOKEN", await TOKEN.VTOKEN());
    fees = await ethers.getContractAt("contracts/TOKENFeesFactory.sol:TOKENFees", await TOKEN.FEES());
    rewarder = await ethers.getContractAt("contracts/VTOKENRewarderFactory.sol:VTOKENRewarder", await VTOKEN.rewarder());
    await sleep(5000);
    console.log("TOKEN Deployed at:", TOKEN.address);
}

async function deployGovernor() {
    console.log('Starting Governor Deployment');
    const governorArtifact = await ethers.getContractFactory("TOKENGovernor");
    const governorContract = await governorArtifact.deploy(VTOKEN.address, { gasPrice: ethers.gasPrice, });
    governor = await governorContract.deployed();
    await sleep(5000);
    console.log("Governor Deployed at:", governor.address);
}

async function printTokenAddresses() {
    console.log('**************************************************************');
    console.log("TOKEN: ", TOKEN.address);
    console.log("OTOKEN: ", OTOKEN.address);
    console.log("VTOKEN: ", VTOKEN.address);
    console.log("Fees: ", fees.address);
    console.log("Rewarder: ", rewarder.address);
    console.log("Governor: ", governor.address);
    console.log('**************************************************************');
}

async function verifyTOKEN() {
    console.log('Starting TOKEN Verification');
    await hre.run("verify:verify", {
        address: TOKEN.address,
        contract: "contracts/TOKEN.sol:TOKEN",
        constructorArguments: [
        BASE_ADDRESS, 
        convert(MARKET_RESERVES, 18), 
        OTOKENFactory.address,
        VTOKENFactory.address,
        rewarderFactory.address,
        feesFactory.address
        ],
    });
    console.log("TOKEN Verified");
}

async function verifyOTOKEN(wallet) {
    console.log('Starting OTOKEN Verification');
    await hre.run("verify:verify", {
        address: OTOKEN.address,
        contract: "contracts/OTOKENFactory.sol:OTOKEN",
        constructorArguments: [
        wallet, 
        ],
    });
    console.log("OTOKEN Verified");
}

async function verifyVTOKEN() {
    console.log('Starting VTOKEN Verification');
    await hre.run("verify:verify", {
        address: VTOKEN.address,
        contract: "contracts/VTOKENFactory.sol:VTOKEN",
        constructorArguments: [
        TOKEN.address,
        OTOKEN.address,
        rewarderFactory.address,
        ],
    });
    console.log("VTOKEN Verified");
}

async function verifyTOKENFees() {
    console.log("TOKENFees Deployed at:", fees.address);
    console.log('Starting TOKENFees Verification');
    await hre.run("verify:verify", {
        address: await fees.address,
        contract: "contracts/TOKENFeesFactory.sol:TOKENFees",
        constructorArguments: [
        rewarder.address,
        TOKEN.address, 
        BASE_ADDRESS, 
        OTOKEN.address, 
        ],
    });
    console.log("TOKENFees Verified");
}

async function verifyRewarder() {
    console.log("Rewarder Deployed at:", rewarder.address);
    console.log('Starting Rewarder Verification');
    await hre.run("verify:verify", {
        address: rewarder.address,
        contract: "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
        constructorArguments: [
        VTOKEN.address, 
        ],
    });
    console.log("Rewarder Verified");
}

async function verifyGovernor() {
    console.log('Starting Governor Verification');
    await hre.run("verify:verify", {
        address: governor.address,
        contract: "contracts/TOKENGovernor.sol:TOKENGovernor",
        constructorArguments: [
        VTOKEN.address,
        ],
    });
    console.log("Governor Verified");
}

async function deployGaugeFactory(wallet) {
    console.log('Starting GaugeFactory Deployment');
    const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
    const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(wallet, { gasPrice: ethers.gasPrice, });
    gaugeFactory = await gaugeFactoryContract.deployed();
    await sleep(5000);
    console.log("GaugeFactory Deployed at:", gaugeFactory.address);
}

async function deployBribeFactory(wallet) {
    console.log('Starting BribeFactory Deployment');
    const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
    const bribeFactoryContract = await bribeFactoryArtifact.deploy(wallet, { gasPrice: ethers.gasPrice, });
    bribeFactory = await bribeFactoryContract.deployed();
    await sleep(5000);
    console.log("BribeFactory Deployed at:", bribeFactory.address);
}

async function deployVoter() {
    console.log('Starting Voter Deployment');
    const voterArtifact = await ethers.getContractFactory("Voter");
    const voterContract = await voterArtifact.deploy(VTOKEN.address, gaugeFactory.address, bribeFactory.address, { gasPrice: ethers.gasPrice, });
    voter = await voterContract.deployed();
    await sleep(5000);
    console.log("Voter Deployed at:", voter.address);
}

async function deployMinter() {
    console.log('Starting Minter Deployment');
    const minterArtifact = await ethers.getContractFactory("Minter");
    const minterContract = await minterArtifact.deploy(voter.address, TOKEN.address, VTOKEN.address, OTOKEN.address, { gasPrice: ethers.gasPrice, });
    minter = await minterContract.deployed();
    await sleep(5000);
    console.log("Minter Deployed at:", minter.address);
}

async function printVotingAddresses() {
    console.log('**************************************************************');
    console.log("GaugeFactory: ", gaugeFactory.address);
    console.log("BribeFactory: ", bribeFactory.address);
    console.log("Voter: ", voter.address);
    console.log("Minter: ", minter.address);
    console.log('**************************************************************');
}

async function verifyGaugeFactory(wallet) {
    console.log('Starting GaugeFactory Verification');
    await hre.run("verify:verify", {
        address: gaugeFactory.address,
        contract: "contracts/GaugeFactory.sol:GaugeFactory",
        constructorArguments: [
        wallet, 
        ],
    }); 
    console.log("GaugeFactory Verified");
}

async function verifyBribeFactory(wallet) {
    console.log('Starting BribeFactory Verification');
    await hre.run("verify:verify", {
        address: bribeFactory.address,
        contract: "contracts/BribeFactory.sol:BribeFactory",
        constructorArguments: [
        wallet, 
        ],
    });
    console.log("BribeFactory Verified");
}

async function verifyVoter() {
    console.log('Starting Voter Verification');
    await hre.run("verify:verify", {
        address: voter.address,
        contract: "contracts/Voter.sol:Voter",
        constructorArguments: [
        VTOKEN.address,
        gaugeFactory.address,
        bribeFactory.address,
        ],
    });
    console.log("Voter Verified");
}

async function verifyMinter() {
    console.log('Starting Minter Verification');
    await hre.run("verify:verify", {
        address: minter.address,
        contract: "contracts/Minter.sol:Minter",
        constructorArguments: [
        voter.address, 
        TOKEN.address,
        VTOKEN.address,
        OTOKEN.address,
        ],
    });
    console.log("Minter Verified");
}

async function deployMulticall() {
    console.log('Starting Multicall Deployment');
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(voter.address, BASE_ADDRESS, TOKEN.address, OTOKEN.address, VTOKEN.address, rewarder.address, { gasPrice: ethers.gasPrice, });
    multicall = await multicallContract.deployed();
    await sleep(5000);
    console.log("Multicall Deployed at:", multicall.address);
}

async function deployController() {
    console.log('Starting Controller Deployment');
    const controllerArtifact = await ethers.getContractFactory("Controller");
    const controllerContract = await controllerArtifact.deploy(voter.address, fees.address, { gasPrice: ethers.gasPrice, });
    controller = await controllerContract.deployed();
    await sleep(5000);
    console.log("Controller Deployed at:", controller.address);
}

async function printAncillaryAddresses() {
    console.log('**************************************************************');
    console.log("Multicall: ", multicall.address);
    console.log("Controller: ", controller.address);
    console.log('**************************************************************');
}

async function verifyMulticall() {
console.log('Starting Multicall Verification');
    await hre.run("verify:verify", {
        address: multicall.address,
        contract: "contracts/Multicall.sol:Multicall",
        constructorArguments: [
        voter.address, 
        BASE_ADDRESS,
        TOKEN.address,
        OTOKEN.address,
        VTOKEN.address,
        rewarder.address
        ],
    });
    console.log("Multicall Verified");
}

async function verifyController() {
    console.log('Starting Controller Verification');
    await hre.run("verify:verify", {
        address: controller.address,
        contract: "contracts/Controller.sol:Controller",
        constructorArguments: [
        voter.address, 
        fees.address
        ],
    });
    console.log("Controller Verified");
}

async function setUpSystem(wallet) {
    console.log('Starting System Set Up');

    let amount = await OTOKEN.totalSupply();
    amount = amount.div(10);
    await OTOKEN.approve(VTOKEN.address, amount);
    await VTOKEN.burnFor(BUILDER_ADDRESS, amount);
    amount = await OTOKEN.balanceOf(wallet);
    await OTOKEN.transfer(MULTISIG, amount);
    console.log("OTOKEN Allocated");

    await sleep(5000);
    await gaugeFactory.setVoter(voter.address);
    await sleep(5000);
    await bribeFactory.setVoter(voter.address);
    await sleep(5000);
    console.log("Factories Set Up");

    await VTOKEN.addReward(TOKEN.address);
    await sleep(5000);
    await VTOKEN.addReward(OTOKEN.address);
    await sleep(5000);
    await VTOKEN.addReward(BASE_ADDRESS);
    await sleep(5000);
    console.log("VTOKEN Rewards Set Up");

    await VTOKEN.setVoter(voter.address);
    await sleep(5000);
    await OTOKEN.setMinter(minter.address);
    await sleep(5000);
    console.log("Token-Voting Set Up");

    await voter.initialize(minter.address);
    await sleep(5000);
    await minter.initialize();
    await sleep(5000);
    console.log("System Initialized");
}

async function transferOwnership() {

    await minter.setTeam(MULTISIG);
    await sleep(5000);
    console.log("Minter team set to MULTISIG");

    await minter.transferOwnership(governor.address);
    await sleep(5000);
    console.log("Minter ownership transferred to governor");

    await voter.transferOwnership(governor.address);
    await sleep(5000);
    console.log("Voter ownership transferred to governor");

    await VTOKEN.transferOwnership(governor.address);
    await sleep(5000);
    console.log("VTOKEN ownership transferred to governor");
}

async function main() {

    const [wallet] = await ethers.getSigners();
    console.log('Using wallet: ', wallet.address);
  
    await getContracts();
    
    //===================================================================
    // 1. Deploy Token Factories
    //===================================================================

     //console.log('Starting Factory Deployment');
     //await deployOTOKENFactory();
     //await deployVTOKENFactory();
     //await deployFeesFactory();
     //await deployRewarderFactory();
     //await printFactoryAddresses();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 2. Deploy Token
    //===================================================================

     //console.log('Starting Token Deployment');
     //await deployTOKEN();
     //await deployGovernor();
     //await printTokenAddresses();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 3. Deploy Voting System
    //===================================================================
  
     //console.log('Starting Voting Deployment');
     //await deployGaugeFactory(wallet.address); 
     //await deployBribeFactory(wallet.address);
     //await deployVoter();
     //await deployMinter();
     //await printVotingAddresses();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 4. Deploy Ancillary Contracts
    //===================================================================

     //console.log('Starting Ancillary Deployment');
     //await deployMulticall();
     //await deployController();
     //await printAncillaryAddresses();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 5. Verify Token Contracts
    //===================================================================

     //console.log('Starting Token Verification');
     //await verifyTOKEN();
     //await verifyOTOKEN(wallet.address);
     //await verifyVTOKEN();
     //await verifyTOKENFees();
     //await verifyRewarder();
     //await verifyGovernor();
     //console.log("Token Contracts Verified")

    //===================================================================
    // 6. Verify Voting Contracts
    //===================================================================

     //console.log('Starting Voting Verification');
     //await verifyGaugeFactory(wallet.address); 
     //await verifyBribeFactory(wallet.address);
     //await verifyVoter();
     //await verifyMinter();
     //console.log("Voting Contracts Verified")

    //===================================================================
    // 7. Verify Ancillary Contracts
    //===================================================================

     //console.log('Starting Ancillary Verification');
     //await verifyMulticall();
     //await verifyController();
     //console.log("Ancillary Contracts Verified")
  
    //===================================================================
    // 8. Set Up System
    //===================================================================

     //console.log('Starting System Set Up');
     //await setUpSystem(wallet.address);
     //console.log("System Set Up")

    //===================================================================
    // 9. Transfer Ownership
    //===================================================================

     console.log('Starting Ownership Transfer');
     await transferOwnership();
     console.log("Ownership Transferred");
  
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });