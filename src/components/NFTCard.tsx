"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useAccount } from "wagmi";

interface Listing {
  seller: string;
  nftContract: string;
  tokenId: string;
  amount: bigint;
  price: bigint;
  isActive: boolean;
  isERC1155: boolean;
  paymentToken: string;
}

interface NFTCardProps {
  listing: Listing;
}

export function NFTCard({ listing }: NFTCardProps) {
  const { buyNFT, isPending } = useMarketplace();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = address?.toLowerCase() === listing.seller.toLowerCase();
  const isETH =
    listing.paymentToken === "0x0000000000000000000000000000000000000000";

  // Generate a placeholder image based on contract and token ID
  const getPlaceholderImage = () => {
    const seed = `${listing.nftContract}-${listing.tokenId}`;
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=1f2937,374151,4b5563&size=400`;
  };

  // Get collection name based on contract address
  const getCollectionName = () => {
    const contract = listing.nftContract.toLowerCase();
    if (contract === "0xc659f3a4875d8e806e93ad4c1617919be118a69e") {
      return "Cool Cats Collection";
    }
    if (contract === "0x00ba7ecb90f5d024342327e47938a31e0a6a2026") {
      return "Gaming Items";
    }
    return `Collection ${listing.nftContract.slice(0, 6)}...`;
  };

  const handleBuy = async () => {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }

    if (isOwner) {
      alert("You cannot buy your own NFT");
      return;
    }

    try {
      setIsLoading(true);
      await buyNFT(
        listing.nftContract,
        listing.tokenId,
        listing.price,
        listing.paymentToken
      );
      alert("Purchase successful!");
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300 group">
      {/* NFT Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-800">
        <img
          src={getPlaceholderImage()}
          alt={`${getCollectionName()} #${listing.tokenId}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback to a solid color if image fails
            e.currentTarget.style.display = "none";
          }}
        />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
            {listing.isERC1155 ? "ERC1155" : "ERC721"}
          </span>
        </div>

        {/* Amount Badge (for ERC1155) */}
        {listing.isERC1155 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {listing.amount.toString()} available
            </span>
          </div>
        )}
      </div>

      {/* NFT Details */}
      <div className="p-6">
        {/* Collection & Token ID */}
        <div className="mb-3">
          <p className="text-gray-400 text-sm">{getCollectionName()}</p>
          <h3 className="text-lg font-semibold text-white">
            #{listing.tokenId}
          </h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Price</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">
              {formatEther(listing.price)}
            </span>
            <span className="text-gray-400">{isETH ? "ETH" : "USDC"}</span>
          </div>
        </div>

        {/* Seller */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Seller</p>
          <p className="text-white font-mono text-sm">
            {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          </p>
        </div>

        {/* Action Button */}
        {isOwner ? (
          <button
            disabled
            className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
          >
            Your NFT
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={isLoading || isPending}
            className="w-full py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading || isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Buying...
              </span>
            ) : (
              `Buy for ${formatEther(listing.price)} ${isETH ? "ETH" : "USDC"}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
