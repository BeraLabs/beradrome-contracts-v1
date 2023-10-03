// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IAeroLP {
    function tokens() external view returns (address, address);
}

interface IPoolFactory {
    function isPool(address _pool) external view returns (bool);
}

interface IAeroVoter {
    function gauges(address _lpToken) external view returns (address);
}

interface IAeroGauge {
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
    function getReward(address _account) external;
}

contract AeroGaugePlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable aeroGauge;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _aeroGauge,
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
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
        aeroGauge = _aeroGauge;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IAeroGauge(aeroGauge).getReward(address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint i = 0; i < getBribeTokens().length; i++) {
            address token = getBribeTokens()[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > duration) {
                IERC20(token).safeApprove(bribe, 0);
                IERC20(token).safeApprove(bribe, balance);
                IBribe(bribe).notifyRewardAmount(token, balance);
            }
        }
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getUnderlyingAddress()).safeApprove(aeroGauge, 0);
        IERC20(getUnderlyingAddress()).safeApprove(aeroGauge, amount);
        IAeroGauge(aeroGauge).deposit(amount);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IAeroGauge(aeroGauge).withdraw(amount); 
        super.withdrawTo(account, amount);
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

contract AeroGaugePluginFactory {

    address public constant AERO = 0x940181a94A35A4569E4529A3CDfB74e38FD98631;
    address public constant POOL_FACTORY = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;
    address public constant AERO_VOTER = 0x16613524e02ad97eDfeF371bC883F2F5d6C480A5;
    string public constant PROTOCOL = 'Aerodrome';

    address public immutable VOTER;

    address public last_plugin;

    error PluginFactory__NotPair();
    error PluginFactory__InvalidGauge();

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        string memory _symbol // ex sLP-USDT/USDC or vLP-DAI/ETH
    ) external returns (address) {
        if (!IPoolFactory(POOL_FACTORY).isPool(_lpToken)) revert PluginFactory__NotPair();
        if (IAeroVoter(AERO_VOTER).gauges(_lpToken) == address(0)) revert PluginFactory__InvalidGauge();
        (address token0, address token1) = IAeroLP(_lpToken).tokens();

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = AERO;

        AeroGaugePlugin lastPlugin = new AeroGaugePlugin(
            _lpToken,
            IAeroVoter(AERO_VOTER).gauges(_lpToken),
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}