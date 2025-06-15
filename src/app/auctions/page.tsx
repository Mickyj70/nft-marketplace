"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuctions } from "@/hooks/useAuctions";
import { AuctionCard } from "@/components/AuctionCard";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function AuctionsPage() {
  const { allAuctions, isLoadingAllAuctions } = useAuctions();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("ending-soon");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filterBy, setFilterBy] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active"); // Add status filter

  const filteredAuctions = allAuctions
    .filter((auction) => {
      // Status filter - this should be the primary filter
      if (statusFilter === "active") {
        const currentTime = Math.floor(Date.now() / 1000);
        return auction.isActive && Number(auction.endTime) > currentTime;
      }
      if (statusFilter === "expired") {
        const currentTime = Math.floor(Date.now() / 1000);
        return !auction.isActive || Number(auction.endTime) <= currentTime;
      }
      // If statusFilter === "all", don't filter by status at all

      return true; // Show all auctions regardless of status
    })
    .filter((auction) => {
      // Secondary filter: Payment token and bid filters
      if (filterBy === "eth") {
        return (
          auction.paymentToken === "0x0000000000000000000000000000000000000000"
        );
      }
      if (filterBy === "usdc") {
        return (
          auction.paymentToken !== "0x0000000000000000000000000000000000000000"
        );
      }
      if (filterBy === "no-bids") {
        return auction.highestBid === BigInt(0);
      }
      if (filterBy === "with-bids") {
        return auction.highestBid > BigInt(0);
      }
      // If filterBy === "all", show all payment types
      return true;
    })
    .filter(
      (auction) =>
        auction.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.nftContract.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "ending-soon":
          return Number(a.endTime - b.endTime);
        case "newest":
          return Number(b.endTime - a.endTime);
        case "price-low":
          const aPrice =
            a.highestBid > BigInt(0) ? a.highestBid : a.startingPrice;
          const bPrice =
            b.highestBid > BigInt(0) ? b.highestBid : b.startingPrice;
          return Number(aPrice - bPrice);
        case "price-high":
          const aPriceHigh =
            a.highestBid > BigInt(0) ? a.highestBid : a.startingPrice;
          const bPriceHigh =
            b.highestBid > BigInt(0) ? b.highestBid : b.startingPrice;
          return Number(bPriceHigh - aPriceHigh);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Live Auctions
            </h1>
            <p className="text-gray-400 text-lg">
              Bid on exclusive NFTs from top creators
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search auctions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-gray-500 focus:outline-none text-white"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-gray-500 focus:outline-none text-white"
              >
                <option value="ending-soon">Ending Soon</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auction Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-gray-500 focus:outline-none text-white"
                    >
                      <option value="active">Active Only</option>
                      <option value="expired">Expired Only</option>
                      <option value="all">All Auctions</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              {isLoadingAllAuctions
                ? "Loading..."
                : `${filteredAuctions.length} ${
                    statusFilter === "all" ? "" : statusFilter
                  } auctions`}
            </p>
          </div>

          {/* Auctions Grid */}
          {isLoadingAllAuctions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-gray-800" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-800 rounded" />
                    <div className="h-3 bg-gray-800 rounded w-2/3" />
                    <div className="h-10 bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={`${auction.nftContract}-${auction.tokenId}`}
                  auction={auction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <ClockIcon className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No active auctions</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
