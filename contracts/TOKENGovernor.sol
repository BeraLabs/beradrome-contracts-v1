// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/**
 * @title TOKENGovernor
 * @author heesho
 * 
 * Onchain governance for VTOKEN.
 */
contract TOKENGovernor is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {

    /*===================================================================*/
    /*===========================  SETTINGS  ============================*/

    string internal constant NAME = 'ToupeeTechGovernor';  // Name of Governor

    uint256 internal constant BLOCKTIME = 2;            // Number of seconds per block (eg 10 seconds per block)
    uint256 internal constant VOTING_DELAY = 1 days;      // Delay (seconds) since proposal creation to when voting can start (updatable by governance)
    uint256 internal constant VOTING_PERIOD = 7 days;   // Length of time (seconds) where people can cast their votes (updatable by governance)

    uint256 internal constant PROPOSAL_THRESHOLD = 10;      // Number of VTOKEN needed to make proposal (updatable by governance)
    uint256 internal constant QUORUM = 4;                   // Percentage of VTOKEN supply needed to vote for a proposal to pass (eg 4% of VTOKEN supply)

    /*===========================  END SETTINGS  ========================*/
    /*===================================================================*/

    constructor(IVotes _token)
        Governor(NAME)
        GovernorSettings(VOTING_DELAY / BLOCKTIME, VOTING_PERIOD / BLOCKTIME, PROPOSAL_THRESHOLD * 1e18)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(QUORUM)
    {}

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}