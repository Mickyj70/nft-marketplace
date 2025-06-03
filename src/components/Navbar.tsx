"use client";
import Link from "next/link";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  return (
    <nav className="border-b border-border py-4 px-6 bg-background sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary">
          META MINT
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/marketplace"
            className="hover:text-primary transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/auctions"
            className="hover:text-primary transition-colors"
          >
            Auctions
          </Link>
          <Link
            href="/my-nfts"
            className="hover:text-primary transition-colors"
          >
            My NFTs
          </Link>
        </div>

        <WalletConnect />
      </div>
    </nav>
  );
}
