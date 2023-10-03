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

// MATIC
const MATIC_ADDR = '0xa2036f0538221a77A3937F1379699f44945018d0';
const MATIC_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${MATIC_ADDR}&apikey=${ZKEVM_API_KEY}`;

// USDC
const USDC_ADDR = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035';
const USDC_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${USDC_ADDR}&apikey=${ZKEVM_API_KEY}`;

// BPT0 B-wstETH-STABLE
const BPT0_ADDR = '0xe1F2c039a68A216dE6DD427Be6c60dEcf405762A';
const BPT0_GAUGE = '0x544BDCE27174EA8Ba829939bd3568efc6A6c9c53';
const BPT0_HOLDER = '0xd13e791c573b4d7cf1e32455f076d7c0b7b1e401';

// BPT1 B-rETH-STABLE
const BPT1_ADDR = '0x1d0A8a31CDb04efAC3153237526Fb15cc65A2520';
const BPT1_GAUGE = '0x7733650c7aaF2074FD1fCf98f70cbC09138E1Ea5';
const BPT1_HOLDER = '0x6361dce4fddbf21dd6ef4fb230d6f20d23be7e62';

// BPT2 B-wstETH/rETH-STABLE
const BPT2_ADDR = '0xDF725FdE6E89981Fb30D9bF999841aC2C160b512';
const BPT2_GAUGE = '0x05257970368Efd323aeFfeC95F7e28C806c2e37F';
const BPT2_GAUGE_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${BPT2_GAUGE}&apikey=${ZKEVM_API_KEY}`;
const BPT2_HOLDER = '0x8cb5ee7b4a38f36c2998dc159cd02bbc1160f885';

const BAL_ADDR = '0x120eF59b80774F02211563834d8E3b72cb1649d6';
const WSTETH_ADDR = '0x5D8cfF95D7A57c0BF50B30b43c7CC0D52825D4a9';
const RETH_ADDR = '0xb23C20EFcE6e24Acca0Cef9B7B7aA196b84EC942';
const WETH_ADDR = '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9';

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory, OTOKENFactory, feesFactory, rewarderFactory, gaugeFactory, bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let MATIC, USDC;
let BPT0, BPT0Gauge, plugin0, gauge0, bribe0; // B-wstETH-STABLE
let BPT1, BPT1Gauge, plugin1, gauge1, bribe1; // B-rETH-STABLE
let BPT2, BPT2Gauge, plugin2, gauge2, bribe2; // B-wstETH/rETH-STABLE

describe("zkevm: Balancer Gauge Plugin Testing", function () {
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // MATIC
        response = await axios.get(MATIC_URL);
        const MATIC_ABI = JSON.parse(response.data.result);
        MATIC = new ethers.Contract(MATIC_ADDR, MATIC_ABI, provider);
        await timer(1000);
        console.log("- MATIC Initialized");

        // USDC
        response = await axios.get(USDC_URL);
        const USDC_ABI = JSON.parse(response.data.result);
        USDC = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);
        await timer(1000);
        console.log("- USDC Initialized");

        BPT0 = new ethers.Contract(BPT0_ADDR, MATIC_ABI, provider);
        await timer(1000);
        console.log("- BPT0 Initialized");

        BPT1 = new ethers.Contract(BPT1_ADDR, MATIC_ABI, provider);
        await timer(1000);
        console.log("- BPT1 Initialized");

        BPT2 = new ethers.Contract(BPT2_ADDR, MATIC_ABI, provider);
        await timer(1000);
        console.log("- BPT2 Initialized");

        response = await axios.get(BPT2_GAUGE_URL);
        const BPT2_GAUGE_ABI = JSON.parse(response.data.result);
        BPT2Gauge = new ethers.Contract(BPT2_GAUGE, BPT2_GAUGE_ABI, provider);
        await timer(1000);
        console.log("- BPT2 Gauge Initialized");

        BPT0Gauge = new ethers.Contract(BPT0_GAUGE, BPT2_GAUGE_ABI, provider);
        await timer(1000);
        BPT1Gauge = new ethers.Contract(BPT1_GAUGE, BPT2_GAUGE_ABI, provider);
        await timer(1000);
  
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

        // initialize governor
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
        const pluginFactoryArtifact = await ethers.getContractFactory("BPTGaugePluginFactory");
        const pluginFactoryContract = await pluginFactoryArtifact.deploy(voter.address);
        pluginFactory = await ethers.getContractAt("BPTGaugePluginFactory", pluginFactoryContract.address);
        console.log("- Plugin Factory Initialized");

        // initialize BPT0
        await pluginFactory.createPlugin(BPT0_ADDR, BPT0_GAUGE, [WETH_ADDR, WSTETH_ADDR], [USDC_ADDR, MATIC_ADDR], 'B-wstETH-STABLE');
        plugin0 = await ethers.getContractAt("contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePlugin", await pluginFactory.last_plugin());

        // initialize BPT1
        await pluginFactory.createPlugin(BPT1_ADDR, BPT1_GAUGE, [WETH_ADDR, RETH_ADDR], [BAL_ADDR, USDC_ADDR], 'B-rETH-STABLE');
        plugin1 = await ethers.getContractAt("contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePlugin", await pluginFactory.last_plugin());

        // initialize BPT2
        await pluginFactory.createPlugin(BPT2_ADDR, BPT2_GAUGE, [WSTETH_ADDR, RETH_ADDR], [MATIC_ADDR], 'B-wstETH/rETH-STABLE');
        plugin2 = await ethers.getContractAt("contracts/plugins/zkevm/BPTGaugePluginFactory.sol:BPTGaugePlugin", await pluginFactory.last_plugin());

        // add BPT0 Plugin to Voter
        await voter.addPlugin(plugin0.address);
        let Gauge0Address = await voter.gauges(plugin0.address);
        let Bribe0Address = await voter.bribes(plugin0.address);
        gauge0 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge0Address);
        bribe0 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe0Address);
        console.log("- BPT0 Added in Voter");

        // add BPT1 Plugin to Voter
        await voter.addPlugin(plugin1.address);
        let Gauge1Address = await voter.gauges(plugin1.address);
        let Bribe1Address = await voter.bribes(plugin1.address);
        gauge1 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge1Address);
        bribe1 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe1Address);
        console.log("- BPT1 Added in Voter");

        // add BPT2 Plugin to Voter
        await voter.addPlugin(plugin2.address);
        let Gauge2Address = await voter.gauges(plugin2.address);
        let Bribe2Address = await voter.bribes(plugin2.address);
        gauge2 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge2Address);
        bribe2 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe2Address);
        console.log("- BPT2 Added in Voter");

        console.log("Initialization Complete");
        console.log();

    });

    it("Impersonate BPT0 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [BPT0_HOLDER],});
        const signer = ethers.provider.getSigner(BPT0_HOLDER);

        await BPT0.connect(signer).transfer(user0.address, await BPT0.connect(owner).balanceOf(BPT0_HOLDER));
        
        console.log("Holder BPT0 balance: ", divDec(await BPT0.connect(owner).balanceOf(BPT0_HOLDER)));
        console.log("User0 BPT0 balance: ", divDec(await BPT0.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate BPT1 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [BPT1_HOLDER],});
        const signer = ethers.provider.getSigner(BPT1_HOLDER);

        await BPT1.connect(signer).transfer(user0.address, await BPT1.connect(owner).balanceOf(BPT1_HOLDER));
        
        console.log("Holder BPT1 balance: ", divDec(await BPT1.connect(owner).balanceOf(BPT1_HOLDER)));
        console.log("User0 BPT1 balance: ", divDec(await BPT1.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate BPT2 holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [BPT2_HOLDER],});
        const signer = ethers.provider.getSigner(BPT2_HOLDER);

        await BPT2.connect(signer).transfer(user0.address, await BPT2.connect(owner).balanceOf(BPT2_HOLDER));
        
        console.log("Holder BPT2 balance: ", divDec(await BPT2.connect(owner).balanceOf(BPT2_HOLDER)));
        console.log("User0 BPT2 balance: ", divDec(await BPT2.connect(owner).balanceOf(user0.address)));
    });

    it("User0 deposits in all plugins", async function () {
        console.log("******************************************************");
        await BPT0.connect(user0).approve(plugin0.address, await BPT0.connect(owner).balanceOf(user0.address));
        await plugin0.connect(user0).depositFor(user0.address, await BPT0.connect(owner).balanceOf(user0.address));

        await BPT1.connect(user0).approve(plugin1.address, await BPT1.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).depositFor(user0.address, await BPT1.connect(owner).balanceOf(user0.address));

        await BPT2.connect(user0).approve(plugin2.address, await BPT2.connect(owner).balanceOf(user0.address));
        await plugin2.connect(user0).depositFor(user0.address, await BPT2.connect(owner).balanceOf(user0.address));
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

    it("BPT2Gauge data ", async function () {
        console.log("******************************************************");
        console.log("BPT0");
        console.log("Claimable USDC: ", await BPT0Gauge.connect(owner).claimable_reward(plugin0.address, USDC_ADDR));
        console.log("Claimable MATIC: ", await BPT0Gauge.connect(owner).claimable_reward(plugin0.address, MATIC_ADDR));
        console.log();

        console.log("BPT1");
        console.log("Claimable USDC: ", await BPT1Gauge.connect(owner).claimable_reward(plugin1.address, USDC_ADDR));
        console.log();

        console.log("BPT2");
        console.log("Claimable MATIC: ", await BPT2Gauge.connect(owner).claimable_reward(plugin2.address, MATIC_ADDR));
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
  