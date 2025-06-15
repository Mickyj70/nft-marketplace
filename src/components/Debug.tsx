"use client";

import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { usePublicClient } from "wagmi";
import { useState } from "react";

export function Debug() {
  const [showDebug, setShowDebug] = useState(false);
  const publicClient = usePublicClient();

  const checkContract = async (address: string, name: string) => {
    if (!publicClient) return;

    try {
      const code = await publicClient.getBytecode({
        address: address as `0x${string}`,
      });
      console.log(
        `${name} contract at ${address}:`,
        code ? "✅ Deployed" : "❌ Not found"
      );
    } catch (error) {
      console.error(`Error checking ${name}:`, error);
    }
  };

  const runDebug = () => {
    console.log("=== CONTRACT DEBUG INFO ===");
    console.log("Contract Addresses:", CONTRACT_ADDRESSES);

    Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
      checkContract(address, name);
    });
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-gray-300">Contract Addresses:</div>
        {Object.entries(CONTRACT_ADDRESSES).map(([name, address]) => (
          <div key={name} className="text-xs">
            <span className="text-blue-400">{name}:</span>
            <br />
            <span className="text-gray-400 font-mono">{address}</span>
          </div>
        ))}

        <button
          onClick={runDebug}
          className="w-full mt-4 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Check Contracts
        </button>
      </div>
    </div>
  );
}
