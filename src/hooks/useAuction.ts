import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESSES, AUCTION_ABI } from "@/config/contracts";

export function useAuction() {
  const { data: auctions, isLoading: isLoadingAuctions } = useReadContract({
    address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
    abi: AUCTION_ABI,
    functionName: "auctions",
  });

  const { writeContract, isPending } = useWriteContract();

  const placeBid = (auctionId: string, bidAmount: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
      abi: AUCTION_ABI,
      functionName: "placeBid",
      args: [auctionId as `0x${string}`, BigInt(0), bidAmount],
      value: bidAmount,
    });
  };

  const createAuction = (
    tokenAddress: string,
    tokenId: string,
    startingPrice: bigint,
    duration: bigint
  ) => {
    writeContract({
      address: CONTRACT_ADDRESSES.AUCTION as `0x${string}`,
      abi: AUCTION_ABI,
      functionName: "createAuction",
      args: [
        tokenAddress as `0x${string}`,
        BigInt(tokenId),
        startingPrice,
        duration,
        BigInt(0),
        false,
        "0x0000000000000000000000000000000000000000" as `0x${string}`,
      ],
    });
  };

  return {
    auctions,
    isLoadingAuctions,
    placeBid,
    createAuction,
    isPending,
  };
}
