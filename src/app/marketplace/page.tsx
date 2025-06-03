// import { Navbar } from "@/components/Navbar";
import { NFTCard } from "@/components/NFTCard";

export default function MarketplacePage() {
  // This would be replaced with actual data from your contracts
  const mockNFTs = [
    {
      id: "1",
      name: "Abstract Art #1",
      price: "0.05 ETH",
      image:
        "https://ik.imagekit.io/mickyj77/crypto-art.png?updatedAt=1748991934207",
      seller: "0x1234...5678",
    },
    {
      id: "2",
      name: "Digital Landscape",
      price: "0.08 ETH",
      image:
        "https://ik.imagekit.io/mickyj77/crypto-art.png?updatedAt=1748991934207",
      seller: "0x8765...4321",
    },
    {
      id: "3",
      name: "Crypto Punk Clone",
      price: "0.12 ETH",
      image:
        "https://ik.imagekit.io/mickyj77/crypto-art.png?updatedAt=1748991934207",
      seller: "0x2468...1357",
    },
    {
      id: "4",
      name: "Metaverse Land",
      price: "0.2 ETH",
      image:
        "https://ik.imagekit.io/mickyj77/crypto-art.png?updatedAt=1748991934207",
      seller: "0x1357...2468",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navbar /> */}

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">NFT Marketplace</h1>
          <p className="text-lg mb-8">
            Browse and purchase unique digital assets on the Sepolia testnet
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} type="marketplace" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
