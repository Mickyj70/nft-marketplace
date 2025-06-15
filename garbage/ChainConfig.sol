// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ChainConfig is Ownable {
    // Supported chain IDs
    uint256 public constant ETHEREUM_MAINNET = 1;
    uint256 public constant SEPOLIA_TESTNET = 11155111;
    uint256 public constant ZKSYNC_MAINNET = 324;
    uint256 public constant ZKSYNC_SEPOLIA = 300;
    uint256 public constant LOCAL_TESTNET = 31337;

    // USDC token addresses per chain
    mapping(uint256 => address) public usdcAddresses;

    // Chain support status
    mapping(uint256 => bool) public supportedChains;

    event ChainSupportUpdated(uint256 chainId, bool supported);
    event USDCAddressUpdated(uint256 chainId, address usdcAddress);

    constructor() Ownable(msg.sender) {
        // Initialize supported chains
        supportedChains[ETHEREUM_MAINNET] = true;
        supportedChains[SEPOLIA_TESTNET] = true;
        supportedChains[ZKSYNC_MAINNET] = true;
        supportedChains[ZKSYNC_SEPOLIA] = true;
        supportedChains[LOCAL_TESTNET] = true;

        // Set USDC addresses for each chain
        // These are example addresses - replace with actual USDC addresses
        usdcAddresses[
            ETHEREUM_MAINNET
        ] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
        usdcAddresses[
            SEPOLIA_TESTNET
        ] = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        usdcAddresses[
            ZKSYNC_MAINNET
        ] = 0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4;
        usdcAddresses[
            ZKSYNC_SEPOLIA
        ] = 0xAe045DE5638162fa134807Cb558E15A3F5A7F853;
        usdcAddresses[LOCAL_TESTNET] = address(0); // Local testnet may not have USDC
    }

    function setChainSupport(
        uint256 chainId,
        bool supported
    ) external onlyOwner {
        supportedChains[chainId] = supported;
        emit ChainSupportUpdated(chainId, supported);
    }

    function setUSDCAddress(
        uint256 chainId,
        address usdcAddress
    ) external onlyOwner {
        require(usdcAddress != address(0), "Invalid USDC address");
        usdcAddresses[chainId] = usdcAddress;
        emit USDCAddressUpdated(chainId, usdcAddress);
    }

    function isChainSupported() public view returns (bool) {
        return supportedChains[block.chainid];
    }

    function getUSDCAddress() public view returns (address) {
        return usdcAddresses[block.chainid];
    }

    function getCurrentChainId() public view returns (uint256) {
        return block.chainid;
    }

    modifier onlySupportedChain() {
        require(isChainSupported(), "Chain not supported");
        _;
    }
}
