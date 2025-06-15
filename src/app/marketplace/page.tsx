"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useMarketplace } from "@/hooks/useMarketplace";
import { NFTCard } from "@/components/NFTCard";
// import { DataTest } from "@/components/DataTest";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

export default function MarketplacePage() {
  const { allListings, isLoadingAllListings, error } = useMarketplace();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced filtering with better search
  const filteredListings = allListings
    .filter((listing) => {
      // Payment token filter
      if (filterBy === "eth")
        return (
          listing.paymentToken === "0x0000000000000000000000000000000000000000"
        );
      if (filterBy === "usdc")
        return (
          listing.paymentToken !== "0x0000000000000000000000000000000000000000"
        );
      return true;
    })
    .filter((listing) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        listing.tokenId.toLowerCase().includes(search) ||
        listing.nftContract.toLowerCase().includes(search) ||
        listing.seller.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.price - b.price);
        case "price-high":
          return Number(b.price - a.price);
        case "newest":
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Debug Component - Shows raw data for testing */}
          {/* <DataTest /> */}

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-gray-400 text-lg">
              Discover and collect extraordinary NFTs
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">Error loading marketplace: {error}</p>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by token ID, contract address, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-gray-500 focus:outline-none text-white placeholder-gray-500"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-gray-500 focus:outline-none text-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                  showFilters
                    ? "bg-gray-700 border-gray-500"
                    : "bg-gray-900 border-gray-700 hover:border-gray-500"
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
                {filterBy !== "all" && (
                  <span className="ml-1 px-2 py-1 bg-blue-600 text-xs rounded-full">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Token
                    </label>
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-gray-500 focus:outline-none text-white"
                    >
                      <option value="all">All Tokens</option>
                      <option value="eth">ETH Only</option>
                      <option value="usdc">USDC Only</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  {(filterBy !== "all" || searchTerm) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setFilterBy("all");
                          setSearchTerm("");
                        }}
                        className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results Count and Status */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-400">
              {isLoadingAllListings ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                  Loading marketplace...
                </span>
              ) : (
                <>
                  {filteredListings.length} of {allListings.length} NFTs
                  {searchTerm && ` matching "${searchTerm}"`}
                  {filterBy !== "all" && ` (${filterBy.toUpperCase()} only)`}
                </>
              )}
            </p>

            {/* Network Status */}
            <div className="text-sm text-gray-500">Sepolia Testnet</div>
          </div>

          {/* NFT Grid */}
          {isLoadingAllListings ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
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
          ) : filteredListings.length > 0 ? (
            // NFT Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing) => (
                <NFTCard
                  key={`${listing.nftContract}-${listing.tokenId}`}
                  listing={listing}
                />
              ))}
            </div>
          ) : allListings.length === 0 && !isLoadingAllListings ? (
            // No listings at all
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No NFTs Listed</h3>
              <p className="text-gray-400 mb-6">
                Be the first to list an NFT on this marketplace!
              </p>
              <button className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors">
                List Your NFT
              </button>
            </div>
          ) : (
            // No results for current filters
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No NFTs found</h3>
              <p className="text-gray-400 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                }}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Debug Info (Remove in production) */}
          {/* {process.env.NODE_ENV === "development" && (
            <div className="mt-12 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Debug Info:
              </h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Total listings: {allListings.length}</p>
                <p>Filtered listings: {filteredListings.length}</p>
                <p>Loading: {isLoadingAllListings.toString()}</p>
                <p>Error: {error || "None"}</p>
                <p>Search: `{searchTerm}`</p>
                <p>Filter: {filterBy}</p>
                <p>Sort: {sortBy}</p>
              </div>
            </div>
          )} */}
        </div>
      </main>
    </div>
  );
}
