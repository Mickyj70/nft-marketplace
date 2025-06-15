import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";
import { metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';

export const config = getDefaultConfig({
  appName: "META MINT NFT Marketplace",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "d1a38616d696765b8cb9423347d0833e",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
  // Add explicit wallet configuration for better mobile support
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
      ],
    },
  ],
});
