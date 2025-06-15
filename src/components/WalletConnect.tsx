"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useEffect, useState } from "react";

export function WalletConnect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile-specific connection handler
  const handleMobileConnect = () => {
    if (isMobile && typeof window !== "undefined") {
      // Try to detect MetaMask mobile app
      const isMetaMaskInstalled =
        typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask;

      if (isMetaMaskInstalled) {
        // Direct connection attempt for mobile MetaMask
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .catch((error: Error) => {
            console.log("MetaMask connection failed:", error);
          });
      } else {
        // Fallback to app store or deep link
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("android")) {
          window.open(
            "https://play.google.com/store/apps/details?id=io.metamask",
            "_blank"
          );
        } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
          window.open(
            "https://apps.apple.com/app/metamask/id1438144202",
            "_blank"
          );
        }
      }
    }
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={isMobile ? handleMobileConnect : openConnectModal}
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    style={{
                      minHeight: isMobile ? "44px" : "auto",
                      fontSize: isMobile ? "16px" : "14px",
                    }}
                  >
                    {isMobile ? "Connect" : "Connect Wallet"}
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex gap-2">
                  <button
                    onClick={openChainModal}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {chain.hasIcon && (
                      <div className="w-4 h-4">
                        {chain.iconUrl && (
                          <Image
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            width={16}
                            height={16}
                          />
                        )}
                      </div>
                    )}
                    {isMobile ? chain.name?.slice(0, 8) : chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    {isMobile
                      ? `${account.displayName?.slice(0, 6)}...`
                      : account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
