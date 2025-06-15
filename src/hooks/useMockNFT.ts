import { useState, useEffect } from "react";
import { NFT } from "./useNFT";

const MOCK_NFTS: NFT[] = [
  {
    id: "1",
    name: "Cool Cat #1",
    image: "https://picsum.photos/300/300?random=1",
    description: "A cool cat NFT for testing",
    tokenAddress: "0x1111111111111111111111111111111111111111",
    tokenId: "1",
    attributes: [
      { trait_type: "Background", value: "Blue" },
      { trait_type: "Eyes", value: "Green" }
    ],
    collection: {
      name: "Test Collection",
      symbol: "TEST"
    }
  },
  {
    id: "2",
    name: "Space Dog #42",
    image: "https://picsum.photos/300/300?random=2",
    description: "A space-themed dog NFT",
    tokenAddress: "0x1111111111111111111111111111111111111111",
    tokenId: "2",
    attributes: [
      { trait_type: "Background", value: "Space" },
      { trait_type: "Breed", value: "Husky" }
    ],
    collection: {
      name: "Test Collection",
      symbol: "TEST"
    }
  },
  {
    id: "3",
    name: "Pixel Art #7",
    image: "https://picsum.photos/300/300?random=3",
    description: "Retro pixel art NFT",
    tokenAddress: "0x1111111111111111111111111111111111111111",
    tokenId: "3",
    attributes: [
      { trait_type: "Style", value: "8-bit" },
      { trait_type: "Color", value: "Rainbow" }
    ],
    collection: {
      name: "Test Collection",
      symbol: "TEST"
    }
  }
];

export function useMockNFT(tokenAddress: string) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setNfts(MOCK_NFTS);
      setIsLoading(false);
    }, 1000);
  }, [tokenAddress]);

  return { nfts, isLoading, error: null };
}