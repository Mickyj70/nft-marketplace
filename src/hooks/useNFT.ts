"use client";

import { useAccount, useReadContract } from "wagmi";
import { readContract } from "@wagmi/core";
import { useState, useEffect } from "react";
import { config } from "@/config/wagmi";

// Enhanced ERC721 ABI with more functions
const ERC721_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "tokensOfOwner",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

export type NFT = {
  id: string;
  name: string;
  image: string;
  description?: string;
  tokenAddress: string;
  tokenId: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  collection?: {
    name: string;
    symbol: string;
  };
};

// Helper function to fetch metadata with retries and fallbacks
const fetchMetadataWithFallback = async (
  tokenURI: string,
  tokenId: string
): Promise<any> => {
  const maxRetries = 3;
  const timeout = 10000; // 10 seconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Handle different URI formats
      let formattedURI = tokenURI;

      if (tokenURI.startsWith("ipfs://")) {
        // Try multiple IPFS gateways
        const gateways = [
          "https://ipfs.io/ipfs/",
          "https://gateway.pinata.cloud/ipfs/",
          "https://cloudflare-ipfs.com/ipfs/",
        ];
        formattedURI = tokenURI.replace(
          "ipfs://",
          gateways[attempt % gateways.length]
        );
      } else if (tokenURI.startsWith("ar://")) {
        formattedURI = tokenURI.replace("ar://", "https://arweave.net/");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(formattedURI, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.warn(
        `Attempt ${attempt + 1} failed for tokenURI ${tokenURI}:`,
        error
      );

      if (attempt === maxRetries - 1) {
        // Return fallback metadata on final failure
        return {
          name: `NFT #${tokenId}`,
          description: "Metadata could not be loaded",
          image: `https://via.placeholder.com/300x300/1e88e5/ffffff?text=NFT+${tokenId}`,
          attributes: [],
        };
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};

// Helper function to format image URLs
const formatImageURL = (imageUrl: string, tokenId: string): string => {
  if (!imageUrl) {
    return `https://via.placeholder.com/300x300/1e88e5/ffffff?text=NFT+${tokenId}`;
  }

  if (imageUrl.startsWith("ipfs://")) {
    return imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  if (imageUrl.startsWith("ar://")) {
    return imageUrl.replace("ar://", "https://arweave.net/");
  }

  return imageUrl;
};

// Add ERC1155 ABI
const ERC1155_ABI = [
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "uri",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

// Add function to detect token standard
const detectTokenStandard = async (tokenAddress: string) => {
  try {
    // Check if it supports ERC1155 interface (0xd9b67a26)
    const supportsERC1155 = await readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC1155_ABI,
      functionName: "supportsInterface",
      args: ["0xd9b67a26"],
    });

    if (supportsERC1155) return "ERC1155";
    return "ERC721";
  } catch {
    return "ERC721"; // Default fallback
  }
};

// Update the useNFT function to handle both standards
export function useNFT(tokenAddress: string) {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenStandard, setTokenStandard] = useState<string | null>(null);

  // Add debugging
  console.log('useNFT called with:', { tokenAddress, address });

  // Move useReadContract hooks outside of useEffect
  const { data: collectionName, error: nameError } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "name",
    query: { enabled: !!tokenAddress }
  });

  const { data: collectionSymbol, error: symbolError } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress }
  });

  const { data: balance, error: balanceError } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!tokenAddress }
  });

  const { data: tokenIds, error: tokenIdsError } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC721_ABI,
    functionName: "tokensOfOwner",
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!tokenAddress }
  });

  // Log contract call results
  console.log('Contract call results:', {
    collectionName,
    collectionSymbol,
    balance,
    tokenIds,
    errors: { nameError, symbolError, balanceError, tokenIdsError }
  });

  useEffect(() => {
    const fetchNFTs = async () => {
      console.log('fetchNFTs called with:', { address, tokenAddress });
      
      if (!address || !tokenAddress) {
        console.log('Missing address or tokenAddress');
        setNfts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if any of the basic contract calls failed
        if (nameError || symbolError || balanceError) {
          console.error('Contract call errors:', { nameError, symbolError, balanceError });
          throw new Error('Failed to read contract data. Contract might not be ERC721 compatible.');
        }

        // Detect token standard
        const standard = await detectTokenStandard(tokenAddress);
        console.log('Detected token standard:', standard);
        setTokenStandard(standard);

        if (standard === "ERC1155") {
          // For ERC1155, we need to check specific token IDs
          const tokenId = 1;

          const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: ERC1155_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`, BigInt(tokenId)],
          });

          console.log('ERC1155 balance for token 1:', balance);

          if (balance && Number(balance) > 0) {
            const tokenURI = (await readContract(config, {
              address: tokenAddress as `0x${string}`,
              abi: ERC1155_ABI,
              functionName: "uri",
              args: [BigInt(tokenId)],
            })) as string;

            const metadata = await fetchMetadataWithFallback(
              tokenURI,
              tokenId.toString()
            );

            const nft: NFT = {
              id: tokenId.toString(),
              name: metadata.name || `NFT #${tokenId}`,
              image: formatImageURL(metadata.image, tokenId.toString()),
              description: metadata.description || "",
              tokenAddress,
              tokenId: tokenId.toString(),
              attributes: metadata.attributes || [],
              collection: {
                name: "ERC1155 Collection",
                symbol: "ERC1155",
              },
            };

            setNfts([nft]);
          } else {
            setNfts([]);
          }
        } else {
          // ERC721 logic
          console.log('Processing ERC721, balance:', balance, 'tokenIds:', tokenIds);
          
          if (tokenIdsError) {
            console.error('TokenIds error:', tokenIdsError);
            // Fallback: try to enumerate tokens manually if tokensOfOwner fails
            if (balance && Number(balance) > 0) {
              console.log('Trying manual enumeration fallback');
              // This is a fallback for contracts that don't have tokensOfOwner
              const fallbackNFTs: NFT[] = [];
              for (let i = 0; i < Math.min(Number(balance), 10); i++) {
                fallbackNFTs.push({
                  id: i.toString(),
                  name: `${collectionName || "NFT"} #${i}`,
                  image: `https://via.placeholder.com/300x300/1e88e5/ffffff?text=NFT+${i}`,
                  description: "NFT from contract without tokensOfOwner function",
                  tokenAddress,
                  tokenId: i.toString(),
                  attributes: [],
                  collection: {
                    name: (collectionName as string) || "Unknown Collection",
                    symbol: (collectionSymbol as string) || "UNKNOWN",
                  },
                });
              }
              setNfts(fallbackNFTs);
              return;
            } else {
              throw new Error('Contract does not support tokensOfOwner function and balance is 0');
            }
          }

          if (!tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
            console.log('No tokens found for this address');
            setNfts([]);
            setIsLoading(false);
            return;
          }

          console.log(`Processing ${tokenIds.length} tokens`);

          // Process tokens in batches
          const batchSize = 5;
          const allNFTs: NFT[] = [];

          for (let i = 0; i < tokenIds.length; i += batchSize) {
            const batch = tokenIds.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1}:`, batch);

            const batchPromises = batch.map(async (tokenId: bigint) => {
              try {
                const tokenURI = (await readContract(config, {
                  address: tokenAddress as `0x${string}`,
                  abi: ERC721_ABI,
                  functionName: "tokenURI",
                  args: [tokenId],
                })) as string;

                console.log(`Token ${tokenId} URI:`, tokenURI);

                const metadata = await fetchMetadataWithFallback(
                  tokenURI,
                  tokenId.toString()
                );

                const nft: NFT = {
                  id: tokenId.toString(),
                  name:
                    metadata.name ||
                    `${collectionName || "NFT"} #${tokenId.toString()}`,
                  image: formatImageURL(
                    metadata.image,
                    tokenId.toString()
                  ),
                  description: metadata.description || "",
                  tokenAddress,
                  tokenId: tokenId.toString(),
                  attributes: metadata.attributes || [],
                  collection: {
                    name: (collectionName as string) || "Unknown Collection",
                    symbol: (collectionSymbol as string) || "UNKNOWN",
                  },
                };

                console.log(`Successfully processed NFT ${tokenId}:`, nft);
                return nft;
              } catch (error) {
                console.error(`Error processing NFT ${tokenId}:`, error);
                return {
                  id: tokenId.toString(),
                  name: `${collectionName || "NFT"} #${tokenId.toString()}`,
                  image: `https://via.placeholder.com/300x300/1e88e5/ffffff?text=NFT+${tokenId.toString()}`,
                  description: "Error loading NFT metadata",
                  tokenAddress,
                  tokenId: tokenId.toString(),
                  attributes: [],
                  collection: {
                    name: (collectionName as string) || "Unknown Collection",
                    symbol: (collectionSymbol as string) || "UNKNOWN",
                  },
                };
              }
            });

            const batchResults = await Promise.all(batchPromises);
            allNFTs.push(...batchResults);
          }

          console.log('Final NFTs array:', allNFTs);
          setNfts(allNFTs);
        }
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setError(error instanceof Error ? error.message : "Failed to load NFTs");
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, tokenAddress]); // Simplified dependencies

  return {
    nfts,
    isLoading,
    error,
    balance: balance ? Number(balance) : 0,
    collection: {
      name: collectionName as string,
      symbol: collectionSymbol as string,
    },
    tokenStandard
  };
}
