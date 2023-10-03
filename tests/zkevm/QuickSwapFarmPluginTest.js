const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const axios = require('axios');
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const AddressZero = "0x0000000000000000000000000000000000000000";
const one = convert("1", 18);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const twenty = convert("20", 18);
const fifty = convert("50", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);

function timer(t) {
    return new Promise((r) => setTimeout(r, t));
}
  
const provider = new ethers.providers.getDefaultProvider(
    "http://127.0.0.1:8545/"
);

const ZKEVM_API_KEY = process.env.ZKEVM_API_KEY || "";

// LP0 LP-QUICK/WETH-WIDE
const LP0_ADDR = '0x686CFe074dD4ac97caC25f37552178b422041a1a';
const LP0_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${LP0_ADDR}&apikey=${ZKEVM_API_KEY}`;
const LP0_PID = 14;
const LP0_HOLDER = '0x67bcD41adBf12D1eCFFD86e17AF2b14179B556a3';

// LP1 LP-CRV/WETH-WIDE
const LP1_ADDR = '0xbAAA5a2D780C5914FB1BAD0Ea6Cbf7B99589d6FE';
const LP1_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${LP1_ADDR}&apikey=${ZKEVM_API_KEY}`;
const LP1_PID = 24;
const LP1_HOLDER = '0x86894b45fa5543eed3c57b031cac574698f358dc';

// LP2 LP-MATIC/WETH-NARROW
const LP2_ADDR = '0x2f39293C9eD046822c014143fB18d5ae0479bE93';
const LP2_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${LP2_ADDR}&apikey=${ZKEVM_API_KEY}`;
const LP2_PID = 2;
const LP2_HOLDER = '0xab8f67dc89ed07ea3b741246eab8852f5092785e';

const QUICK_ADDR = '0x68286607A1d43602d880D349187c3c48c0fD05E6';
const QUICK_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${QUICK_ADDR}&apikey=${ZKEVM_API_KEY}`;

const MASTERCHEF = "0x1e2D8f84605D32a2CBf302E30bFd2387bAdF35dD";
const MASTERCHEF_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${MASTERCHEF}&apikey=${ZKEVM_API_KEY}`;

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory, OTOKENFactory, feesFactory, rewarderFactory, gaugeFactory, bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let QUICK, masterchef;
let LP0, plugin0, gauge0, bribe0; 
let LP1, plugin1, gauge1, bribe1; 
let LP2, plugin2, gauge2, bribe2; 

describe("zkevm: QuickSwap Farm Plugin Testing", function () {
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // QUICK
        response = await axios.get(QUICK_URL);
        const QUICK_ABI = JSON.parse(response.data.result);
        QUICK = new ethers.Contract(QUICK_ADDR, QUICK_ABI, provider);
        await timer(1000);
        console.log("- QUICK Initialized");

        // MASTERCHEF
        response = await axios.get(MASTERCHEF_URL);
        const MASTERCHEF_ABI = JSON.parse(response.data.result);
        masterchef = new ethers.Contract(MASTERCHEF, MASTERCHEF_ABI, provider);
        await timer(1000);
        console.log("- MASTERCHEF Initialized");

        // LP0
        response = await axios.get(LP0_URL);
        const LP0_ABI = JSON.parse(response.data.result);
        LP0 = new ethers.Contract(LP0_ADDR, LP0_ABI, provider);
        await timer(1000);
        console.log("- LP0 Initialized");

        // LP1
        response = await axios.get(LP1_URL);
        const LP1_ABI = JSON.parse(response.data.result);
        LP1 = new ethers.Contract(LP1_ADDR, LP1_ABI, provider);
        await timer(1000);
        console.log("- LP1 Initialized");

        // LP2
        response = await axios.get(LP2_URL);
        const LP2_ABI = JSON.parse(response.data.result);
        LP2 = new ethers.Contract(LP2_ADDR, LP2_ABI, provider);
        await timer(1000);
        console.log("- LP2 Initialized");

        // initialize users
        [owner, multisig, treasury, user0, user1, user2] = await ethers.getSigners();
  
        // initialize ERC20Mocks
        const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
        BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
        console.log("- ERC20Mocks Initialized");

        // initialize OTOKENFactory
        const OTOKENFactoryArtifact = await ethers.getContractFactory("OTOKENFactory");
        OTOKENFactory = await OTOKENFactoryArtifact.deploy();
        console.log("- OTOKENFactory Initialized");

        // initialize VTOKENFactory
        const VTOKENFactoryArtifact = await ethers.getContractFactory("VTOKENFactory");
        VTOKENFactory = await VTOKENFactoryArtifact.deploy();
        console.log("- VTOKENFactory Initialized");

        // initialize FeesFactory
        const FeesFactoryArtifact = await ethers.getContractFactory("TOKENFeesFactory");
        feesFactory = await FeesFactoryArtifact.deploy();
        console.log("- FeesFactory Initialized");

        // initialize RewarderFactory
        const RewarderFactoryArtifact = await ethers.getContractFactory("VTOKENRewarderFactory");
        rewarderFactory = await RewarderFactoryArtifact.deploy();
        console.log("- RewarderFactory Initialized");

        // intialize TOKEN
        const TOKENArtifact = await ethers.getContractFactory("TOKEN");
        TOKEN = await TOKENArtifact.deploy(BASE.address, oneThousand, OTOKENFactory.address, VTOKENFactory.address, rewarderFactory.address, feesFactory.address);
        console.log("- TOKEN Initialized");

        // initialize TOKENFees
        fees = await ethers.getContractAt("contracts/TOKENFeesFactory.sol:TOKENFees", await TOKEN.FEES());
        console.log("- TOKENFees Initialized");

        //initialize OTOKEN
        OTOKEN = await ethers.getContractAt("contracts/OTOKENFactory.sol:OTOKEN", await TOKEN.OTOKEN());
        console.log("- OTOKEN Initialized");

        //initialize VTOKEN
        VTOKEN = await ethers.getContractAt("contracts/VTOKENFactory.sol:VTOKEN", await TOKEN.VTOKEN());
        console.log("- VTOKEN Initialized");

        //initialize VTOKENRewarder
        rewarder = await ethers.getContractAt("contracts/VTOKENRewarderFactory.sol:VTOKENRewarder", await VTOKEN.rewarder());  
        console.log("- VTOKENRewarder Initialized");

        // initialize GaugeFactory
        const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
        const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(owner.address);
        gaugeFactory = await ethers.getContractAt("GaugeFactory", gaugeFactoryContract.address);
        console.log("- GaugeFactory Initialized");

        //initialize BribeFactory
        const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
        const bribeFactoryContract = await bribeFactoryArtifact.deploy(owner.address);
        bribeFactory = await ethers.getContractAt("BribeFactory", bribeFactoryContract.address);
        console.log("- BribeFactory Initialized");

        // initialize Voter
        const voterArtifact = await ethers.getContractFactory("Voter");
        const voterContract = await voterArtifact.deploy(VTOKEN.address, gaugeFactory.address, bribeFactory.address);
        voter = await ethers.getContractAt("Voter", voterContract.address);
        console.log("- Voter Initialized");

        // initialize Minter
        const minterArtifact = await ethers.getContractFactory("Minter");
        const minterContract = await minterArtifact.deploy(voter.address, TOKEN.address, VTOKEN.address, OTOKEN.address);
        minter = await ethers.getContractAt("Minter", minterContract.address);
        console.log("- Minter Initialized");

        // initialize governanor
        const governanceArtifact = await ethers.getContractFactory("TOKENGovernor");
        const governanceContract = await governanceArtifact.deploy(VTOKEN.address);
        governance = await ethers.getContractAt("TOKENGovernor", governanceContract.address);
        console.log("- TOKENGovernor Initialized");

        // initialize Multicall
        const multicallArtifact = await ethers.getContractFactory("Multicall");
        const multicallContract = await multicallArtifact.deploy(voter.address, BASE.address, TOKEN.address, OTOKEN.address, VTOKEN.address, rewarder.address);
        multicall = await ethers.getContractAt("Multicall", multicallContract.address);
        console.log("- Multicall Initialized");

        // System set-up
        await gaugeFactory.setVoter(voter.address);
        await bribeFactory.setVoter(voter.address);
        await VTOKEN.connect(owner).addReward(TOKEN.address);
        await VTOKEN.connect(owner).addReward(OTOKEN.address);
        await VTOKEN.connect(owner).addReward(BASE.address);
        await VTOKEN.connect(owner).setVoter(voter.address);
        await OTOKEN.connect(owner).setMinter(minter.address);
        await voter.initialize(minter.address);
        await minter.initialize();
        console.log("- System set up");

        // initialize Plugin Factory
        const pluginFactoryArtifact = await ethers.getContractFactory("QuickSwapFarmPluginFactory");
        const pluginFactoryContract = await pluginFactoryArtifact.deploy(voter.address);
        pluginFactory = await ethers.getContractAt("QuickSwapFarmPluginFactory", pluginFactoryContract.address);
        console.log("- Plugin Factory Initialized");

        // initialize LP0
        await pluginFactory.createPlugin(LP0_ADDR, LP0_PID, 'LP-QUICK/WETH-WIDE');
        plugin0 = await ethers.getContractAt("contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPlugin", await pluginFactory.last_plugin());

        // initialize LP1
        await pluginFactory.createPlugin(LP1_ADDR, LP1_PID, 'LP-CRV/WETH-WIDE');
        plugin1 = await ethers.getContractAt("contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPlugin", await pluginFactory.last_plugin());

        // initialize LP2
        await pluginFactory.createPlugin(LP2_ADDR, LP2_PID, 'LP-MATIC/WETH-NARROW');
        plugin2 = await ethers.getContractAt("contracts/plugins/zkevm/QuickSwapFarmPluginFactory.sol:QuickSwapFarmPlugin", await pluginFactory.last_plugin());

        // add LP0 Plugin to Voter
        await voter.addPlugin(plugin0.address);
        let Gauge0Address = await voter.gauges(plugin0.address);
        let Bribe0Address = await voter.bribes(plugin0.address);
        gauge0 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge0Address);
        bribe0 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe0Address);
        console.log("- LP0 Added in Voter");

        // add LP1 Plugin to Voter
        await voter.addPlugin(plugin1.address);
        let Gauge1Address = await voter.gauges(plugin1.address);
        let Bribe1Address = await voter.bribes(plugin1.address);
        gauge1 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge1Address);
        bribe1 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe1Address);
        console.log("- LP1 Added in Voter");

        // add LP2 Plugin to Voter
        await voter.addPlugin(plugin2.address);
        let Gauge2Address = await voter.gauges(plugin2.address);
        let Bribe2Address = await voter.bribes(plugin2.address);
        gauge2 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge2Address);
        bribe2 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe2Address);
        console.log("- LP2 Added in Voter");

        console.log("Initialization Complete");
        console.log();

    });

    it("Impersonate LP0 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [LP0_HOLDER],});
        const signer = ethers.provider.getSigner(LP0_HOLDER);

        await LP0.connect(signer).transfer(user0.address, await LP0.connect(owner).balanceOf(LP0_HOLDER));
        
        console.log("Holder LP0 balance: ", divDec(await LP0.connect(owner).balanceOf(LP0_HOLDER)));
        console.log("User0 LP0 balance: ", divDec(await LP0.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate LP1 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [LP1_HOLDER],});
        const signer = ethers.provider.getSigner(LP1_HOLDER);

        await LP1.connect(signer).transfer(user0.address, await LP1.connect(owner).balanceOf(LP1_HOLDER));
        
        console.log("Holder LP1 balance: ", divDec(await LP1.connect(owner).balanceOf(LP1_HOLDER)));
        console.log("User0 LP1 balance: ", divDec(await LP1.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate LP2 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [LP2_HOLDER],});
        const signer = ethers.provider.getSigner(LP2_HOLDER);

        await LP2.connect(signer).transfer(user0.address, await LP2.connect(owner).balanceOf(LP2_HOLDER));
        
        console.log("Holder LP2 balance: ", divDec(await LP2.connect(owner).balanceOf(LP2_HOLDER)));
        console.log("User0 LP2 balance: ", divDec(await LP2.connect(owner).balanceOf(user0.address)));
    });

    it("User0 deposits in all plugins", async function () {
        console.log("******************************************************");
        await LP0.connect(user0).approve(plugin0.address, await LP0.connect(owner).balanceOf(user0.address));
        await plugin0.connect(user0).depositFor(user0.address, await LP0.connect(owner).balanceOf(user0.address));

        await LP1.connect(user0).approve(plugin1.address, await LP1.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).depositFor(user0.address, await LP1.connect(owner).balanceOf(user0.address));

        await LP2.connect(user0).approve(plugin2.address, await LP2.connect(owner).balanceOf(user0.address));
        await plugin2.connect(user0).depositFor(user0.address, await LP2.connect(owner).balanceOf(user0.address));
    });

    it("Mint test tokens to each user", async function () {
        console.log("******************************************************");
        await BASE.mint(user0.address, 1000);
        await BASE.mint(user1.address, 1000);
        await BASE.mint(user2.address, 1000);
    });

    it("User1 Buys TOKEN with 100 BASE", async function () {
        console.log("******************************************************");
        await BASE.connect(user1).approve(TOKEN.address, oneHundred);
        await TOKEN.connect(user1).buy(oneHundred, 1, 1992282187, user1.address, AddressZero);
    });

    it("User1 stakes 50 TOKEN", async function () {
        console.log("******************************************************");
        await TOKEN.connect(user1).approve(VTOKEN.address, fifty);
        await VTOKEN.connect(user1).deposit(fifty);
    });

    it("User1 Sells 1 TOKEN", async function () {
        console.log("******************************************************");
        await TOKEN.connect(user1).approve(TOKEN.address, await TOKEN.balanceOf(user1.address));
        await TOKEN.connect(user1).sell(await TOKEN.balanceOf(user1.address), 1, 1992282187, user1.address, user2.address);
    });

    it("user1 votes on plugins", async function () {
        console.log("******************************************************");
        await voter.connect(user1).vote([plugin0.address, plugin1.address, plugin2.address],[ten, ten, ten]);
    });

    it("BondingCurveData, user1", async function () {
        console.log("******************************************************");
        let res = await multicall.bondingCurveData(user1.address);
        console.log("GLOBAL DATA");
        console.log("Price BASE: $", divDec(res.priceBASE));
        console.log("Price TOKEN: $", divDec(res.priceTOKEN));
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Total Value Locked: $", divDec(res.tvl));
        console.log('Market Cap: $', divDec(res.marketCap));
        console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
        console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
        console.log("APR: ", divDec(res.apr), "%");
        console.log("Loan-to-Value: ", divDec(res.ltv), "%");
        console.log("WeeklyOTOKEN: ", divDec(res.weekly));
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance BASE: ", divDec(res.accountBASE));
        console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
        console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
        console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
        console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
        console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
        console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
        console.log("Voting Power: ", divDec(res.accountVotingPower));
        console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
        console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
        console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
        console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
    });

    it("GaugeCardData, plugin0, user1", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin0.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("BribeCardData, plugin0, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin0.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("GaugeCardData, plugin0, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin0.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin1, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin1.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin2, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin2.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("Forward time by 7 days", async function () {
        console.log("******************************************************");
        await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
        await network.provider.send("evm_mine");
    });

    it("GaugeCardData, plugin0, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin0.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin1, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin1.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin2, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin2.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("BribeCardData, plugin0, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin2.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("LPFarm data ", async function () {
        console.log("******************************************************");
        console.log("LP0");
        console.log("Claimable QUICK: ", await masterchef.connect(owner).pendingSushi(LP0_PID, plugin0.address));
        console.log();

        console.log("LP1");
        console.log("Claimable QUICK: ", await masterchef.connect(owner).pendingSushi(LP1_PID, plugin1.address));
        console.log();

        console.log("LP2");
        console.log("Claimable QUICK: ", await masterchef.connect(owner).pendingSushi(LP2_PID, plugin2.address));
        console.log();
    });

    it("Owner calls distribute", async function () {
        console.log("******************************************************");
        await voter.connect(owner).distro();
        await fees.distribute();
        await voter.distributeToBribes([plugin0.address, plugin1.address, plugin2.address]);
    });

    it("BribeCardData, plugin0, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin0.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("BribeCardData, plugin1, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin1.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("BribeCardData, plugin2, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin2.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("Forward time by 7 days", async function () {
        console.log("******************************************************");
        await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
        await network.provider.send("evm_mine");
    });

    it("BribeCardData, plugin0, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin0.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("BribeCardData, plugin1, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin1.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("BribeCardData, plugin2, user1 ", async function () {
        console.log("******************************************************");
        let res = await multicall.bribeCardData(plugin2.address, user1.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.bribe);
        console.log("Plugin: ", res.plugin);
        console.log("Reward Tokens: ");
        for (let i = 0; i < res.rewardTokens.length; i++) {
            console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
        }
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Voting Weight: ", divDec(res.voteWeight));
        console.log("Voting percent: ", divDec(res.votePercent), "%");
        console.log("Reward Per Token: ");
        for (let i = 0; i < res.rewardsPerToken.length; i++) {
            console.log(" - ", divDec(res.rewardsPerToken[i]));
        }
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Account Votes: ", divDec(res.accountVote));
        console.log("Earned Rewards: ");
        for (let i = 0; i < res.accountRewardsEarned.length; i++) {
            console.log(" - ", divDec(res.accountRewardsEarned[i]));
        }
    });

    it("User0 withdraws from all gauges", async function () {
        console.log("******************************************************");
        await plugin0.connect(user0).withdrawTo(user0.address, await plugin0.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).withdrawTo(user0.address, await plugin1.connect(owner).balanceOf(user0.address));
        await plugin2.connect(user0).withdrawTo(user0.address, await plugin2.connect(owner).balanceOf(user0.address));
    });

    it("GaugeCardData, plugin0, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin0.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin1, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin1.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

    it("GaugeCardData, plugin2, user0", async function () {
        console.log("******************************************************");
        let res = await multicall.gaugeCardData(plugin2.address, user0.address);
        console.log("INFORMATION");
        console.log("Gauge: ", res.gauge);
        console.log("Plugin: ", res.plugin);
        console.log("Underlying: ", res.underlying);
        console.log("Tokens in Underlying: ");
        for (let i = 0; i < res.tokensInUnderlying.length; i++) {
            console.log(" - ", res.tokensInUnderlying[i]);
        }
        console.log("Underlying Decimals: ", res.underlyingDecimals);
        console.log("Is Alive: ", res.isAlive);
        console.log();
        console.log("GLOBAL DATA");
        console.log("Protocol: ", res.protocol);
        console.log("Symbol: ", res.symbol);
        console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
        console.log("Reward Per token: ", divDec(res.rewardPerToken)); 
        console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
        console.log("Total Supply: ", divDec(res.totalSupply));
        console.log("Voting Weight: ", divDec(res.votingWeight), "%");
        console.log();
        console.log("ACCOUNT DATA");
        console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
        console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
        console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
    });

  });
  