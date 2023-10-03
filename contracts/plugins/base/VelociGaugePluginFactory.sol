// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import 'contracts/Plugin.sol';

interface IVelociLP {
    function tokens() external view returns (address, address);
}

interface IRouter {
    function isPair(address _pool) external view returns (bool);
}

interface IVelociVoter {
    function gauges(address _lpToken) external view returns (address);
}

interface IPluginFactory {
    function VOTER() external view returns (address);
    function BVM() external view returns (address);
    function OBVM() external view returns (address);
}

interface IVelociGauge {
    function rewardsListLength() external view returns (uint256);
    function rewards(uint256 _index) external view returns (address);
    function deposit(uint256 _amount, uint256 _tokenId) external;
    function withdraw(uint256 _amount) external;
    function getReward(address _account, address[] memory _tokens) external;
}

contract VelociGaugePlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable pluginFactory;
    address public immutable velociGauge;
    address[] public velociGaugeRewards;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__NotFactory();

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _velociGauge,
        address _pluginFactory,
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        address[] memory _velociGaugeRewards,
        string memory _protocol,
        string memory _symbol
    )
        Plugin(
            _underlying, 
            IPluginFactory(_pluginFactory).VOTER(), 
            _tokensInUnderlying, 
            _bribeTokens,
            _protocol
        )
    {
        pluginFactory = _pluginFactory;
        velociGauge = _velociGauge;
        velociGaugeRewards = _velociGaugeRewards;
        symbol = _symbol;
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IVelociGauge(velociGauge).getReward(address(this), velociGaugeRewards);
        address bribe = getBribe();
        uint256 duration = IBribe(bribe).DURATION();
        for (uint i = 0; i < velociGaugeRewards.length; i++) {
            address token = (velociGaugeRewards[i] == IPluginFactory(pluginFactory).BVM() ? IPluginFactory(pluginFactory).OBVM() : velociGaugeRewards[i]);
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > duration && token != getUnderlyingAddress()) {
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
        IERC20(getUnderlyingAddress()).safeApprove(velociGauge, 0);
        IERC20(getUnderlyingAddress()).safeApprove(velociGauge, amount);
        IVelociGauge(velociGauge).deposit(amount, 0);
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IVelociGauge(velociGauge).withdraw(amount); 
        super.withdrawTo(account, amount);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGaugeRewards(address[] memory _gaugeRewards) external {
        if (msg.sender != pluginFactory) revert Plugin__NotFactory();
        velociGaugeRewards = _gaugeRewards;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getUnderlyingName() public view override returns (string memory) {
        return symbol;
    }

    function getUnderlyingSymbol() public view override returns (string memory) {
        return symbol;
    }

}


contract VelociGaugePluginFactory is Ownable {

    address public constant BVM = 0xd386a121991E51Eab5e3433Bf5B1cF4C8884b47a;
    address public constant OBVM = 0x762eb51D2e779EeEc9B239FFB0B2eC8262848f3E;
    address public constant ROUTER = 0xE11b93B61f6291d35c5a2beA0A9fF169080160cF;
    address public constant VELOCI_VOTER = 0xab9B68c9e53c94D7c0949FB909E80e4a29F9134A;
    string public constant PROTOCOL = 'Velocimeter';

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
        address[] memory _gaugeRewards,
        string memory _symbol // ex sLP-USDT/USDC or vLP-DAI/ETH
    ) external returns (address) {
        if (!IRouter(ROUTER).isPair(_lpToken)) revert PluginFactory__NotPair();
        if (IVelociVoter(VELOCI_VOTER).gauges(_lpToken) == address(0)) revert PluginFactory__InvalidGauge();
        (address token0, address token1) = IVelociLP(_lpToken).tokens();

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;

        address[] memory _bribeTokens = new address[](_gaugeRewards.length);
        for (uint i = 0; i < _gaugeRewards.length; i++) {
            _bribeTokens[i] = (_gaugeRewards[i] == BVM ? OBVM : _gaugeRewards[i]);
        }

        VelociGaugePlugin lastPlugin = new VelociGaugePlugin(
            _lpToken,
            IVelociVoter(VELOCI_VOTER).gauges(_lpToken),
            address(this),
            tokensInUnderlying,
            _bribeTokens,
            _gaugeRewards,
            PROTOCOL,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit Plugin__PluginCreated(last_plugin);
        return last_plugin;
    }

    function setGaugeRewards(address _plugin, address[] memory _gaugeRewards) external onlyOwner {
        VelociGaugePlugin(_plugin).setGaugeRewards(_gaugeRewards);
    }
    
}