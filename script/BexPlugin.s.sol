// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0;

import "forge-std/Script.sol";

import {BexPairPluginFactory} from "../contracts/plugins/Berachain/BexPluginFactory.sol";

contract BexPairPluginScript is Script {

    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    // PluginFactory settings
    address VOTER_ADDRESS = 0xFBE5cABd9F9cAd8f8DcE61BE672ff7034d2e8924;

    // Plugin settings
    address LP_ADDRESS = 0x3a995543A9c6a9c5FE56d2d9024195aE7f3373e8; // Address of LP token
    address TOKEN0 = 0x5806E416dA447b267cEA759358cF22Cc41FAE80F; // WBERA address
    address TOKEN1 = 0x7EeCA4205fF31f947EdBd49195a7A88E6A91161B; // HONEY address
    string LP_SYMBOL = "50WBERA-50HONEY"; // Desired symbol for LP plugin

    modifier broadcast {
        vm.startBroadcast(deployerPrivateKey);
        _;
        vm.stopBroadcast();
    }

    function run() external broadcast {

        BexPairPluginFactory pluginFactory = new BexPairPluginFactory(VOTER_ADDRESS);
        console.log("**************************************************************");
        console.log("PluginFactory: ", address(pluginFactory));
        console.log("**************************************************************");

        console.log("**************************************************************");
        console.log("Creating Plugin...");
        pluginFactory.createPlugin(LP_ADDRESS, TOKEN0, TOKEN1, LP_SYMBOL);
        address pluginAddress = pluginFactory.last_plugin();

        console.log("Plugin Deployed at:", pluginAddress);
        console.log("**************************************************************");


    }
}
//To test:
//forge script BexPairPluginScript --rpc-url berapriv

//To run:
//forge script BexPairPluginScript --rpc-url berapriv --broadcast --verify