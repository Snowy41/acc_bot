import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import BalanceBadge from "./BalanceBadge"; // adjust import path if needed

export default function DepositPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch XMR address on mount
  useEffect(() => {
    setLoading(true);
    fetch("/api/wallet/xmr_address", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.address) {
          setAddress(data.address);
          setError(null);
        } else {
          setError(data.error || "Could not fetch XMR address.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });

    // Optionally fetch balance
    fetch("/api/wallet/balance", { credentials: "include" })
      .then(res => res.json())
      .then(data => setBalance(data.balance));
  }, []);

  // Poll for new site balance (optional: can use setInterval for live update)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetch("/api/wallet/balance", { credentials: "include" })
  //       .then(res => res.json())
  //       .then(data => setBalance(data.balance));
  //   }, 15000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="flex flex-col items-center min-h-[85vh] pt-20">
      <h1 className="text-3xl font-black text-aqua mb-6">Deposit Monero (XMR)</h1>

      <div className="bg-[#18212e]/80 border border-cyan-800 rounded-3xl shadow-2xl p-8 w-full max-w-lg mb-8 flex flex-col items-center">
        {loading ? (
          <div className="text-cyan-300">Loading your XMR deposit address…</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : address ? (
          <>
            <div className="mb-5">
            <QRCode value={address} size={170} bgColor="#162030" fgColor="#19e3f5" />
            </div>
            <div className="w-full text-center break-all font-mono text-lg text-cyan-200 bg-cyan-900/30 rounded-lg px-4 py-2 select-all mb-4">
              {address}
            </div>
            <button
              className={`bg-aqua text-midnight px-5 py-2 rounded-xl font-bold shadow hover:bg-cyan-400 transition mb-3`}
              onClick={() => {
                navigator.clipboard.writeText(address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copied!" : "Copy Address"}
            </button>
            <p className="text-cyan-400 mt-2 text-center">
              Send only <b>XMR</b> to this address.<br />
              Your deposit will be credited after <b>10 confirmations</b> (~20 min).
            </p>
            <p className="text-xs text-cyan-700 mt-3">
              Each user has a unique address—never reuse another user's address!
            </p>
          </>
        ) : null}

        <div className="mt-10">
          <BalanceBadge balance={balance} />
          <div className="text-cyan-300 text-sm mt-2">
            Current Site Balance
          </div>
        </div>
      </div>
      <div className="text-cyan-600 text-center text-sm max-w-md">
        <b>Test deposit:</b> Send any amount of XMR to your address above.
        It will be credited automatically after it appears on the blockchain.
        <br />
        Having trouble? <span className="underline cursor-pointer" onClick={() => window.location.href='/support'}>Contact support</span>
      </div>
    </div>
  );
}
