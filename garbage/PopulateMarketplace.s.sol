// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NFTFactory.sol";
import "../src/Marketplace.sol";
import "../src/Auction.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract PopulateMarketplace is Script {
    NFTFactory nftFactory;
    Marketplace marketplace;
    Auction auction;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address nftFactoryAddress = vm.envAddress("NFT_FACTORY_ADDRESS");
        address marketplaceAddress = vm.envAddress("MARKETPLACE_ADDRESS");
        address auctionAddress = vm.envAddress("AUCTION_ADDRESS");

        nftFactory = NFTFactory(nftFactoryAddress);
        marketplace = Marketplace(marketplaceAddress);
        auction = Auction(auctionAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Get the actual sender address (the one that will own the NFTs)
        address sender = vm.addr(deployerPrivateKey);

        // Create ERC721 Collection
        address erc721Collection = createERC721Collection();

        // Create ERC1155 Collection
        address erc1155Collection = createERC1155Collection();

        // Mint NFTs to the script runner (sender)
        mintSampleNFTs(erc721Collection, erc1155Collection, sender);

        // List some NFTs on marketplace (now owned by sender)
        listSampleNFTs(erc721Collection, erc1155Collection);

        // Create some auctions
        createSampleAuctions(erc721Collection, erc1155Collection);

        vm.stopBroadcast();

        console.log("Marketplace populated successfully!");
    }

    function createERC721Collection() internal returns (address) {
        console.log("Creating ERC721 Collection...");

        nftFactory.createERC721Collection{value: 0.01 ether}(
            "Cool Cats Collection",
            "CCC",
            "A collection of cool cat NFTs",
            500 // 5% royalty
        );

        NFTFactory.Collection[] memory collections = nftFactory
            .getAllCollections();
        address collectionAddress = collections[collections.length - 1]
            .contractAddress;

        console.log("ERC721 Collection created at:", collectionAddress);
        return collectionAddress;
    }

    function createERC1155Collection() internal returns (address) {
        console.log("Creating ERC1155 Collection...");

        nftFactory.createERC1155Collection{value: 0.01 ether}(
            "Gaming Items",
            "GAME",
            "A collection of gaming items and assets",
            250 // 2.5% royalty
        );

        NFTFactory.Collection[] memory collections = nftFactory
            .getAllCollections();
        address collectionAddress = collections[collections.length - 1]
            .contractAddress;

        console.log("ERC1155 Collection created at:", collectionAddress);
        return collectionAddress;
    }

    function mintSampleNFTs(
        address erc721Collection,
        address erc1155Collection,
        address recipient
    ) internal {
        console.log("Minting sample NFTs...");

        // Mint ERC721 NFTs to the recipient (script runner)
        string[3] memory erc721URIs = [
            "https://ipfs.io/ipfs/QmSampleHash1",
            "https://ipfs.io/ipfs/QmSampleHash2",
            "https://ipfs.io/ipfs/QmSampleHash3"
        ];

        for (uint i = 0; i < 3; i++) {
            nftFactory.mintNFT721(
                erc721Collection,
                recipient, // Mint to the actual sender
                erc721URIs[i]
            );
        }

        // Mint ERC1155 NFTs to the recipient (script runner)
        string[2] memory erc1155URIs = [
            "https://ipfs.io/ipfs/QmGameItem1",
            "https://ipfs.io/ipfs/QmGameItem2"
        ];

        nftFactory.mintNFT1155(
            erc1155Collection,
            recipient, // Mint to the actual sender
            100, // amount
            erc1155URIs[0]
        );

        nftFactory.mintNFT1155(
            erc1155Collection,
            recipient, // Mint to the actual sender
            50, // amount
            erc1155URIs[1]
        );

        console.log("Sample NFTs minted successfully");
    }

    function listSampleNFTs(
        address erc721Collection,
        address erc1155Collection
    ) internal {
        console.log("Listing sample NFTs on marketplace...");

        // Approve marketplace for ERC721 using IERC721 interface
        IERC721(erc721Collection).approve(address(marketplace), 0);
        IERC721(erc721Collection).approve(address(marketplace), 1);

        // List ERC721 NFTs
        marketplace.listNFT(
            erc721Collection,
            0, // tokenId
            0.1 ether, // price
            1, // amount
            false, // isERC1155
            address(0) // ETH payment
        );

        marketplace.listNFT(
            erc721Collection,
            1, // tokenId
            0.05 ether, // price
            1, // amount
            false, // isERC1155
            address(0) // ETH payment
        );

        // Approve marketplace for ERC1155 using IERC1155 interface
        IERC1155(erc1155Collection).setApprovalForAll(
            address(marketplace),
            true
        );

        // List ERC1155 NFT
        marketplace.listNFT(
            erc1155Collection,
            0, // tokenId
            0.01 ether, // price per item
            10, // amount to sell
            true, // isERC1155
            address(0) // ETH payment
        );

        console.log("Sample NFTs listed successfully");
    }

    function createSampleAuctions(
        address erc721Collection,
        address erc1155Collection
    ) internal {
        console.log("Creating sample auctions...");

        // Approve auction contract for ERC721
        IERC721(erc721Collection).approve(address(auction), 2);

        // Create ERC721 auction
        auction.createAuction(
            erc721Collection,
            2, // tokenId
            0.05 ether, // starting price
            7 days, // duration
            1, // amount
            false, // isERC1155
            address(0) // ETH payment
        );

        // Approve auction contract for ERC1155
        IERC1155(erc1155Collection).setApprovalForAll(address(auction), true);

        // Create ERC1155 auction
        auction.createAuction(
            erc1155Collection,
            1, // tokenId
            0.005 ether, // starting price
            3 days, // duration
            5, // amount
            true, // isERC1155
            address(0) // ETH payment
        );

        console.log("Sample auctions created successfully");
    }
}
