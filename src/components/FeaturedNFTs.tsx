"use client";

import { useState, useEffect } from "react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { NFTCard } from "./NFTCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function FeaturedNFTs() {
  const { allListings, isLoadingAllListings } = useMarketplace();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else if (window.innerWidth < 1280) setItemsPerView(3);
      else setItemsPerView(4);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerView >= allListings.length ? 0 : prev + itemsPerView
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0
        ? Math.max(0, allListings.length - itemsPerView)
        : prev - itemsPerView
    );
  };

  if (isLoadingAllListings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (allListings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No NFTs available at the moment</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
          }}
        >
          {allListings.map((listing, index) => (
            <div
              key={`${listing.nftContract}-${listing.tokenId}`}
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <NFTCard listing={listing} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      {allListings.length > itemsPerView && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-black/80 hover:bg-black text-white p-2 rounded-full border border-gray-700 hover:border-gray-500 transition-all"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-black/80 hover:bg-black text-white p-2 rounded-full border border-gray-700 hover:border-gray-500 transition-all"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      <div className="flex justify-center mt-8 space-x-2">
        {Array.from({
          length: Math.ceil(allListings.length / itemsPerView),
        }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index * itemsPerView)}
            className={`w-2 h-2 rounded-full transition-all ${
              Math.floor(currentIndex / itemsPerView) === index
                ? "bg-white"
                : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
