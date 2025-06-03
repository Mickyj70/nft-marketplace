import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/config/contracts";

export function useMarketplace() {
  const { data: listings, isLoading: isLoadingListings } = useReadContract({
    address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
    abi: MARKETPLACE_ABI,
    functionName: "listings",
  });

  const { writeContract, isPending } = useWriteContract();

  const buyNFT = (listingId: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "buyNFT",
      args: [listingId as `0x${string}`, BigInt(0)],
    });
  };

  const listNFT = (tokenAddress: string, tokenId: string, price: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.MARKETPLACE as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "listNFT",
      args: [
        tokenAddress as `0x${string}`,
        BigInt(tokenId),
        price,
        BigInt(0),
        false,
        "0x0000000000000000000000000000000000000000",
      ],
    });
  };

  return {
    listings,
    isLoadingListings,
    buyNFT,
    listNFT,
    isPending,
  };
}
