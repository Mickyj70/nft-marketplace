/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { OwnedNFTCard } from "@/components/OwnedNFTCard";
import { ConnectFirst } from "@/components/ConnectFirst";
import { useNFT } from "@/hooks/useNFT";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
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
            <ConnectFirst message={""} />
          ) : isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg">Loading your NFTs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-500">
                Error loading NFTs: {error}
              </p>
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
                <OwnedNFTCard
                  key={`${nft.tokenAddress}-${nft.tokenId}-${refreshKey}`}
                  nft={nft}
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
