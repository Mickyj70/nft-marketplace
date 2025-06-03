// import { Navbar } from "@/components/Navbar";
import { WalletConnect } from "@/components/WalletConnect";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-12 md:py-20">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center md:text-left">
              Welcome to META MINT Marketplace
            </h1>
            <p className="text-lg md:text-xl mb-8 text-center md:text-left max-w-2xl">
              Discover, collect, and sell extraordinary NFTs on Sepolia testnet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Browse Marketplace</h2>
              <p className="mb-6 text-muted-foreground">
                Explore NFTs available for direct purchase
              </p>
              <a
                href="/marketplace"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Now
              </a>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Active Auctions</h2>
              <p className="mb-6 text-muted-foreground">
                Bid on NFTs currently up for auction
              </p>
              <a
                href="/auctions"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                View Auctions
              </a>
            </div>
          </div>

          <div className="mt-16 bg-secondary p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Connect Your Wallet
            </h2>
            <p className="text-center mb-6">
              Connect your wallet to start buying, selling, and trading NFTs
            </p>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 NFT Marketplace. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
