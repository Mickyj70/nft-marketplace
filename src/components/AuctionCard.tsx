/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAuctions } from "@/hooks/useAuctions";
import {
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface Auction {
  seller: string;
  nftContract: string;
  tokenId: string;
  amount: bigint;
  startingPrice: bigint;
  endTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  isActive: boolean;
  isERC1155: boolean;
  paymentToken: string;
  isExpired?: boolean; // Add this field
}

interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [showBidModal, setShowBidModal] = useState(false);
  const { placeBid, endAuction, isPending } = useAuctions();

  const isETH =
    auction.paymentToken === "0x0000000000000000000000000000000000000000";
  const currentPrice =
    auction.highestBid > 0n ? auction.highestBid : auction.startingPrice;
  const timeLeft = Number(auction.endTime) - Math.floor(Date.now() / 1000);
  const isExpired = timeLeft <= 0;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Expired";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBid = async () => {
    if (!bidAmount) return;

    try {
      const bidValue = parseEther(bidAmount);
      await placeBid(
        auction.nftContract,
        auction.tokenId,
        bidValue,
        auction.paymentToken
      );
      setShowBidModal(false);
      setBidAmount("");
    } catch (error) {
      console.error("Error placing bid:", error);
    }
  };

  const handleEndAuction = async () => {
    try {
      await endAuction(auction.nftContract, auction.tokenId);
    } catch (error) {
      console.error("Error ending auction:", error);
    }
  };

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
        {/* NFT Image Placeholder */}
        <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-sm text-gray-400">
              {auction.isERC1155 ? "ERC1155" : "ERC721"}
            </p>
            <p className="text-xs text-gray-500">Token #{auction.tokenId}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">
            {auction.isERC1155 ? "Gaming Item" : "Cool Cat"} #{auction.tokenId}
          </h3>

          {/* Current Price */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">
              {auction.highestBid > 0n ? "Current Bid" : "Starting Price"}
            </p>
            <p className="text-xl font-bold flex items-center gap-2">
              {formatEther(currentPrice)} {isETH ? "ETH" : "USDC"}
              <span className="text-sm font-normal text-gray-400">
                {isETH ? "💎" : "💰"}
              </span>
            </p>
          </div>

          {/* Auction Info */}
          <div className="space-y-2 mb-4">
            {/* Time Left */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Time Left
              </span>
              <span
                className={`font-medium ${
                  isExpired ? "text-red-400" : "text-white"
                }`}
              >
                {formatTimeLeft(timeLeft)}
              </span>
            </div>

            {/* Highest Bidder */}
            {auction.highestBidder !==
              "0x0000000000000000000000000000000000000000" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  Highest Bidder
                </span>
                <span className="font-mono text-xs">
                  {auction.highestBidder.slice(0, 6)}...
                  {auction.highestBidder.slice(-4)}
                </span>
              </div>
            )}

            {/* Amount (for ERC1155) */}
            {auction.isERC1155 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="font-medium">{auction.amount.toString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isExpired ? (
              <button
                onClick={() => setShowBidModal(true)}
                disabled={isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending ? "Processing..." : "Place Bid"}
              </button>
            ) : (
              <button
                onClick={handleEndAuction}
                disabled={isPending}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending ? "Processing..." : "End Auction"}
              </button>
            )}
          </div>

          {/* Seller Info */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Seller</span>
              <span className="font-mono text-xs">
                {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Place Your Bid</h3>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Current{" "}
                {auction.highestBid > 0n ? "highest bid" : "starting price"}:
              </p>
              <p className="text-lg font-bold">
                {formatEther(currentPrice)} {isETH ? "ETH" : "USDC"}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Bid Amount ({isETH ? "ETH" : "USDC"})
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-gray-500 focus:outline-none text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Must be higher than current{" "}
                {auction.highestBid > 0n ? "bid" : "starting price"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBidModal(false);
                  setBidAmount("");
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBid}
                disabled={
                  !bidAmount ||
                  isPending ||
                  parseEther(bidAmount || "0") <= currentPrice
                }
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isPending ? "Placing..." : "Place Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
