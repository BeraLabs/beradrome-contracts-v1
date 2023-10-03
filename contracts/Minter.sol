// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "contracts/interfaces/ITOKEN.sol";
import "contracts/interfaces/IOTOKEN.sol";
import "contracts/interfaces/IVoter.sol";

/**
 * @title Minter
 * @author heesho
 * 
 * Mints OTOKEN and distributes them to the Voter (to diribute to gauges), the team
 * and the growth fund (VTOKEN stakers).
 * 
 * Mints OTOKEN every week starting with {weekly} OTOKENs per week and decreases by 1% every week
 * until it reaches tail emissions, which is a constant emission rate of OTOKENS per week.
 * 
 * Tail emissions are a constant value settable by governance.
 */
contract Minter is Ownable {
    using SafeERC20 for IERC20;

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/

    uint internal constant WEEKLY_EMISSION_RATE = 400;     // 400 OTOKEN per week
    uint internal constant MAX_WEEKLY_EMISSION_RATE = 400; // 400 OTOKEN per week

    uint internal constant TAIL_EMISSION_RATE = 30;        // 100 OTOKEN per week
    uint internal constant MIN_TAIL_EMISSION_RATE = 25;    // 100 OTOKEN per week

    uint internal constant GROWTH_RATE = 20;    // 20% of emissions go to growth (stakers)
    uint internal constant TEAM_RATE = 5;       // 5% of emissions go to the team

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    /*----------  CONSTANTS  --------------------------------------------*/

    uint internal constant WEEK = 86400 * 7;    // allows minting once per week (reset every Thursday 00:00 UTC)
    uint internal constant EMISSION = 990;      // 99% of minted tokens go to the pool
    uint internal constant PRECISION = 1000;    // precision for math
    uint public constant MAX_TEAM_RATE = 100;   // Max of 10% of emissions can go to the team
    uint public constant MAX_GROWTH_RATE = 300; // Max of 30% of emissions can go to growth (VTOKEN stakers)

    uint public constant MAX_WEEKLY_RATE = MAX_WEEKLY_EMISSION_RATE * 1e18; // Max of OTOKEN emissions per week
    uint public constant MIN_TAIL_RATE = MIN_TAIL_EMISSION_RATE * 1e18;     // Min of OTOKEN emissions per week 

    /*----------  STATE VARIABLES  --------------------------------------*/

    ITOKEN public immutable TOKEN;  // the primary token
    IERC20 public immutable VTOKEN; // the voting token
    IERC20 public immutable OTOKEN; // the token distruted to gauges as rewards
    IVoter public voter;            // the voting & gauge distribution system
    uint public active_period;      // the current period (week) that is active
    address internal initializer;   // the address that can initialize the contract (owner)
    address public team;            // the address that receives team emissions

    uint public weekly = WEEKLY_EMISSION_RATE * 1e18;   // represents a starting weekly emission of OTOKEN (OTOKEN has 18 decimals)
    uint public tail = TAIL_EMISSION_RATE * 1e18;       // represents a constant weekly tail emission of OTOKEN (OTOKEN has 18 decimals)
    uint public teamRate = TEAM_RATE * 10;              // the rate of emissions that go to the team (bps)
    uint public growthRate = GROWTH_RATE * 10;          // the rate of emissions that go to growth (bps)

    /*----------  ERRORS ------------------------------------------------*/

    error Minter__InvalidZeroAddress();
    error Minter__UnathorizedInitializer();
    error Minter__GrowthRateTooHigh();
    error Minter__TeamRateTooHigh();
    error Minter__WeeklyRateTooHigh();
    error Minter__TailRateTooLow();
    error Minter__NotAuthorizedGovernance();

    /*----------  EVENTS ------------------------------------------------*/

    event Minter__Mint(address indexed sender, uint weekly);
    event Minter__TeamSet(address indexed account);
    event Minter__VoterSet(address indexed account);
    event Minter__GrowthRateSet(uint256 rate);
    event Minter__TeamRateSet(uint256 rate);
    event Minter__WeeklyRateSet(uint256 rate);
    event Minter__TailRateSet(uint256 rate);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroAddress(address _account) {
        if (_account == address(0)) revert Minter__InvalidZeroAddress();
        _;
    }

    modifier onlyGov {
        if (msg.sender != owner() && msg.sender != team) revert Minter__NotAuthorizedGovernance();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    /**
     * @notice Constructs the Minter contract.
     * @param _voter voter contract address
     * @param _TOKEN token contract address
     * @param _VTOKEN VTOKEN contract address
     * @param _OTOKEN OTOKEN contract address
     */
    constructor(
        address _voter,
        address _TOKEN,
        address _VTOKEN,
        address _OTOKEN
    ) {
        initializer = msg.sender;
        team = msg.sender;
        voter = IVoter(_voter);
        TOKEN = ITOKEN(_TOKEN);
        VTOKEN = IERC20(_VTOKEN);
        OTOKEN = IERC20(_OTOKEN);
        active_period = ((block.timestamp + (2 * WEEK)) / WEEK) * WEEK;
    }

    /**
     * @notice Updates the period and mints new tokens if necessary. Can only be called once per epoch (1 week).
     */
    function update_period() external returns (uint) {
        uint _period = active_period;
        if (block.timestamp >= _period + WEEK && initializer == address(0)) { // only trigger if new week
            _period = (block.timestamp / WEEK) * WEEK;
            active_period = _period;
            weekly = weekly_emission();

            uint _growth = calculate_growth(weekly);
            uint _teamEmissions = (teamRate * (_growth + weekly)) / PRECISION;
            uint _required = _growth + weekly + _teamEmissions;
            uint _balanceOf = OTOKEN.balanceOf(address(this));
            if (_balanceOf < _required) {
                require(IOTOKEN(address(OTOKEN)).mint(address(this), _required - _balanceOf));
            }

            OTOKEN.safeTransfer(team, _teamEmissions);
            OTOKEN.safeTransfer(TOKEN.FEES(), _growth);

            OTOKEN.approve(address(voter), weekly);
            voter.notifyRewardAmount(weekly);

            emit Minter__Mint(msg.sender, weekly);
        }
        return _period;
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function initialize() 
        external 
    {
        if (msg.sender != initializer) revert Minter__UnathorizedInitializer();
        initializer = address(0);
        active_period = ((block.timestamp) / WEEK) * WEEK; // allow minter.update_period() to mint new emissions THIS Thursday
    }

    function setTeam(address _team) 
        external
        onlyGov
        nonZeroAddress(_team)
    {
        team = _team;
        emit Minter__TeamSet(_team);
    }

    function setVoter(address _voter) 
        external 
        onlyOwner 
        nonZeroAddress(_voter)
    {
        voter = IVoter(_voter);
        emit Minter__VoterSet(_voter);
    }

    function setGrowthRate(uint256 _growthRate) 
        external 
        onlyOwner 
    {
        if (_growthRate > MAX_GROWTH_RATE) revert Minter__GrowthRateTooHigh();
        growthRate = _growthRate;
        emit Minter__GrowthRateSet(_growthRate);
    }

    function setTeamRate(uint _teamRate) 
        external 
        onlyOwner 
    {
        if (_teamRate > MAX_TEAM_RATE) revert Minter__TeamRateTooHigh();
        teamRate = _teamRate;
        emit Minter__TeamRateSet(_teamRate);
    }
    
    function setWeeklyRate(uint _weeklyRate) 
        external 
        onlyOwner 
    {
        if (_weeklyRate > MAX_WEEKLY_RATE) revert Minter__WeeklyRateTooHigh();
        weekly = _weeklyRate;
        emit Minter__WeeklyRateSet(_weeklyRate);
    }

    // should have a minimum
    function setTailRate(uint _tailRate) 
        external 
        onlyOwner 
    {
        if (_tailRate > MAX_WEEKLY_RATE) revert Minter__WeeklyRateTooHigh();
        if (_tailRate < MIN_TAIL_RATE) revert Minter__TailRateTooLow();
        tail = _tailRate;
        emit Minter__TailRateSet(_tailRate);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    // emission calculation is 1% of available supply to mint adjusted by circulating / total supply
    function calculate_emission() public view returns (uint) {
        return (weekly * EMISSION) / PRECISION;
    }

    // weekly emission takes the max of calculated (aka target) emission versus circulating tail end emission
    function weekly_emission() public view returns (uint) {
        return Math.max(calculate_emission(), tail);
    }

    // calculate inflation and adjust ve balances accordingly
    function calculate_growth(uint _minted) public view returns (uint) {
        return (_minted * growthRate) / PRECISION;
    }

}