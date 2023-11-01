// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.13;

/// ============ Imports ============

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol"; // OZ: MerkleProof
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
/// @title MerkleClaim
/// @notice Claims BERO for members of a merkle tree
/// @author Modified from Merkle Airdrop Starter (https://github.com/Anish-Agnihotri/merkle-airdrop-starter/blob/master/contracts/src/MerkleClaimERC20.sol)

interface IVTOKEN {
    function burnFor(address account, uint256 amount) external;
}

contract MerkleClaim {
    using SafeERC20 for IERC20;

    IERC20 public immutable OTOKEN;
    IVTOKEN public immutable VTOKEN;
    bytes32 public immutable merkleRootOTOKEN;
    bytes32 public immutable merkleRootVTOKEN;


    mapping(address => bool) public hasClaimedOTOKEN;
    mapping(address => bool) public hasClaimedVTOKEN;

    constructor(address _OTOKEN, address _VTOKEN, bytes32 _merkleRootOTOKEN ,bytes32 _merkleRootVTOKEN ) {
        OTOKEN = IERC20(_OTOKEN);
        VTOKEN = IVTOKEN(_VTOKEN);
        merkleRootOTOKEN = _merkleRootOTOKEN;
        merkleRootVTOKEN = _merkleRootVTOKEN;
    }

    event Claim(address indexed to, uint256 amount);

    function claimOTOKEN(
        address to,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        // Throw if address has already claimed tokens
        require(!hasClaimedOTOKEN[to], "ALREADY_CLAIMED");

        // Verify merkle proof, or revert if not in tree
         bytes32 leaf = keccak256(abi.encodePacked(to, amount));
         bool isValidLeaf = MerkleProof.verify(proof, merkleRootOTOKEN, leaf);
         require(isValidLeaf, "NOT_IN_MERKLE");

        // Set address to claimed
         hasClaimedOTOKEN[to] = true;

        // Claim tokens for address
         OTOKEN.transfer(to, amount);

        // Emit claim event
        emit Claim(to, amount);
    }

    function claimVTOKEN(
        address to,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        // Throw if address has already claimed tokens
        require(!hasClaimedVTOKEN[to], "ALREADY_CLAIMED");

        // Verify merkle proof, or revert if not in tree
         bytes32 leaf = keccak256(abi.encodePacked(to, amount));
         bool isValidLeaf = MerkleProof.verify(proof, merkleRootVTOKEN, leaf);
         require(isValidLeaf, "NOT_IN_MERKLE");

        // Set address to claimed
        hasClaimedVTOKEN[to] = true;
        
        // Claim tokens for address
         OTOKEN.approve(address(VTOKEN), amount);
         VTOKEN.burnFor(to, amount);
         
        // Emit claim event
        emit Claim(to, amount);
    }
   
}