"use client";
import Image from "next/image";
import { useState } from "react";

type NFTCardProps = {
  nft: {
    id: string;
    name: string;
    image: string;
    price?: string;
    currentBid?: string;
    endTime?: string;
  };
  type: "marketplace" | "auction" | "owned";
};

export function NFTCard({ nft, type }: NFTCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-square">
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoadingComplete={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{nft.name}</h3>

        {type === "marketplace" && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="font-medium">{nft.price}</span>
          </div>
        )}

        {type === "auction" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current bid</span>
              <span className="font-medium">{nft.currentBid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ends in</span>
              <span className="font-medium">
                {nft.endTime ? new Date(nft.endTime).toLocaleString() : "-"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4">
          {type === "marketplace" && (
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
              Buy Now
            </button>
          )}

          {type === "auction" && (
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
              Place Bid
            </button>
          )}

          {type === "owned" && (
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
                Sell
              </button>
              <button className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/90 transition-colors">
                Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
