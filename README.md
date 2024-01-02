Toupée Tech functions as an ecosystem incentive coordinator, offering a distinct strategy for yield farming, token administration, and on-chain governance. The platform introduces an innovative token structure, encompassing WIG, vWIG, and oWIG tokens, each presenting users with diverse advantages and motivations. The supply of WIG tokens is algorithmically controlled via a bonding curve mechanism, ensuring a stable foundation for WIG tokens while providing liquidity at market-driven rates.
Key Features: 

An all-encompassing Solidly System with a fresh token configuration. Extension points to seamlessly incorporate any yield-generating asset into the ecosystem. WIG, equivalent to SOLID, is disbursed through the Toupée Tech Bonding Curve, consistently backed by ETH, and its price maintains a level of ≥ 1 ETH/WIG. vWIG, analogous to veSOLID, involves staking WIG to acquire vWIG. The previous 4-year locking mechanism is removed. 

- Staking is only in effect during active voting periods, and resetting votes to 0 enables withdrawal back to WIG
- vWIG serves as the governing power token
- oWIG: Functions as a call option for WIG at the designated base price (1 ETH/WIG). 

These are issued to gauges as incentives for liquidity, dependent on vWIG votes. vWIG garners swap fees from the Toupée Tech Bonding Curve, accrues oWIG through rebases, and collects voting fees from endorsed gauges.

- Leverage borrowing against vWIG without concerns of interest or liquidation risks. 
- 1 WIG consistently allows borrowing up to the value of 1 ETH.



### FOR BERACHAIN ###

Download and install Foundry to your machine: https://book.getfoundry.sh/reference/forge/forge-install
Once it is installed:
- Run `forge install`
- Run `forge script BexPairPluginScript --rpc-url berapriv` to simulate plugin deployment
- Add `--broadcast --verify` to deploy the plugin to the network

Deployed addresses:
- Factory: https://scan.berachain-internal.com/address/0x406846114B2A9b65a8A2Ab702C2C57d27784dBA2#code
- Note, there is some issue verifying the individual WBERA-HONEY plugin

- == Logs ==
  **************************************************************
  PluginFactory:  0x406846114B2A9b65a8A2Ab702C2C57d27784dBA2
  **************************************************************
  **************************************************************
  Creating Plugin...
  Plugin Deployed at: 0xF7Cdd10810Fa53474Ad77D0d518A7c4674070740
  **************************************************************
