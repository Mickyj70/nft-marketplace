"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { readContract } from "@wagmi/core";
import { CONTRACT_ADDRESSES, AUCTION_ABI } from "@/config/contracts";
import { config } from "@/config/wagmi";

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

  // Prevent multiple simultaneous calls
  const isLoadingRef = useRef(false);

  // Known NFT contracts and token IDs from your populate script
  const KNOWN_NFTS = [
    // Cool Cats Collection (ERC721) - token 2 should be in auction
    {
      contract: "0xC659F3A4875D8E806E93aD4C1617919Be118A69E",
      tokenId: 2,
      isERC1155: false,
    },
    // Gaming Items (ERC1155) - token 1 should be in auction
    {
      contract: "0x00BA7eCb90F5D024342327E47938A31e0A6A2026",
      tokenId: 1,
      isERC1155: true,
    },
  ];

  // Load auctions by directly checking known NFTs
  useEffect(() => {
    const loadAuctions = async () => {
      if (isLoadingRef.current) {
        console.log("⏳ Already loading auctions, skipping...");
        return;
      }

      console.log("🚀 Loading auctions directly from contract...");

      if (!publicClient) {
        console.log("❌ No public client");
        return;
      }

      try {
        isLoadingRef.current = true;
        setIsLoadingAllAuctions(true);
        setError(null);

        const activeAuctions: Auction[] = [];

        // Check each known NFT for auctions
        for (const nft of KNOWN_NFTS) {
          try {
            console.log(
              `🔍 Checking auction for ${nft.contract} token ${nft.tokenId}...`
            );

            const auctionInfo = (await readContract(config, {
              address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
              abi: AUCTION_ABI,
              functionName: "auctions",
              args: [nft.contract as `0x${string}`, BigInt(nft.tokenId)],
            })) as any[];

            console.log(
              `📋 Auction info for ${nft.contract}-${nft.tokenId}:`,
              auctionInfo
            );

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
              nftContract,
              tokenId,
              amount,
              startingPrice,
              endTime,
              highestBidder,
              highestBid,
              isActive,
              isERC1155,
              paymentToken,
            ] = auctionInfo;

            console.log(`🔍 Parsed auction data:`, {
              seller,
              nftContract,
              tokenId: tokenId.toString(),
              amount: amount.toString(),
              startingPrice: startingPrice.toString(),
              endTime: endTime.toString(),
              highestBidder,
              highestBid: highestBid.toString(),
              isActive,
              isERC1155,
              paymentToken,
            });

            // Check if auction exists and is active
            if (isActive && startingPrice > 0n) {
              const currentTime = BigInt(Math.floor(Date.now() / 1000));
              const isNotExpired = endTime > currentTime;

              console.log(
                `⏰ Time check: endTime=${endTime}, currentTime=${currentTime}, isNotExpired=${isNotExpired}`
              );

              if (isNotExpired) {
                const auction: Auction = {
                  seller: seller as string,
                  nftContract: nftContract as string,
                  tokenId: tokenId.toString(),
                  amount: amount as bigint,
                  startingPrice: startingPrice as bigint,
                  endTime: endTime as bigint,
                  highestBidder: highestBidder as string,
                  highestBid: highestBid as bigint,
                  isActive: isActive as boolean,
                  isERC1155: isERC1155 as boolean,
                  paymentToken: paymentToken as string,
                };

                activeAuctions.push(auction);
                console.log(`✅ Added active auction:`, auction);
              } else {
                console.log(
                  `❌ Auction expired: endTime=${endTime}, currentTime=${currentTime}`
                );
              }
            } else {
              console.log(
                `❌ Auction not active or no starting price: isActive=${isActive}, startingPrice=${startingPrice}`
              );
            }
          } catch (error) {
            console.log(
              `❌ Error checking auction ${nft.contract}-${nft.tokenId}:`,
              error
            );
          }
        }

        console.log(`🎉 Found ${activeAuctions.length} active auctions`);
        setAllAuctions(activeAuctions);
      } catch (error) {
        console.error("💥 Error loading auctions:", error);
        setError(`Failed to load auctions: ${error}`);
      } finally {
        setIsLoadingAllAuctions(false);
        isLoadingRef.current = false;
      }
    };

    loadAuctions();
  }, [publicClient]);

  const createAuction = useCallback(
    async (
      nftContract: string,
      tokenId: string,
      startingPrice: bigint,
      duration: bigint,
      amount: bigint = 1n,
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
