"use client";
import { WalletConnect } from "./WalletConnect";

type ConnectFirstProps = {
  message: string;
};

export function ConnectFirst({ message }: ConnectFirstProps) {
  return (
    <div className="text-center py-12 bg-secondary rounded-lg">
      <h3 className="text-xl font-medium mb-4">{message}</h3>
      <div className="inline-block">
        <WalletConnect />
      </div>
    </div>
  );
}
