// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IBalancerGauge {
    function lp_token() external view returns (address);
    function bal_pseudo_minter() external view returns (address);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function claim_rewards() external;
}

interface IBalancerGaugeFactory {
    function isGaugeFromFactory(address _gauge) external view returns (bool);
}

interface IBalMinter {
    function mint(address _gauge) external;
}

contract BPTGaugePlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BAL = 0x120eF59b80774F02211563834d8E3b72cb1649d6;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable balGauge;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying,
        address _balGauge,
        address _voter, 
        address[] memory _tokensInUnderlying,   // WETH and wstETH
        address[] memory _bribeTokens,           // USDC and MATIC
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        balGauge = _balGauge;
        symbol = _symbol;
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getUnderlyingAddress()).safeApprove(balGauge, 0);
        IERC20(getUnderlyingAddress()).safeApprove(balGauge, amount);
        IBalancerGauge(balGauge).deposit(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IBalancerGauge(balGauge).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IBalancerGauge(balGauge).claim_rewards();
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint256 i = 0; i < getBribeTokens().length; i++) {
            if (getBribeTokens()[i] == BAL) {
                IBalMinter(IBalancerGauge(balGauge).bal_pseudo_minter()).mint(balGauge);
            }
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > duration) {
                IERC20(token).safeApprove(bribe, 0);
                IERC20(token).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(token, balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}

contract BPTGaugePluginFactory {

    string public constant PROTOCOL = 'Balancer';
    address public constant GAUGE_FACTORY = 0x2498A2B0d6462d2260EAC50aE1C3e03F4829BA95;

    address public immutable VOTER;

    address public last_plugin;

    event PluginFactory__PluginCreated(address plugin);

    error PluginFactory__InvalidGauge();

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _bpt,
        address _balGauge,
        address[] memory _tokensInUnderlying,
        address[] memory _bribeTokens,
        string memory _symbol // ex B-wstETH-STABLE or B-rETH-STABLE or B-wstETH/rETH-STABLE
    ) external returns (address) {

        BPTGaugePlugin lastPlugin = new BPTGaugePlugin(
            _bpt,
            _balGauge,
            VOTER,
            _tokensInUnderlying,
            _bribeTokens,
            PROTOCOL,
            _symbol
        );
        if (!IBalancerGaugeFactory(GAUGE_FACTORY).isGaugeFromFactory(_balGauge)) revert PluginFactory__InvalidGauge();
        last_plugin = address(lastPlugin);
        emit PluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}