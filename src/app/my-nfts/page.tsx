// import { Navbar } from "@/components/Navbar";
import { NFTCard } from "@/components/NFTCard";
import { ConnectFirst } from "@/components/ConnectFirst";

export default function MyNFTsPage() {
  // This would be replaced with actual data from your contracts
  const mockMyNFTs = [
    {
      id: "1",
      name: "My Art #1",
      image: "https://placehold.co/300x300/1e88e5/ffffff?text=My+NFT+1",
    },
    {
      id: "2",
      name: "My Creation #2",
      image: "https://placehold.co/300x300/0f4c81/ffffff?text=My+NFT+2",
    },
  ];

  // In a real implementation, you would check if the user is connected
  const isConnected = false; // Replace with actual wallet connection check

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">My NFTs</h1>
          <p className="text-lg mb-8">View and manage your NFT collection</p>

          {!isConnected ? (
            <ConnectFirst message="Connect your wallet to view your NFTs" />
          ) : mockMyNFTs.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-lg">
              <h3 className="text-xl font-medium mb-2">
                You don&apos;t own any NFTs yet
              </h3>
              <p className="mb-4">
                Purchase your first NFT from the marketplace or create your own
              </p>
              <a
                href="/marketplace"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
              >
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockMyNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} type="owned" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
