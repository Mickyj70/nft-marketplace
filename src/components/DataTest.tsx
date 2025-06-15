"use client";

import { useMarketplace } from "@/hooks/useMarketplace";
import { formatEther } from "viem";

export function DataTest() {
  const { allListings, isLoadingAllListings, error } = useMarketplace();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-yellow-400">
        🔧 Debug Data (Development Only)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-400">Status</p>
          <p className="font-mono">
            {isLoadingAllListings ? "Loading..." : "Loaded"}
          </p>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-400">Total Listings</p>
          <p className="font-mono text-green-400">{allListings.length}</p>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-sm text-gray-400">Error</p>
          <p className="font-mono text-red-400">{error || "None"}</p>
        </div>
      </div>

      {allListings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-300">Raw Listings:</h4>
          {allListings.map((listing, index) => (
            <div key={index} className="bg-gray-800 p-3 rounded text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Contract:</span>
                  <p className="font-mono break-all">{listing.nftContract}</p>
                </div>
                <div>
                  <span className="text-gray-400">Token ID:</span>
                  <p className="font-mono">{listing.tokenId}</p>
                </div>
                <div>
                  <span className="text-gray-400">Price:</span>
                  <p className="font-mono text-green-400">
                    {formatEther(listing.price)} ETH
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <p className="font-mono">
                    {listing.isERC1155 ? "ERC1155" : "ERC721"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
