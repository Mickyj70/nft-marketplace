/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { NFTCard } from "@/components/NFTCard";
import { ConnectFirst } from "@/components/ConnectFirst";
import { useNFT } from "@/hooks/useNFT";
// import { useMockNFT as useNFT } from "@/hooks/useMockNFT";
import { useAccount } from "wagmi";
import { useState } from "react";

// This would be replaced with your actual NFT contract address
const NFT_CONTRACT_ADDRESS = "0xA750C75C7Cc451d663852035B5Fc2B8050bdde18";

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const { nfts, isLoading, error } = useNFT(NFT_CONTRACT_ADDRESS);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold">My NFTs</h1>
            {isConnected && (
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/90 transition-colors"
              >
                Refresh
              </button>
            )}
          </div>
          <p className="text-lg mb-8">View and manage your NFT collection</p>

          {!isConnected ? (
            <ConnectFirst message="Connect your wallet to view your NFTs" />
          ) : error ? (
            <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-xl font-medium mb-2 text-red-800">
                Error Loading NFTs
              </h3>
              <p className="mb-4 text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading your NFTs...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-lg">
              <h3 className="text-xl font-medium mb-2">
                You don&apos;t own any NFTs yet
              </h3>
              <p className="mb-4">
                Purchase your first NFT from the marketplace or create your own
              </p>
              <a
                href="/marketplace"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
              >
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard
                  key={`${nft.tokenAddress}-${nft.tokenId}-${refreshKey}`}
                  nft={nft}
                  type="owned"
                  onAction={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
