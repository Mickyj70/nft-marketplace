import { useWriteContract, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";

const ERC721_APPROVAL_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export function useNFTApproval() {
  const { writeContract, isPending } = useWriteContract();

  const approveNFT = (nftContract: string, tokenId: string, operator: string) => {
    writeContract({
      address: nftContract as `0x${string}`,
      abi: ERC721_APPROVAL_ABI,
      functionName: "approve",
      args: [operator as `0x${string}`, BigInt(tokenId)],
    });
  };

  const setApprovalForAll = (nftContract: string, operator: string, approved: boolean) => {
    writeContract({
      address: nftContract as `0x${string}`,
      abi: ERC721_APPROVAL_ABI,
      functionName: "setApprovalForAll",
      args: [operator as `0x${string}`, approved],
    });
  };

  const checkApprovalForAll = (params: {
    nftContract: string;
    owner: string;
    operator: string;
  }) => {
    return useReadContract({
      address: params.nftContract as `0x${string}`,
      abi: ERC721_APPROVAL_ABI,
      functionName: "isApprovedForAll",
      args: [params.owner as `0x${string}`, params.operator as `0x${string}`],
    });
  };

  const checkApproved = (params: { nftContract: string; tokenId: string }) => {
    return useReadContract({
      address: params.nftContract as `0x${string}`,
      abi: ERC721_APPROVAL_ABI,
      functionName: "getApproved",
      args: [BigInt(params.tokenId)],
    });
  };

  return {
    approveNFT,
    setApprovalForAll,
    checkApprovalForAll,
    checkApproved,
    isPending,
  };
}