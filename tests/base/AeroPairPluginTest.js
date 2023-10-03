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
const fiveThousand = convert("5000", 18);
const fiveThousand6 = convert("5000", 6);
const tenThousand6 = convert("10000", 6);
const oneHundred6 = convert("100", 6);

function timer(t) {
    return new Promise((r) => setTimeout(r, t));
}
  
const provider = new ethers.providers.getDefaultProvider(
    "http://127.0.0.1:8545/"
);

const BASE_API_KEY = process.env.BASE_API_KEY || "";

const AERO_ADDR = '0x940181a94A35A4569E4529A3CDfB74e38FD98631';
const AERO_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${AERO_ADDR}&apikey=${BASE_API_KEY}`;
const AERO_HOLDER = '0xa64c62c987b942c63802101c37552eda1058ef62'

const WETH_ADDR = '0x4200000000000000000000000000000000000006';
const WETH_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${WETH_ADDR}&apikey=${BASE_API_KEY}`;
const WETH_HOLDER = '0x4b581deda2f2c0650c3dfc506c86a8c140d9f699';

const USDbC_ADDR = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA';
const USDbC_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=0x1833C6171E0A3389B156eAedB301CFfbf328B463&apikey=${BASE_API_KEY}`;
const USDbC_HOLDER = '0x20f03e26968b179025f65c1f4afadfd3959c8d03';

const MAI_ADDR = '0xbf1aeA8670D2528E08334083616dD9C5F3B087aE';
const MAI_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${MAI_ADDR}&apikey=${BASE_API_KEY}`;
const MAI_HOLDER = '0x1e557c24fc7ac9989c78c017b91bf0b0ad63334d';

// vLP-AERO/WETH
const LP0_ADDR = '0x7f670f78B17dEC44d5Ef68a48740b6f8849cc2e6';
const LP0_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP0_ADDR}&apikey=${BASE_API_KEY}`;
const LP0_HOLDER = '0x0e170a52628cd836059f5f2e6ffb5c1230e10266';

// sLP-MAI/USDbC
const LP1_ADDR = '0xf6Aec4F97623E691a9426a69BaF5501509fCa05D';
const LP1_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP1_ADDR}&apikey=${BASE_API_KEY}`;
const LP1_HOLDER = '0x7d13deee5864625dc0c1df65cb3c9768a2e73d75';

// ROUTER
const ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const ROUTER_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${ROUTER}&apikey=${BASE_API_KEY}`;

// FACTORY
const FACTORY = '0x420dd381b31aef6683db6b902084cb0ffece40da';

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory, OTOKENFactory, feesFactory, rewarderFactory, gaugeFactory, bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let AERO, WETH, USDbC, MAI, router;
let LP0, plugin0, gauge0, bribe0;
let LP1, plugin1, gauge1, bribe1;

describe("base: Aerodrome pair Testing", function () {
    before("Initial set up", async function () {
        console.log("Begin Initialization");

        // Router
        response = await axios.get(ROUTER_URL);
        const ROUTER_ABI = JSON.parse(response.data.result);
        router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);
        await timer(1000);
        console.log("- router Initialized");

        // AERO
        response = await axios.get(AERO_URL);
        const AERO_ABI = JSON.parse(response.data.result);
        AERO = new ethers.Contract(AERO_ADDR, AERO_ABI, provider);
        await timer(1000);
        console.log("- AERO Initialized");

        // WETH
        response = await axios.get(WETH_URL);
        const WETH_ABI = JSON.parse(response.data.result);
        WETH = new ethers.Contract(WETH_ADDR, WETH_ABI, provider);
        await timer(1000);
        console.log("- WETH Initialized");

        // USDbC
        response = await axios.get(USDbC_URL);
        const USDbC_ABI = JSON.parse(response.data.result);
        USDbC = new ethers.Contract(USDbC_ADDR, USDbC_ABI, provider);
        await timer(1000);
        console.log("- USDbC Initialized");

        // MAI
        response = await axios.get(MAI_URL);
        const MAI_ABI = JSON.parse(response.data.result);
        MAI = new ethers.Contract(MAI_ADDR, MAI_ABI, provider);
        await timer(1000);
        console.log("- MAI Initialized");

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
        const pluginFactoryArtifact = await ethers.getContractFactory("AeroPairPluginFactory");
        const pluginFactoryContract = await pluginFactoryArtifact.deploy(voter.address);
        pluginFactory = await ethers.getContractAt("AeroPairPluginFactory", pluginFactoryContract.address);
        console.log("- Plugin Factory Initialized");

        // initialize LP0
        await pluginFactory.createPlugin(LP0.address, 'vLP-AERO/WETH');
        plugin0 = await ethers.getContractAt("contracts/plugins/base/AeroPairPluginFactory.sol:AeroPairPlugin", await pluginFactory.last_plugin());

        // initialize LP1
        await pluginFactory.createPlugin(LP1.address, 'sLP-MAI/USDbC');
        plugin1 = await ethers.getContractAt("contracts/plugins/base/AeroPairPluginFactory.sol:AeroPairPlugin", await pluginFactory.last_plugin());

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

        console.log("Initialization Complete");
        console.log();

    });

    it("Impersonate AERO holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [AERO_HOLDER],});
        const signer = ethers.provider.getSigner(AERO_HOLDER);

        await AERO.connect(signer).transfer(user0.address, await AERO.connect(owner).balanceOf(AERO_HOLDER));
        
        console.log("Holder AERO balance: ", divDec(await AERO.connect(owner).balanceOf(AERO_HOLDER)));
        console.log("User0 AERO balance: ", divDec(await AERO.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate WETH holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [WETH_HOLDER],});
        const signer = ethers.provider.getSigner(WETH_HOLDER);

        await WETH.connect(signer).transfer(user0.address, await WETH.connect(owner).balanceOf(WETH_HOLDER));
        
        console.log("Holder WETH balance: ", divDec(await WETH.connect(owner).balanceOf(WETH_HOLDER)));
        console.log("User0 WETH balance: ", divDec(await WETH.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate USDbC holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [USDbC_HOLDER],});
        const signer = ethers.provider.getSigner(USDbC_HOLDER);

        await USDbC.connect(signer).transfer(user0.address, await USDbC.connect(owner).balanceOf(USDbC_HOLDER));
        
        console.log("Holder USDbC balance: ", divDec(await USDbC.connect(owner).balanceOf(USDbC_HOLDER)));
        console.log("User0 USDbC balance: ", divDec(await USDbC.connect(owner).balanceOf(user0.address)));
    });

    it("Impersonate MAI holder and send to user0", async function () {
        console.log("******************************************************");
        await network.provider.request({method: "hardhat_impersonateAccount", params: [MAI_HOLDER],});
        const signer = ethers.provider.getSigner(MAI_HOLDER);

        await MAI.connect(signer).transfer(user0.address, await MAI.connect(owner).balanceOf(MAI_HOLDER));
        
        console.log("Holder MAI balance: ", divDec(await MAI.connect(owner).balanceOf(MAI_HOLDER)));
        console.log("User0 MAI balance: ", divDec(await MAI.connect(owner).balanceOf(user0.address)));
    });

    it("user0 gets LP0 liquidity", async function () {
        console.log("******************************************************");
        await router.connect(owner).swapExactETHForTokens(1, [[WETH.address, AERO.address, false, FACTORY]], user0.address, 1792282187, {value: oneThousand});
        await AERO.connect(user0).approve(router.address, await AERO.connect(owner).balanceOf(user0.address));
        await router.connect(user0).addLiquidityETH(AERO.address, false, await AERO.connect(owner).balanceOf(user0.address), 1, 1, user0.address, 1888060806, {value: oneThousand});
        console.log("User0 LP0 balance: ", divDec(await LP0.connect(owner).balanceOf(user0.address)));
    });

    it("user0 gets LP1 liquidity", async function () {
        console.log("******************************************************");
        await USDbC.connect(user0).approve(router.address, tenThousand6);        // await router.connect(owner).voter();
        await router.connect(user0).swapExactTokensForTokens(tenThousand6, 1, [[USDbC.address, MAI.address, true, FACTORY]], user0.address, 1988060806);
        await MAI.connect(user0).approve(router.address, fiveThousand);
        await USDbC.connect(user0).approve(router.address, fiveThousand6);
        await router.connect(user0).addLiquidity(USDbC.address, MAI.address, true, fiveThousand6, fiveThousand, 1, 1, user0.address, 1888060806);
        console.log("User0 USDbC balance: ", divDec6(await USDbC.connect(owner).balanceOf(user0.address)));
        console.log("User0 MAI balance: ", divDec(await MAI.connect(owner).balanceOf(user0.address)));
        console.log("User0 LP1 balance: ", divDec(await LP1.connect(owner).balanceOf(user0.address)));
    });

    it("User0 deposits in all plugins", async function () {
        console.log("******************************************************");
        await LP0.connect(user0).approve(plugin0.address, await LP0.connect(owner).balanceOf(user0.address));
        await plugin0.connect(user0).depositFor(user0.address, await LP0.connect(owner).balanceOf(user0.address));

        await LP1.connect(user0).approve(plugin1.address, await LP1.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).depositFor(user0.address, await LP1.connect(owner).balanceOf(user0.address));
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
        await voter.connect(user1).vote([plugin0.address, plugin1.address],[ten, ten]);
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

    it("LP data ", async function () {
        console.log("******************************************************");
        console.log("LP0");
        console.log("Claimable WETH: ", await LP0.connect(owner).claimable0(plugin0.address));
        console.log("Claimable AERO: ", await LP0.connect(owner).claimable1(plugin0.address));
        console.log();

        console.log("LP1");
        console.log("Claimable USDbC: ", await LP1.connect(owner).claimable0(plugin0.address));
        console.log("Claimable MAI: ", await LP1.connect(owner).claimable1(plugin0.address));
        console.log();
    });

    it("user0 makes swap on LP0", async function () {
        console.log("******************************************************");
        await router.connect(user0).swapExactETHForTokens(1, [[WETH.address, AERO.address, false, FACTORY]], user0.address, 1792282187, {value: oneThousand});
        await AERO.connect(user0).approve(router.address, await AERO.connect(owner).balanceOf(user0.address));
        await router.connect(user0).swapExactTokensForETH(await AERO.connect(owner).balanceOf(user0.address), 1, [[AERO.address, WETH.address, false, FACTORY]], user0.address, 1792282187);
    });

    it("user0 gets LP1 liquidity", async function () {
        console.log("******************************************************");
        await USDbC.connect(user0).approve(router.address, tenThousand6);    
        await router.connect(user0).swapExactTokensForTokens(tenThousand6, 1, [[USDbC.address, MAI.address, true, FACTORY]], user0.address, 1988060806);
        await MAI.connect(user0).approve(router.address, fiveThousand);
        await router.connect(user0).swapExactTokensForTokens(fiveThousand, 1, [[MAI.address, USDbC.address, true, FACTORY]], user0.address, 1988060806);
        await USDbC.connect(user0).approve(router.address, tenThousand6);    
        await router.connect(user0).swapExactTokensForTokens(tenThousand6, 1, [[USDbC.address, MAI.address, true, FACTORY]], user0.address, 1988060806);
        await USDbC.connect(user0).approve(router.address, tenThousand6);    
        await router.connect(user0).swapExactTokensForTokens(tenThousand6, 1, [[USDbC.address, MAI.address, true, FACTORY]], user0.address, 1988060806);
    });

    it("Forward time by 1 days", async function () {
        console.log("******************************************************");
        await network.provider.send("evm_increaseTime", [24 * 3600]);
        await network.provider.send("evm_mine");
    });

    it("LP data ", async function () {
        console.log("******************************************************");
        console.log("LP0");
        await plugin0.connect(user0).withdrawTo(user0.address, await plugin0.connect(owner).balanceOf(user0.address));
        await LP0.connect(user0).approve(plugin0.address, await LP0.connect(owner).balanceOf(user0.address));
        await plugin0.connect(user0).depositFor(user0.address, await LP0.connect(owner).balanceOf(user0.address));
        console.log("Claimable WETH: ", await LP0.connect(owner).claimable0(plugin0.address));
        console.log("Claimable AERO: ", await LP0.connect(owner).claimable1(plugin0.address));
        console.log();

        console.log("LP1");
        await plugin1.connect(user0).withdrawTo(user0.address, await plugin1.connect(owner).balanceOf(user0.address));
        await LP1.connect(user0).approve(plugin1.address, await LP1.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).depositFor(user0.address, await LP1.connect(owner).balanceOf(user0.address));
        console.log("Claimable MAI: ", await LP1.connect(owner).claimable0(plugin1.address));
        console.log("Claimable USDbC: ", await LP1.connect(owner).claimable1(plugin1.address));
        console.log();
    });

    it("Owner calls distribute", async function () {
        console.log("******************************************************");
        await voter.connect(owner).distro();
        await fees.distribute();
        await voter.distributeToBribes([plugin0.address, plugin1.address]);
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

    it("User0 withdraws from all gauges", async function () {
        console.log("******************************************************");
        await plugin0.connect(user0).withdrawTo(user0.address, await plugin0.connect(owner).balanceOf(user0.address));
        await plugin1.connect(user0).withdrawTo(user0.address, await plugin1.connect(owner).balanceOf(user0.address));
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



  });
  