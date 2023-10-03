const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const axios = require('axios');

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
const oneHundredThousand = convert("100000", 18);

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory, OTOKENFactory, feesFactory, rewarderFactory, gaugeFactory, bribeFactory;
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;
let QLP, plugin0, gauge0, bribe0;
let WETH, USDC, QUICK, sQLP, fQLP;

function timer(t) {
    return new Promise((r) => setTimeout(r, t));
}

const provider = new ethers.providers.getDefaultProvider(
    "http://127.0.0.1:8545/"
);

const ZKEVM_API_KEY = process.env.ZKEVM_API_KEY || "";

// QLP Holder
const QLP_HOLDER_ADDR = "0x3cdAaF20a4aB415312E2383ec62e37D986d6C0c0";

// WETH
const WETH_ADDR = '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9';
const WETH_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${WETH_ADDR}&apikey=${ZKEVM_API_KEY}`;

// USDC
const USDC_ADDR = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035';
const USDC_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${USDC_ADDR}&apikey=${ZKEVM_API_KEY}`;

// QUICK
const QUICK_ADDR = '0x68286607A1d43602d880D349187c3c48c0fD05E6';
const QUICK_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${QUICK_ADDR}&apikey=${ZKEVM_API_KEY}`;

// sQLP
const sQLP_ADDR = '0x973ae30Cb49986E1D3BdCAB4d40B96fEA5baBE84';
const sQLP_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${sQLP_ADDR}&apikey=${ZKEVM_API_KEY}`;

// fQLP
const fQLP_ADDR = '0xd3Ee28CB8ed02a5641DFA02624dF399b01f1e131';
const fQLP_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${fQLP_ADDR}&apikey=${ZKEVM_API_KEY}`;

// QLP
const QLP_ADDR = '0xC8E48fD037D1C4232F294b635E74d33A0573265a';
const QLP_URL = `https://api-zkevm.polygonscan.com/api?module=contract&action=getabi&address=${QLP_ADDR}&apikey=${ZKEVM_API_KEY}`;


describe("zkevm: QuickSwap QLP Plugin Testing", function () {
    before("Initial set up", async function () {
        console.log("Begin Initialization");
  
        // initialize users
        [owner, multisig, treasury, user0, user1, user2] = await ethers.getSigners();

        // WETH
        response = await axios.get(WETH_URL);
        const WETH_ABI = JSON.parse(response.data.result);
        WETH = new ethers.Contract(WETH_ADDR, WETH_ABI, provider);
        await timer(1000);
        console.log("- WETH Initialized");

        // USDC
        response = await axios.get(USDC_URL);
        const USDC_ABI = JSON.parse(response.data.result);
        USDC = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);
        await timer(1000);
        console.log("- USDC Initialized");

        // QUICK
        response = await axios.get(QUICK_URL);
        const QUICK_ABI = JSON.parse(response.data.result);
        QUICK = new ethers.Contract(QUICK_ADDR, QUICK_ABI, provider);
        await timer(1000);
        console.log("- QUICK Initialized");

        // sQLP
        response = await axios.get(sQLP_URL);
        const sQLP_ABI = JSON.parse(response.data.result);
        sQLP = new ethers.Contract(sQLP_ADDR, sQLP_ABI, provider);
        await timer(1000);
        console.log("- sQLP Initialized");

        // fQLP
        response = await axios.get(fQLP_URL);
        const fQLP_ABI = JSON.parse(response.data.result);
        fQLP = new ethers.Contract(fQLP_ADDR, fQLP_ABI, provider);
        await timer(1000);
        console.log("- fQLP Initialized");
  
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
        await expect(gaugeFactory.connect(user2).setVoter(voter.address)).to.be.revertedWith("GaugeFactory__UnathorizedVoter");
        await expect(gaugeFactory.setVoter(AddressZero)).to.be.revertedWith("GaugeFactory__InvalidZeroAddress");
        await gaugeFactory.setVoter(voter.address);
        await expect(bribeFactory.connect(user2).setVoter(voter.address)).to.be.revertedWith("BribeFactory__UnathorizedVoter");
        await expect(bribeFactory.setVoter(AddressZero)).to.be.revertedWith("BribeFactory__InvalidZeroAddress");
        await bribeFactory.setVoter(voter.address);
        await VTOKEN.connect(owner).addReward(TOKEN.address);
        await VTOKEN.connect(owner).addReward(OTOKEN.address);
        await VTOKEN.connect(owner).addReward(BASE.address);
        await VTOKEN.connect(owner).setVoter(voter.address);
        await OTOKEN.connect(owner).setMinter(minter.address);
        await expect(voter.connect(user2).initialize(minter.address)).to.be.revertedWith("Voter__NotMinter");
        await voter.initialize(minter.address);
        await expect(minter.connect(user2).initialize()).to.be.revertedWith("Minter__UnathorizedInitializer");
        await minter.initialize();
        console.log("- System set up");

        // initialize QLPPlugin
        const pluginArtifact = await ethers.getContractFactory("QLPPlugin");
        const pluginContract = await pluginArtifact.deploy(voter.address, [QLP_ADDR], [WETH_ADDR, QUICK_ADDR, USDC_ADDR]);
        plugin0 = await ethers.getContractAt("QLPPlugin", pluginContract.address);
        console.log("- QLPPlugin Initialized");

        // add TEST0 in xTEST0 Plugin to Voter
        await voter.addPlugin(plugin0.address);
        let Gauge0Address = await voter.gauges(plugin0.address);
        let Bribe0Address = await voter.bribes(plugin0.address);
        gauge0 = await ethers.getContractAt("contracts/GaugeFactory.sol:Gauge", Gauge0Address);
        bribe0 = await ethers.getContractAt("contracts/BribeFactory.sol:Bribe", Bribe0Address);
        console.log("- QLPPlugin Added in Voter");

        console.log("Initialization Complete");
        console.log();

    });

    it("First Test", async function () {
        console.log("******************************************************");
        console.log("Holder sQLP Balance: ", divDec(await sQLP.connect(owner).balanceOf(QLP_HOLDER_ADDR)));
        console.log("Holder fQLP Balance: ", divDec(await fQLP.connect(owner).balanceOf(QLP_HOLDER_ADDR)));
        
        // impersonating QLP_HOLDER's account and transfer QLP to owner
        await network.provider.request({method: "hardhat_impersonateAccount", params: [QLP_HOLDER_ADDR],});
        const qlp_signer = ethers.provider.getSigner(QLP_HOLDER_ADDR);
        await sQLP.connect(qlp_signer).transfer(user0.address, oneHundredThousand);

        console.log("Holder sQLP Balance: ", divDec(await sQLP.connect(owner).balanceOf(QLP_HOLDER_ADDR)));
        console.log("Holder fQLP Balance: ", divDec(await fQLP.connect(owner).balanceOf(QLP_HOLDER_ADDR)));
        console.log("User0 sQLP Balance: ", divDec(await sQLP.connect(owner).balanceOf(user0.address)));
        console.log("User0 fQLP Balance: ", divDec(await fQLP.connect(owner).balanceOf(user0.address)));
    });

    it("User0 deposits in all plugins", async function () {
        console.log("******************************************************");
        await sQLP.connect(user0).approve(plugin0.address, await sQLP.connect(owner).balanceOf(user0.address));
        await plugin0.connect(user0).depositFor(user0.address, await sQLP.connect(owner).balanceOf(user0.address));
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
        await voter.connect(user1).vote([plugin0.address],[ten]);
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

    it("Forward time by 7 days", async function () {
        console.log("******************************************************");
        await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
        await network.provider.send("evm_mine");
    });

    it("Claim data ", async function () {
        console.log("******************************************************");
        console.log("BPT0");
        console.log("Claimable USDC: ", await fQLP.connect(owner).claimable(plugin0.address, USDC_ADDR));
        console.log("Claimable QUICK: ", await fQLP.connect(owner).claimable(plugin0.address, QUICK_ADDR));
        console.log("Claimable WETH: ", await fQLP.connect(owner).claimable(plugin0.address, WETH_ADDR));
        console.log();
    });

    it("Owner calls distribute", async function () {
        console.log("******************************************************");
        await voter.connect(owner).distro();
        await fees.distribute();
        await voter.distributeToBribes([plugin0.address]);
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

    it("User0 withdraws from all gauges", async function () {
        console.log("******************************************************");
        await plugin0.connect(user0).withdrawTo(user0.address, await plugin0.connect(owner).balanceOf(user0.address));
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



});