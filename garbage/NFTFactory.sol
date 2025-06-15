// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./ChainConfig.sol";
import "./Royalty.sol";

// ERC721 Collection Contract
contract MarketplaceNFT721 is ERC721, ERC721URIStorage, IERC2981 {
    address public creator;
    address public factory; // Make sure this exists
    uint256 private _nextTokenId;
    uint256 public royaltyPercentage;
    string public collectionDescription;

    constructor(
        string memory name,
        string memory symbol,
        string memory description,
        address _creator,
        uint256 _royaltyPercentage
    ) ERC721(name, symbol) {
        creator = _creator;
        factory = msg.sender; // This should be the NFTFactory address
        collectionDescription = description;
        royaltyPercentage = _royaltyPercentage;
    }

    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function mint(address to, string memory uri) external {
        require(
            msg.sender == creator || msg.sender == factory,
            "Only creator or factory can mint"
        );
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        return (creator, (salePrice * royaltyPercentage) / 10000);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, IERC165) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

// ERC1155 Collection Contract
contract MarketplaceNFT1155 is ERC1155, IERC2981 {
    address public creator;
    address public factory; // Add factory address
    uint256 private _nextTokenId;
    uint256 public royaltyPercentage;
    string public name;
    string public symbol;
    string public collectionDescription;

    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => uint256) public tokenSupply;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory description,
        address _creator,
        uint256 _royaltyPercentage
    ) ERC1155("") {
        name = _name;
        symbol = _symbol;
        collectionDescription = description;
        creator = _creator;
        factory = msg.sender; // Set factory as the deployer
        royaltyPercentage = _royaltyPercentage;
    }

    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function mint(address to, uint256 amount, string memory tokenUri) external {
        require(
            msg.sender == creator || msg.sender == factory,
            "Only creator or factory can mint"
        );
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId, amount, "");
        _setTokenURI(tokenId, tokenUri);
        tokenSupply[tokenId] = amount;
    }

    function _setTokenURI(uint256 tokenId, string memory tokenUri) internal {
        _tokenURIs[tokenId] = tokenUri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        return (creator, (salePrice * royaltyPercentage) / 10000);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, IERC165) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

// NFT Factory Contract
contract NFTFactory is ChainConfig {
    struct Collection {
        address contractAddress;
        address creator;
        string name;
        string symbol;
        string description;
        bool isERC1155;
        uint256 createdAt;
    }

    // Platform fee for creating collections (in basis points)
    uint256 public collectionCreationFee = 100; // 1%
    uint256 public collectionCreationFeeFlat = 0.01 ether; // Flat fee in ETH

    Collection[] public collections;
    mapping(address => uint256[]) public userCollections;
    mapping(address => bool) public isMarketplaceCollection;

    event CollectionCreated(
        address indexed creator,
        address indexed contractAddress,
        string name,
        string symbol,
        bool isERC1155
    );

    event NFTMinted(
        address indexed creator,
        address indexed contractAddress,
        uint256 indexed tokenId,
        address recipient
    );

    constructor() ChainConfig() {}

    function createERC721Collection(
        string memory name,
        string memory symbol,
        string memory description,
        uint256 royaltyPercentage
    ) external payable onlySupportedChain {
        require(msg.value >= collectionCreationFeeFlat, "Insufficient fee");
        require(royaltyPercentage <= 1000, "Royalty too high"); // Max 10%

        MarketplaceNFT721 newCollection = new MarketplaceNFT721(
            name,
            symbol,
            description,
            msg.sender,
            royaltyPercentage
        );

        address contractAddress = address(newCollection);

        Collection memory collection = Collection({
            contractAddress: contractAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            description: description,
            isERC1155: false,
            createdAt: block.timestamp
        });

        collections.push(collection);
        userCollections[msg.sender].push(collections.length - 1);
        isMarketplaceCollection[contractAddress] = true;

        // Send fee to owner
        if (msg.value > 0) {
            payable(owner()).transfer(msg.value);
        }

        emit CollectionCreated(
            msg.sender,
            contractAddress,
            name,
            symbol,
            false
        );
    }

    function createERC1155Collection(
        string memory name,
        string memory symbol,
        string memory description,
        uint256 royaltyPercentage
    ) external payable onlySupportedChain {
        require(msg.value >= collectionCreationFeeFlat, "Insufficient fee");
        require(royaltyPercentage <= 1000, "Royalty too high"); // Max 10%

        MarketplaceNFT1155 newCollection = new MarketplaceNFT1155(
            name,
            symbol,
            description,
            msg.sender,
            royaltyPercentage
        );

        address contractAddress = address(newCollection);

        Collection memory collection = Collection({
            contractAddress: contractAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            description: description,
            isERC1155: true,
            createdAt: block.timestamp
        });

        collections.push(collection);
        userCollections[msg.sender].push(collections.length - 1);
        isMarketplaceCollection[contractAddress] = true;

        // Send fee to owner
        if (msg.value > 0) {
            payable(owner()).transfer(msg.value);
        }

        emit CollectionCreated(msg.sender, contractAddress, name, symbol, true);
    }

    function mintNFT721(
        address collectionAddress,
        address recipient,
        string memory tokenUri
    ) external onlySupportedChain {
        require(
            isMarketplaceCollection[collectionAddress],
            "Invalid collection"
        );

        MarketplaceNFT721 collection = MarketplaceNFT721(collectionAddress);
        require(collection.creator() == msg.sender, "Not collection creator");

        uint256 tokenId = collection.getNextTokenId(); // Use the correct getter function
        collection.mint(recipient, tokenUri);

        emit NFTMinted(msg.sender, collectionAddress, tokenId, recipient);
    }
    function mintNFT1155(
        address collectionAddress,
        address recipient,
        uint256 amount,
        string memory tokenUri
    ) external onlySupportedChain {
        require(
            isMarketplaceCollection[collectionAddress],
            "Invalid collection"
        );
        require(amount > 0, "Amount must be greater than zero");

        MarketplaceNFT1155 collection = MarketplaceNFT1155(collectionAddress);
        require(collection.creator() == msg.sender, "Not collection creator");

        uint256 tokenId = collection.getNextTokenId(); // Use the getter function
        collection.mint(recipient, amount, tokenUri);

        emit NFTMinted(msg.sender, collectionAddress, tokenId, recipient);
    }

    function getUserCollections(
        address user
    ) external view returns (Collection[] memory) {
        uint256[] memory userCollectionIds = userCollections[user];
        Collection[] memory userColls = new Collection[](
            userCollectionIds.length
        );

        for (uint256 i = 0; i < userCollectionIds.length; i++) {
            userColls[i] = collections[userCollectionIds[i]];
        }

        return userColls;
    }

    function getAllCollections() external view returns (Collection[] memory) {
        return collections;
    }

    function setCollectionCreationFee(uint256 _feeFlat) external onlyOwner {
        collectionCreationFeeFlat = _feeFlat;
    }

    // Emergency withdrawal
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
