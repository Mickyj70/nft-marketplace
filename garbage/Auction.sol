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

contract Auction is ReentrancyGuard, Ownable, Pausable, ChainConfig {
    struct AuctionInfo {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount; // Amount for ERC1155
        uint256 startingPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
        bool isERC1155;
        address paymentToken; // address(0) for ETH, USDC address for USDC
    }

    // Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeePercentage = 250; // 2.5%

    // Minimum auction duration
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;

    // Maximum auction duration
    uint256 public constant MAX_AUCTION_DURATION = 7 days;

    // Mapping from NFT contract address to token ID to auction
    mapping(address => mapping(uint256 => AuctionInfo)) public auctions;

    // Mapping to track user balances (for withdrawals and refunds)
    mapping(address => mapping(address => uint256)) public userBalances; // user => token => amount

    // Events
    event AuctionCreated(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 startingPrice,
        uint256 endTime,
        address paymentToken
    );
    event BidPlaced(
        address indexed bidder,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 amount,
        address paymentToken
    );
    event AuctionEnded(
        address indexed seller,
        address indexed winner,
        address indexed nftContract,
        uint256 tokenId,
        uint256 winningBid,
        address paymentToken
    );
    event AuctionCancelled(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId
    );

    event NFTFactoryUpdated(address indexed nftFactory);

    constructor() ChainConfig() {}

    NFTFactory public nftFactory;

    function setNFTFactory(address _nftFactory) external onlyOwner {
        nftFactory = NFTFactory(_nftFactory);
        emit NFTFactoryUpdated(_nftFactory);
    }

    function createFactoryAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration,
        uint256 amount,
        bool _isERC1155,
        address paymentToken
    ) external whenNotPaused onlySupportedChain {
        require(address(nftFactory) != address(0), "NFT Factory not set");
        require(
            nftFactory.isMarketplaceCollection(nftContract),
            "Not a marketplace NFT"
        );

        // Call the existing createAuction function
        this.createAuction(
            nftContract,
            tokenId,
            startingPrice,
            duration,
            amount,
            _isERC1155,
            paymentToken
        );
    }

    function isMarketplaceNFT(
        address nftContract
    ) external view returns (bool) {
        if (address(nftFactory) == address(0)) return false;
        return nftFactory.isMarketplaceCollection(nftContract);
    }

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 duration,
        uint256 amount,
        bool _isERC1155,
        address paymentToken
    ) external whenNotPaused onlySupportedChain {
        require(startingPrice > 0, "Starting price must be greater than zero");
        require(
            duration >= MIN_AUCTION_DURATION &&
                duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );
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

        auctions[nftContract][tokenId] = AuctionInfo({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            startingPrice: startingPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true,
            isERC1155: _isERC1155,
            paymentToken: paymentToken
        });

        emit AuctionCreated(
            msg.sender,
            nftContract,
            tokenId,
            startingPrice,
            block.timestamp + duration,
            paymentToken
        );
    }

    function placeBid(
        address nftContract,
        uint256 tokenId,
        uint256 bidAmount
    ) external payable nonReentrant whenNotPaused onlySupportedChain {
        AuctionInfo storage auction = auctions[nftContract][tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(
            bidAmount > auction.highestBid &&
                bidAmount >= auction.startingPrice,
            "Bid too low"
        );
        require(msg.sender != auction.seller, "Seller cannot bid");

        if (auction.paymentToken == address(0)) {
            // ETH payment
            require(msg.value == bidAmount, "Incorrect ETH amount");

            // Refund previous highest bidder
            if (auction.highestBidder != address(0)) {
                userBalances[auction.highestBidder][address(0)] += auction
                    .highestBid;
            }
        } else {
            // USDC payment
            require(msg.value == 0, "ETH not accepted for USDC auction");
            require(
                auction.paymentToken == getUSDCAddress(),
                "Invalid payment token"
            );

            IERC20 usdc = IERC20(getUSDCAddress());
            require(
                usdc.transferFrom(msg.sender, address(this), bidAmount),
                "USDC transfer failed"
            );

            // Refund previous highest bidder
            if (auction.highestBidder != address(0)) {
                userBalances[auction.highestBidder][getUSDCAddress()] += auction
                    .highestBid;
            }
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;
        emit BidPlaced(
            msg.sender,
            nftContract,
            tokenId,
            bidAmount,
            auction.paymentToken
        );
    }

    function endAuction(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant onlySupportedChain {
        AuctionInfo storage auction = auctions[nftContract][tokenId];
        require(auction.isActive, "Auction not active");
        require(
            block.timestamp >= auction.endTime || msg.sender == auction.seller,
            "Auction not ended"
        );

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            _processAuctionEnd(auction);
            emit AuctionEnded(
                auction.seller,
                auction.highestBidder,
                nftContract,
                tokenId,
                auction.highestBid,
                auction.paymentToken
            );
        } else {
            emit AuctionCancelled(auction.seller, nftContract, tokenId);
        }
    }

    function _processAuctionEnd(AuctionInfo storage auction) internal {
        uint256 platformFee = (auction.highestBid * platformFeePercentage) /
            10000;
        uint256 remainingAmount = auction.highestBid - platformFee;

        // Transfer royalties if supported

        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        try
            IERC2981(auction.nftContract).royaltyInfo(
                auction.tokenId,
                auction.highestBid
            )
        returns (address receiver, uint256 royaltyValue) {
            if (receiver != address(0) && royaltyValue > 0) {
                royaltyReceiver = receiver;
                royaltyAmount = royaltyValue;
                remainingAmount -= royaltyAmount;
            }
        } catch {}

        if (auction.paymentToken == address(0)) {
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
            (bool sellerSuccess, ) = payable(auction.seller).call{
                value: remainingAmount
            }("");
            require(sellerSuccess, "Seller payment failed");
        } else {
            // USDC payments
            IERC20 usdc = IERC20(auction.paymentToken);

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
                usdc.transfer(auction.seller, remainingAmount),
                "Seller payment failed"
            );
        }

        // Transfer NFT to highest bidder
        if (auction.isERC1155) {
            IERC1155(auction.nftContract).safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId,
                auction.amount,
                ""
            );
        } else {
            IERC721(auction.nftContract).safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );
        }
    }

    function withdrawBalance(address token) external nonReentrant {
        uint256 balance = userBalances[msg.sender][token];
        require(balance > 0, "No balance to withdraw");

        userBalances[msg.sender][token] = 0;

        if (token == address(0)) {
            // ETH withdrawal
            (bool success, ) = payable(msg.sender).call{value: balance}("");
            require(success, "ETH withdrawal failed");
        } else {
            // Token withdrawal
            require(
                IERC20(token).transfer(msg.sender, balance),
                "Token withdrawal failed"
            );
        }
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
