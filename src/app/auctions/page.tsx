// import { Navbar } from "@/components/Navbar";
import { NFTCard } from "@/components/NFTCard";

export default function AuctionsPage() {
  // This would be replaced with actual data from your contracts
  const mockAuctions = [
    {
      id: "1",
      name: "Rare Collectible",
      currentBid: "0.15 ETH",
      image: "https://placehold.co/300x300/1e88e5/ffffff?text=Auction+1",
      seller: "0x1234...5678",
      endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    },
    {
      id: "2",
      name: "Digital Masterpiece",
      currentBid: "0.25 ETH",
      image: "https://placehold.co/300x300/0f4c81/ffffff?text=Auction+2",
      seller: "0x8765...4321",
      endTime: new Date(Date.now() + 172800000).toISOString(), // 48 hours from now
    },
    {
      id: "3",
      name: "Virtual Reality Asset",
      currentBid: "0.18 ETH",
      image: "https://placehold.co/300x300/64b5f6/ffffff?text=Auction+3",
      seller: "0x2468...1357",
      endTime: new Date(Date.now() + 259200000).toISOString(), // 72 hours from now
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Live Auctions</h1>
          <p className="text-lg mb-8">
            Bid on exclusive NFTs before time runs out
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAuctions.map((auction) => (
              <NFTCard key={auction.id} nft={auction} type="auction" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
