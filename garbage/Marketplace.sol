// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "./ChainConfig.sol";
import "./NFTFactory.sol";

contract Marketplace is ReentrancyGuard, Ownable, Pausable, ChainConfig {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // Amount for ERC1155
        uint256 price;
        bool isActive;
        bool isERC1155;
        address paymentToken; // address(0) for ETH, USDC address for USDC
    }

    // Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeePercentage = 250; // 2.5%

    // Mapping from NFT contract address to token ID to listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Token standard tracking
    mapping(address => bool) public isERC1155;

    // Events
    event NFTFactoryUpdated(address indexed nftFactory);
    event NFTListed(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price,
        address paymentToken
    );
    event NFTDelisted(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId
    );
    event NFTSold(
        address indexed seller,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    );
    event PlatformFeeUpdated(uint256 newFeePercentage);

    constructor() ChainConfig() {}

    function setPlatformFeePercentage(
        uint256 _feePercentage
    ) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = _feePercentage;
        emit PlatformFeeUpdated(_feePercentage);
    }

    NFTFactory public nftFactory;

    function setNFTFactory(address _nftFactory) external onlyOwner {
        nftFactory = NFTFactory(_nftFactory);
        emit NFTFactoryUpdated(_nftFactory);
    }

    function listFactoryNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        bool _isERC1155,
        address paymentToken
    ) external whenNotPaused onlySupportedChain {
        require(address(nftFactory) != address(0), "NFT Factory not set");
        require(
            nftFactory.isMarketplaceCollection(nftContract),
            "Not a marketplace NFT"
        );

        // Call the existing listNFT function
        this.listNFT(
            nftContract,
            tokenId,
            price,
            amount,
            _isERC1155,
            paymentToken
        );
    }

    function getMarketplaceCollections()
        external
        view
        returns (NFTFactory.Collection[] memory)
    {
        require(address(nftFactory) != address(0), "NFT Factory not set");
        return nftFactory.getAllCollections();
    }

    function isMarketplaceNFT(
        address nftContract
    ) external view returns (bool) {
        if (address(nftFactory) == address(0)) return false;
        return nftFactory.isMarketplaceCollection(nftContract);
    }

    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 amount,
        bool _isERC1155,
        address paymentToken
    ) external whenNotPaused onlySupportedChain {
        require(price > 0, "Price must be greater than zero");
        require(amount > 0, "Amount must be greater than zero");
        require(
            paymentToken == address(0) || paymentToken == getUSDCAddress(),
            "Unsupported payment token"
        );

        if (_isERC1155) {
            require(
                IERC1155(nftContract).balanceOf(msg.sender, tokenId) >= amount,
                "Insufficient balance"
            );
            require(
                IERC1155(nftContract).isApprovedForAll(
                    msg.sender,
                    address(this)
                ),
                "Not approved"
            );
            isERC1155[nftContract] = true;
        } else {
            require(amount == 1, "Invalid amount for ERC721");
            require(
                IERC721(nftContract).ownerOf(tokenId) == msg.sender,
                "Not the owner"
            );
            require(
                IERC721(nftContract).getApproved(tokenId) == address(this),
                "Not approved"
            );
        }

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            price: price,
            isActive: true,
            isERC1155: _isERC1155,
            paymentToken: paymentToken
        });

        emit NFTListed(msg.sender, nftContract, tokenId, price, paymentToken);
    }

    function delistNFT(address nftContract, uint256 tokenId) external {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Not active");

        listing.isActive = false;
        emit NFTDelisted(msg.sender, nftContract, tokenId);
    }

    function buyNFT(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused onlySupportedChain {
        Listing storage listing = listings[nftContract][tokenId];
        require(listing.isActive, "Not active");

        if (listing.paymentToken == address(0)) {
            // ETH payment
            require(msg.value >= listing.price, "Insufficient payment");

            _processSale(
                nftContract,
                tokenId,
                listing.seller,
                msg.sender,
                msg.value,
                address(0)
            );
        } else {
            // USDC payment
            require(msg.value == 0, "ETH not accepted for USDC listing");
            require(
                listing.paymentToken == getUSDCAddress(),
                "Invalid payment token"
            );

            IERC20 usdc = IERC20(getUSDCAddress());
            require(
                usdc.transferFrom(msg.sender, address(this), listing.price),
                "USDC transfer failed"
            );

            _processSale(
                nftContract,
                tokenId,
                listing.seller,
                msg.sender,
                listing.price,
                getUSDCAddress()
            );
        }

        listing.isActive = false;
    }

    function _processSale(
        address nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price,
        address paymentToken
    ) internal {
        // Store the listing in a local variable to reduce stack depth
        Listing memory listing = listings[nftContract][tokenId];

        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 remainingAmount = price - platformFee;

        // Transfer royalties if supported
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        try IERC2981(nftContract).royaltyInfo(tokenId, price) returns (
            address receiver,
            uint256 royaltyValue
        ) {
            if (receiver != address(0) && royaltyValue > 0) {
                royaltyReceiver = receiver;
                royaltyAmount = royaltyValue;
                remainingAmount -= royaltyAmount;
            }
        } catch {}

        // Process payments
        if (paymentToken == address(0)) {
            // ETH payments
            // Pay platform fee
            (bool feeSuccess, ) = payable(owner()).call{value: platformFee}("");
            require(feeSuccess, "Platform fee transfer failed");

            // Pay royalties if any
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                (bool royaltySuccess, ) = payable(royaltyReceiver).call{
                    value: royaltyAmount
                }("");
                require(royaltySuccess, "Royalty transfer failed");
            }

            // Pay seller
            (bool sellerSuccess, ) = payable(seller).call{
                value: remainingAmount
            }("");
            require(sellerSuccess, "Seller payment failed");
        } else {
            // USDC payments
            IERC20 usdc = IERC20(paymentToken);

            // Pay platform fee
            require(
                usdc.transfer(owner(), platformFee),
                "Platform fee transfer failed"
            );

            // Pay royalties if any
            if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
                require(
                    usdc.transfer(royaltyReceiver, royaltyAmount),
                    "Royalty transfer failed"
                );
            }

            // Pay seller
            require(
                usdc.transfer(seller, remainingAmount),
                "Seller payment failed"
            );
        }

        // Transfer NFT to buyer
        if (listing.isERC1155) {
            IERC1155(nftContract).safeTransferFrom(
                seller,
                buyer,
                tokenId,
                listing.amount,
                ""
            );
        } else {
            IERC721(nftContract).safeTransferFrom(seller, buyer, tokenId);
        }
        emit NFTSold(seller, buyer, nftContract, tokenId, price, paymentToken);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency withdrawal function for ETH
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Emergency withdrawal function for tokens
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
