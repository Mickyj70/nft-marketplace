"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, AUCTION_ABI } from "@/config/contracts";
import { config } from "@/config/wagmi";
import { parseAbiItem } from "viem";

interface Auction {
  seller: string;
  nftContract: string;
  tokenId: string;
  amount: bigint;
  startingPrice: bigint;
  endTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  isActive: boolean;
  isERC1155: boolean;
  paymentToken: string;
}

export function useAuctions() {
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [isLoadingAllAuctions, setIsLoadingAllAuctions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { writeContract, isPending } = useWriteContract();

  const isLoadingRef = useRef(false);

  // Known NFT contracts from your populate script
  //   const KNOWN_NFTS = [
  //     // Cool Cats Collection (ERC721) - token 2 should be in auction
  //     {
  //       contract: "0xC659F3A4875D8E806E93aD4C1617919Be118A69E",
  //       tokenId: 2,
  //       isERC1155: false,
  //     },
  //     // Gaming Items (ERC1155) - token 1 should be in auction
  //     {
  //       contract: "0x00BA7eCb90F5D024342327E47938A31e0A6A2026",
  //       tokenId: 1,
  //       isERC1155: true,
  //     },
  //   ];

  useEffect(() => {
    const loadAllAuctions = async () => {
      if (isLoadingRef.current || !publicClient) {
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingAllAuctions(true);
        setError(null);

        console.log("🚀 Loading auctions...");

        const activeAuctions: Auction[] = [];
        const currentTime = BigInt(Math.floor(Date.now() / 1000));

        // Try event-based discovery first
        try {
          console.log("📡 Attempting auction event-based discovery...");

          const currentBlock = await publicClient.getBlockNumber();
          const fromBlock = currentBlock - BigInt(5000); // Smaller range to avoid RPC limits

          console.log(
            `📡 Fetching AuctionCreated events from block ${fromBlock} to ${currentBlock}`
          );

          const auctionCreatedLogs = await publicClient.getLogs({
            address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
            event: parseAbiItem(
              "event AuctionCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 startingPrice, uint256 endTime, address paymentToken)"
            ),
            fromBlock,
            toBlock: currentBlock,
          });

          console.log(
            `📋 Found ${auctionCreatedLogs.length} auction creation events`
          );

          if (auctionCreatedLogs.length > 0) {
            // Process events
            const auctionIdentifiers = new Set<string>();
            const auctionDetails: Array<{
              nftContract: string;
              tokenId: string;
            }> = [];

            for (const log of auctionCreatedLogs) {
              const { nftContract, tokenId } = log.args;
              const identifier = `${nftContract}-${tokenId}`;

              if (!auctionIdentifiers.has(identifier)) {
                auctionIdentifiers.add(identifier);
                auctionDetails.push({
                  nftContract: nftContract as string,
                  tokenId: tokenId?.toString() || "0",
                });
              }
            }

            // Check each discovered auction
            for (const { nftContract, tokenId } of auctionDetails) {
              const auction = await checkAuction(
                nftContract,
                tokenId,
                currentTime
              );
              if (auction) {
                activeAuctions.push(auction);
              }
            }
          }
        } catch (eventError) {
          console.log("❌ Auction event discovery failed:", eventError);
        }

        // Try event-based discovery with chunked scanning
        try {
          console.log("📡 Attempting chunked auction event-based discovery...");

          const currentBlock = await publicClient.getBlockNumber();
          const CHUNK_SIZE = 5000; // Smaller chunk size to avoid RPC limits
          const TOTAL_BLOCKS_TO_SCAN = 100000; // Scan last 100k blocks (about 2-3 weeks)
          const startBlock = currentBlock - BigInt(TOTAL_BLOCKS_TO_SCAN);

          console.log(
            `📡 Scanning ${TOTAL_BLOCKS_TO_SCAN} blocks in chunks of ${CHUNK_SIZE} for auctions`
          );

          const auctionIdentifiers = new Set<string>();
          const auctionDetails: Array<{
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
                `📡 Fetching auction events from block ${fromBlock} to ${toBlock} (${
                  toBlock - fromBlock
                } blocks)`
              );

              const auctionCreatedLogs = await publicClient.getLogs({
                address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
                event: parseAbiItem(
                  "event AuctionCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 startingPrice, uint256 endTime, address paymentToken)"
                ),
                fromBlock,
                toBlock,
              });

              console.log(
                `📋 Found ${auctionCreatedLogs.length} auction creation events in chunk`
              );

              // Process events from this chunk
              for (const log of auctionCreatedLogs) {
                const { nftContract, tokenId } = log.args;
                const identifier = `${nftContract}-${tokenId}`;

                if (!auctionIdentifiers.has(identifier)) {
                  auctionIdentifiers.add(identifier);
                  auctionDetails.push({
                    nftContract: nftContract as string,
                    tokenId: tokenId?.toString() || "0",
                  });
                }
              }

              // Add a small delay between chunks to be nice to the RPC provider
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (chunkError) {
              console.log(
                `❌ Error scanning auction chunk ${fromBlock}-${toBlock}:`,
                chunkError
              );
              // Continue with next chunk even if one fails
              continue;
            }
          }

          console.log(
            `📋 Found ${auctionDetails.length} unique auctions from events`
          );

          // Check each discovered auction
          for (const { nftContract, tokenId } of auctionDetails) {
            try {
              const auction = await checkAuction(
                nftContract,
                tokenId,
                currentTime
              );
              if (auction) {
                activeAuctions.push(auction);
              }
              // Small delay between contract calls
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              console.log(
                `❌ Error checking auction ${nftContract}-${tokenId}:`,
                error
              );
            }
          }
        } catch (eventError) {
          console.log("❌ Auction event discovery failed:", eventError);
        }

        // Always check known NFTs as well (fallback + supplement)
        console.log("🔍 Checking known NFT contracts for auctions...");

        // for (const nft of KNOWN_NFTS) {
        //   try {
        //     const auction = await checkAuction(
        //       nft.contract,
        //       nft.tokenId.toString(),
        //       currentTime
        //     );
        //     if (auction) {
        //       // Avoid duplicates
        //       const exists = activeAuctions.some(
        //         (a) =>
        //           a.nftContract === auction.nftContract &&
        //           a.tokenId === auction.tokenId
        //       );
        //       if (!exists) {
        //         activeAuctions.push(auction);
        //       }
        //     }
        //   } catch (error) {
        //     console.log(
        //       `❌ Error checking known NFT auction ${nft.contract}-${nft.tokenId}:`,
        //       error
        //     );
        //   }
        // }

        console.log(`🎉 Found ${activeAuctions.length} total active auctions`);
        setAllAuctions(activeAuctions);
      } catch (error) {
        console.error("💥 Error loading auctions:", error);
        setError(`Failed to load auctions: ${error}`);
      } finally {
        setIsLoadingAllAuctions(false);
        isLoadingRef.current = false;
      }
    };

    // Helper function to check individual auctions
    const checkAuction = async (
      nftContract: string,
      tokenId: string,
      currentTime: bigint
    ) => {
      try {
        console.log(
          `🔍 Checking auction for ${nftContract} token ${tokenId}...`
        );

        // Remove this duplicate line - currentTime is already passed as parameter
        // const currentTime = BigInt(Math.floor(Date.now() / 1000));

        const auctionInfo = (await readContract(config, {
          address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
          abi: AUCTION_ABI,
          functionName: "auctions",
          args: [nftContract as `0x${string}`, BigInt(tokenId)],
        })) as [
          string,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          string,
          bigint,
          boolean,
          boolean,
          string
        ];

        // Array structure from your Auction.sol contract:
        // struct AuctionInfo {
        //     address seller;           // 0
        //     address nftContract;      // 1
        //     uint256 tokenId;          // 2
        //     uint256 amount;           // 3
        //     uint256 startingPrice;    // 4
        //     uint256 endTime;          // 5
        //     address highestBidder;    // 6
        //     uint256 highestBid;       // 7
        //     bool isActive;            // 8
        //     bool isERC1155;           // 9
        //     address paymentToken;     // 10
        // }
        const [
          seller,
          contractAddr,
          tokenIdBig,
          amount,
          startingPrice,
          endTime,
          highestBidder,
          highestBid,
          isActive,
          isERC1155,
          paymentToken,
        ] = auctionInfo;

        console.log(`📋 Auction ${nftContract}-${tokenId}:`, {
          seller,
          startingPrice: startingPrice.toString(),
          endTime: endTime.toString(),
          currentTime: currentTime.toString(),
          isActive,
          isERC1155,
        });

        // Check if auction exists, is active, and hasn't expired
        if (isActive && startingPrice > BigInt(0) && endTime > currentTime) {
          const auction: Auction = {
            seller: seller as string,
            nftContract: contractAddr as string,
            tokenId: tokenIdBig.toString(),
            amount: amount as bigint,
            startingPrice: startingPrice as bigint,
            endTime: endTime as bigint,
            highestBidder: highestBidder as string,
            highestBid: highestBid as bigint,
            isActive: isActive as boolean,
            isERC1155: isERC1155 as boolean,
            paymentToken: paymentToken as string,
          };

          console.log(
            `✅ Active auction: ${nftContract}-${tokenId}, ends at ${endTime}`
          );
          return auction;
        } else {
          if (!isActive) {
            console.log(`❌ Auction not active: ${nftContract}-${tokenId}`);
          } else if (startingPrice === BigInt(0)) {
            console.log(`❌ No starting price: ${nftContract}-${tokenId}`);
          } else if (endTime <= currentTime) {
            console.log(
              `❌ Auction expired: ${nftContract}-${tokenId} (ended at ${endTime}, current ${currentTime})`
            );
          }
          return null;
        }
      } catch (error) {
        console.log(
          `❌ Error checking auction ${nftContract}-${tokenId}:`,
          error
        );
        return null;
      }
    };

    loadAllAuctions();
  }, [publicClient]);

  const createAuction = useCallback(
    async (
      nftContract: string,
      tokenId: string,
      startingPrice: bigint,
      duration: bigint,
      amount: bigint = BigInt(1),
      isERC1155: boolean = false,
      paymentToken: string = "0x0000000000000000000000000000000000000000"
    ) => {
      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
          abi: AUCTION_ABI,
          functionName: "createAuction",
          args: [
            nftContract as `0x${string}`,
            BigInt(tokenId),
            startingPrice,
            duration,
            amount,
            isERC1155,
            paymentToken as `0x${string}`,
          ],
        });
      } catch (error) {
        console.error("Error creating auction:", error);
        throw error;
      }
    },
    [writeContract]
  );

  const placeBid = useCallback(
    async (
      nftContract: string,
      tokenId: string,
      bidAmount: bigint,
      paymentToken?: string
    ) => {
      try {
        if (paymentToken === "0x0000000000000000000000000000000000000000") {
          // ETH bid
          await writeContract({
            address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
            abi: AUCTION_ABI,
            functionName: "placeBid",
            args: [nftContract as `0x${string}`, BigInt(tokenId), bidAmount],
            value: bidAmount,
          });
        } else {
          // USDC bid
          await writeContract({
            address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
            abi: AUCTION_ABI,
            functionName: "placeBid",
            args: [nftContract as `0x${string}`, BigInt(tokenId), bidAmount],
          });
        }
      } catch (error) {
        console.error("Error placing bid:", error);
        throw error;
      }
    },
    [writeContract]
  );

  const endAuction = useCallback(
    async (nftContract: string, tokenId: string) => {
      try {
        await writeContract({
          address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
          abi: AUCTION_ABI,
          functionName: "endAuction",
          args: [nftContract as `0x${string}`, BigInt(tokenId)],
        });
      } catch (error) {
        console.error("Error ending auction:", error);
        throw error;
      }
    },
    [writeContract]
  );

  return {
    allAuctions: allAuctions.filter((auction) => auction.isActive),
    isLoadingAllAuctions,
    error,
    createAuction,
    placeBid,
    endAuction,
    isPending,
  };
}
