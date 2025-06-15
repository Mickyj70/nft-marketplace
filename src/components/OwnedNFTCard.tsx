"use client";

import { useState } from "react";
import { NFT } from "@/hooks/useNFT";
import Image from "next/image";

interface OwnedNFTCardProps {
  nft: NFT;
  onAction?: () => void;
}

export function OwnedNFTCard({ nft }: OwnedNFTCardProps) {
  const [imageError, setImageError] = useState(false);

  // Generate a placeholder image based on contract and token ID
  const getPlaceholderImage = () => {
    const seed = `${nft.tokenAddress}-${nft.tokenId}`;
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=1f2937,374151,4b5563&size=400`;
  };

  const displayImage = imageError ? getPlaceholderImage() : nft.image;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <Image
          src={displayImage}
          alt={nft.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{nft.name}</h3>
        {nft.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {nft.description}
          </p>
        )}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Token ID: {nft.tokenId}</span>
          {nft.collection && <span>{nft.collection.name}</span>}
        </div>
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Attributes:</p>
            <div className="flex flex-wrap gap-1">
              {nft.attributes.slice(0, 3).map((attr, index) => (
                <span
                  key={index}
                  className="text-xs bg-secondary px-2 py-1 rounded"
                >
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
              {nft.attributes.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{nft.attributes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
