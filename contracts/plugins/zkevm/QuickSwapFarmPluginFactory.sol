// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import 'contracts/Plugin.sol';

interface IMasterChef {
    function lpToken(uint256 _pid) external view returns (address);
    function deposit(uint256 _pid, uint256 _amount, address _to) external;
    function withdraw(uint256 _pid, uint256 _amount, address _to) external;
    function harvest(uint256 _pid, address _to) external;
}

interface IGammaLP {
    function token0() external view returns (address);
    function token1() external view returns (address);
}

contract QuickSwapFarmPlugin is Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    address public constant MASTER_CHEF = 0x1e2D8f84605D32a2CBf302E30bFd2387bAdF35dD;

    /*----------  STATE VARIABLES  --------------------------------------*/

    uint256 public immutable pid;
    string public symbol;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__InvalidFarm();

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _underlying, 
        address _voter, 
        address[] memory _tokensInUnderlying, 
        address[] memory _bribeTokens,
        string memory _protocol,
        uint256 _pid,
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
        if (IMasterChef(MASTER_CHEF).lpToken(_pid) != _underlying) revert Plugin__InvalidFarm();
        pid = _pid;
        symbol = _symbol;
    }

    function depositFor(address account, uint256 amount) 
        public 
        override 
    {
        super.depositFor(account, amount);
        IERC20(getUnderlyingAddress()).safeApprove(MASTER_CHEF, 0);
        IERC20(getUnderlyingAddress()).safeApprove(MASTER_CHEF, amount);
        IMasterChef(MASTER_CHEF).deposit(pid, amount, address(this)); 
    }

    function withdrawTo(address account, uint256 amount) 
        public 
        override 
    {
        IMasterChef(MASTER_CHEF).withdraw(pid, amount, address(this)); 
        super.withdrawTo(account, amount);
    }

    function claimAndDistribute() 
        public 
        override 
    {
        super.claimAndDistribute();
        IMasterChef(MASTER_CHEF).harvest(pid, address(this));
        address token = getBribeTokens()[0];
        address bribe = getBribe();
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 duration = IBribe(bribe).DURATION();
        if (balance > duration) {
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

contract QuickSwapFarmPluginFactory {

    address public constant QUICK = 0x68286607A1d43602d880D349187c3c48c0fD05E6;
    string public constant PROTOCOL = 'QuickSwap';

    address public immutable VOTER;

    address public last_plugin;

    event PluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _lpToken,
        uint256 _pid,
        string memory _symbol // ex mLP-QUICK/ETH (Narrow) or mLP-QUICK/ETH (Wide) or mLP-USDT/USDC (Stable)
    ) external returns (address) {
        address token0 = IGammaLP(_lpToken).token0();
        address token1 = IGammaLP(_lpToken).token1();

        address[] memory tokensInUnderlying = new address[](2);
        tokensInUnderlying[0] = token0;
        tokensInUnderlying[1] = token1;
        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = QUICK;

        QuickSwapFarmPlugin lastPlugin = new QuickSwapFarmPlugin(
            _lpToken,
            VOTER,
            tokensInUnderlying,
            bribeTokens,
            PROTOCOL,
            _pid,
            _symbol
        );
        last_plugin = address(lastPlugin);
        emit PluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }
    
}