"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/config/contracts";
import { config } from "@/config/wagmi";
import { parseAbiItem } from "viem";

interface Listing {
  seller: string;
  nftContract: string;
  tokenId: string;
  amount: bigint;
  price: bigint;
  isActive: boolean;
  isERC1155: boolean;
  paymentToken: string;
}

export function useMarketplace() {
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoadingAllListings, setIsLoadingAllListings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { writeContract, isPending } = useWriteContract();

  const isLoadingRef = useRef(false);

  // Known NFT contracts from your populate script
  // const KNOWN_NFTS = [
  //   {
  //     contract: "0xC659F3A4875D8E806E93aD4C1617919Be118A69E",
  //     tokenId: 0,
  //     isERC1155: false,
  //   },
  //   {
  //     contract: "0xC659F3A4875D8E806E93aD4C1617919Be118A69E",
  //     tokenId: 1,
  //     isERC1155: false,
  //   },
  //   {
  //     contract: "0x00BA7eCb90F5D024342327E47938A31e0A6A2026",
  //     tokenId: 0,
  //     isERC1155: true,
  //   },
  // ];

  useEffect(() => {
    const loadAllListings = async () => {
      if (isLoadingRef.current || !publicClient) {
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingAllListings(true);
        setError(null);

        console.log("🚀 Loading marketplace listings...");

        const activeListings: Listing[] = [];

        // Try event-based discovery with chunked scanning
        try {
          console.log("📡 Attempting chunked event-based discovery...");

          const currentBlock = await publicClient.getBlockNumber();
          const CHUNK_SIZE = 5000; // Smaller chunk size to avoid RPC limits
          const TOTAL_BLOCKS_TO_SCAN = 100000; // Scan last 100k blocks (about 2-3 weeks)
          const startBlock = currentBlock - BigInt(TOTAL_BLOCKS_TO_SCAN);

          console.log(
            `📡 Scanning ${TOTAL_BLOCKS_TO_SCAN} blocks in chunks of ${CHUNK_SIZE}`
          );

          const listingIdentifiers = new Set<string>();
          const listingDetails: Array<{
            nftContract: string;
            tokenId: string;
          }> = [];

          // Scan in chunks to avoid RPC limits
          for (
            let fromBlock = startBlock;
            fromBlock < currentBlock;
            fromBlock += BigInt(CHUNK_SIZE)
          ) {
            const toBlock =
              fromBlock + BigInt(CHUNK_SIZE) > currentBlock
                ? currentBlock
                : fromBlock + BigInt(CHUNK_SIZE);

            try {
              console.log(
                `📡 Fetching events from block ${fromBlock} to ${toBlock} (${
                  toBlock - fromBlock
                } blocks)`
              );

              const nftListedLogs = await publicClient.getLogs({
                address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
                event: parseAbiItem(
                  "event NFTListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price, address paymentToken)"
                ),
                fromBlock,
                toBlock,
              });

              console.log(
                `📋 Found ${nftListedLogs.length} NFT listing events in chunk`
              );

              // Process events from this chunk
              for (const log of nftListedLogs) {
                const { nftContract, tokenId } = log.args;
                const identifier = `${nftContract}-${tokenId}`;

                if (!listingIdentifiers.has(identifier)) {
                  listingIdentifiers.add(identifier);
                  listingDetails.push({
                    nftContract: nftContract as string,
                    tokenId: tokenId?.toString() || "0",
                  });
                }
              }

              // Add a small delay between chunks to be nice to the RPC provider
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (chunkError) {
              console.log(
                `❌ Error scanning chunk ${fromBlock}-${toBlock}:`,
                chunkError
              );
              // Continue with next chunk even if one fails
              continue;
            }
          }

          console.log(
            `📋 Found ${listingDetails.length} unique listings from events`
          );

          // Check each discovered listing
          for (const { nftContract, tokenId } of listingDetails) {
            try {
              const listing = await checkListing(nftContract, tokenId);
              if (listing) {
                activeListings.push(listing);
              }
              // Small delay between contract calls
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              console.log(
                `❌ Error checking listing ${nftContract}-${tokenId}:`,
                error
              );
            }
          }
        } catch (eventError) {
          console.log("❌ Event discovery failed:", eventError);
        }

        // Always check known NFTs as well (fallback + supplement)
        // console.log("🔍 Checking known NFT contracts...");

        // for (const nft of KNOWN_NFTS) {
        //   try {
        //     const listing = await checkListing(
        //       nft.contract,
        //       nft.tokenId.toString()
        //     );
        //     if (listing) {
        //       // Avoid duplicates
        //       const exists = activeListings.some(
        //         (l) =>
        //           l.nftContract === listing.nftContract &&
        //           l.tokenId === listing.tokenId
        //       );
        //       if (!exists) {
        //         activeListings.push(listing);
        //       }
        //     }
        //   } catch (error) {
        //     console.log(
        //       `❌ Error checking known NFT ${nft.contract}-${nft.tokenId}:`,
        //       error
        //     );
        //   }
        // }

        console.log(`🎉 Found ${activeListings.length} total active listings`);
        setAllListings(activeListings);
      } catch (error) {
        console.error("💥 Error loading listings:", error);
        setError(`Failed to load listings: ${error}`);
      } finally {
        setIsLoadingAllListings(false);
        isLoadingRef.current = false;
      }
    };

    // Helper function to check individual listings
    const checkListing = async (
      nftContract: string,
      tokenId: string
    ): Promise<Listing | null> => {
      try {
        console.log(
          `🔍 Checking listing for ${nftContract} token ${tokenId}...`
        );

        const listingInfo = (await readContract(config, {
          address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: "listings",
          args: [nftContract as `0x${string}`, BigInt(tokenId)],
        })) as any[];

        const [
          seller,
          contractAddr,
          tokenIdBig,
          amount,
          price,
          isActive,
          isERC1155,
          paymentToken,
        ] = listingInfo;

        console.log(`📋 Listing ${nftContract}-${tokenId}:`, {
          seller,
          price: price.toString(),
          isActive,
          isERC1155,
        });

        // Only return active listings with valid price
        if (isActive && price > 0n) {
          const listing: Listing = {
            seller: seller as string,
            nftContract: contractAddr as string,
            tokenId: tokenIdBig.toString(),
            amount: amount as bigint,
            price: price as bigint,
            isActive: isActive as boolean,
            isERC1155: isERC1155 as boolean,
            paymentToken: paymentToken as string,
          };

          console.log(
            `✅ Active listing: ${nftContract}-${tokenId} for ${price} wei`
          );
          return listing;
        } else {
          console.log(`❌ Inactive listing: ${nftContract}-${tokenId}`);
          return null;
        }
      } catch (error) {
        console.log(
          `❌ Error checking listing ${nftContract}-${tokenId}:`,
          error
        );
        return null;
      }
    };

    loadAllListings();
  }, [publicClient]);

  const listNFT = useCallback(
    async (
      nftContract: string,
      tokenId: string,
      price: bigint,
      amount: bigint = 1n,
      isERC1155: boolean = false,
      paymentToken: string = "0x0000000000000000000000000000000000000000"
    ) => {
      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: "listNFT",
          args: [
            nftContract as `0x${string}`,
            BigInt(tokenId),
            price,
            amount,
            isERC1155,
            paymentToken as `0x${string}`,
          ],
        });
      } catch (error) {
        console.error("Error listing NFT:", error);
        throw error;
      }
    },
    [writeContract]
  );

  const buyNFT = useCallback(
    async (
      nftContract: string,
      tokenId: string,
      price: bigint,
      paymentToken?: string
    ) => {
      try {
        if (paymentToken === "0x0000000000000000000000000000000000000000") {
          // ETH purchase
          await writeContract({
            address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
            abi: MARKETPLACE_ABI,
            functionName: "buyNFT",
            args: [nftContract as `0x${string}`, BigInt(tokenId)],
            value: price,
          });
        } else {
          // USDC purchase
          await writeContract({
            address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
            abi: MARKETPLACE_ABI,
            functionName: "buyNFT",
            args: [nftContract as `0x${string}`, BigInt(tokenId)],
          });
        }
      } catch (error) {
        console.error("Error buying NFT:", error);
        throw error;
      }
    },
    [writeContract]
  );

  const delistNFT = useCallback(
    async (nftContract: string, tokenId: string) => {
      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: "delistNFT",
          args: [nftContract as `0x${string}`, BigInt(tokenId)],
        });
      } catch (error) {
        console.error("Error delisting NFT:", error);
        throw error;
      }
    },
    [writeContract]
  );

  return {
    allListings: allListings.filter((listing) => listing.isActive),
    isLoadingAllListings,
    error,
    listNFT,
    buyNFT,
    delistNFT,
    isPending,
  };
}
