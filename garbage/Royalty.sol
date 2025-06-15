// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "./interfaces/IERC2981.sol";
import "./ChainConfig.sol";

contract Royalty is ERC2981, Ownable, ChainConfig {
    event RoyaltySet(
        uint256 indexed tokenId,
        address indexed receiver,
        uint96 feeNumerator
    );
    event DefaultRoyaltySet(address indexed receiver, uint96 feeNumerator);

    constructor() ChainConfig() {}

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner onlySupportedChain {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
        emit RoyaltySet(tokenId, receiver, feeNumerator);
    }

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner onlySupportedChain {
        _setDefaultRoyalty(receiver, feeNumerator);
        emit DefaultRoyaltySet(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner onlySupportedChain {
        _deleteDefaultRoyalty();
        emit DefaultRoyaltySet(address(0), 0);
    }

    function resetTokenRoyalty(
        uint256 tokenId
    ) external onlyOwner onlySupportedChain {
        _resetTokenRoyalty(tokenId);
        emit RoyaltySet(tokenId, address(0), 0);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
