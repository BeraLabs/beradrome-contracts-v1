// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IAeroLP {
    function tokens() external view returns (address, address);
    function claimFees() external returns (uint claimed0, uint claimed1);
}

interface IPoolFactory {
    function isPool(address _pool) external view returns (bool);
}

contract AeroPairPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            _voter, 
            _tokensInUnderlying, 
            _tokensInUnderlying,
            _protocol
        )
    {
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IAeroLP(getUnderlyingAddress()).claimFees();
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

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}

contract AeroPairPluginFactory {

    address public constant POOL_FACTORY = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;
    string public constant PROTOCOL = 'Aerodrome';

    address public immutable VOTER;

    address public last_plugin;

    error PluginFactory__NotPair();

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        string memory _symbol // ex sLP-USDT/USDC or vLP-DAI/ETH
    ) external returns (address) {
        if (!IPoolFactory(POOL_FACTORY).isPool(_lpToken)) revert PluginFactory__NotPair();
        (address token0, address token1) = IAeroLP(_lpToken).tokens();

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        AeroPairPlugin lastPlugin = new AeroPairPlugin(
            _lpToken,
            VOTER,
            tokensInUnderlying,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}