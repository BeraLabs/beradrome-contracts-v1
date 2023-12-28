// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IBank {
    function getBalance(address accountAddress, string calldata denom) external view returns (uint256);
}

interface IBGT {
    function redeem(address from, address receiver, uint256 amount) external;
}

interface IRewarder {
    function withdrawAllDepositorRewards(address receiver) external;
}

contract BexPairPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant BGT = 0x09E585D2bdEb5ecf90ADE67dCE1125070D2714a3;
    address public constant BANK = 0x4381dC2aB14285160c808659aEe005D51255adD7;
    address public constant REWARDER = 0x55684e2cA2bace0aDc512C1AFF880b15b8eA7214;

    /*----------  STATE VARIABLES  --------------------------------------*/

    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
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
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IRewarder(REWARDER).withdrawAllDepositorRewards(address(this));
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        address token = getBribeTokens()[0];
        uint256 balance = IBank(BANK).getBalance(address(this), "abgt");
        if (balance > duration) {
            IBGT(BGT).redeem(address(this), address(this), balance);
            IERC20(token).safeApprove(bribe, 0);
            IERC20(token).safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(token, balance);
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

contract BexPairPluginFactory {

    address public constant WBERA = 0x5806E416dA447b267cEA759358cF22Cc41FAE80F;
    string public constant PROTOCOL = 'BEX';

    address public immutable VOTER;

    address public last_plugin;

    error PluginFactory__NotPair();

    event Plugin__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        address _token0,
        address _token1,
        string memory _symbol // ex 50WETH-50HONEY or 50WBTC-50HONEY or 50WBERA-50HONEY
    ) external returns (address) {

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = _token0;
        tokensInUnderlying[1] = _token1;

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = WBERA;

        BexPairPlugin lastPlugin = new BexPairPlugin(
            _lpToken,
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