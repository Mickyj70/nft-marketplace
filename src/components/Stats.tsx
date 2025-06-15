"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/config/contracts";

export function Stats() {
  const [stats, setStats] = useState({
    totalVolume: "0",
    totalSales: "0",
    activeListings: "0",
    totalUsers: "0",
  });

  // You can add contract reads here to get real stats
  // For now, using placeholder animated numbers

  useEffect(() => {
    // Animate numbers on mount
    const animateValue = (
      start: number,
      end: number,
      duration: number,
      callback: (value: string) => void
    ) => {
      let startTimestamp: number;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        callback(value.toLocaleString());
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    setTimeout(() => {
      animateValue(0, 1250, 2000, (value) =>
        setStats((prev) => ({ ...prev, totalVolume: value }))
      );
      animateValue(0, 850, 2000, (value) =>
        setStats((prev) => ({ ...prev, totalSales: value }))
      );
      animateValue(0, 120, 2000, (value) =>
        setStats((prev) => ({ ...prev, activeListings: value }))
      );
      animateValue(0, 2400, 2000, (value) =>
        setStats((prev) => ({ ...prev, totalUsers: value }))
      );
    }, 500);
  }, []);

  return (
    <section className="py-20 px-6 bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.totalVolume}
            </div>
            <div className="text-gray-400 text-sm md:text-base">ETH Volume</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.totalSales}
            </div>
            <div className="text-gray-400 text-sm md:text-base">
              Total Sales
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.activeListings}
            </div>
            <div className="text-gray-400 text-sm md:text-base">
              Active Listings
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.totalUsers}
            </div>
            <div className="text-gray-400 text-sm md:text-base">Users</div>
          </div>
        </div>
      </div>
    </section>
  );
}
