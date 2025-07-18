import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Username from "./Username"; // your animated username component

export default function MarketplaceCategoryView({ usertag, displayName }) {
  const [listings, setListings] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/forum/posts?category=marketplace")
      .then(res => res.json())
      .then(data => setListings(data.posts || []));
  }, []);

  // Create Listing Handler
  const handleCreate = async () => {
    if (!newTitle || !newPrice || !newDesc) return;
    setCreating(true);
    await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: newTitle,
        content: JSON.stringify({
          desc: newDesc,
          price: parseFloat(newPrice)
        }),
        category: "marketplace",
        usertag,
        username: displayName,
        role: "user",
      }),
    });
    setNewTitle("");
    setNewPrice("");
    setNewDesc("");
    setCreating(false);
    // Refresh
    fetch("/api/forum/posts?category=marketplace")
      .then(res => res.json())
      .then(data => setListings(data.posts || []));
  };

  // Parse out price and desc
  const parseListing = post => {
    let desc = "", price = "";
    try {
      const obj = JSON.parse(post.content);
      desc = obj.desc || "";
      price = obj.price || "";
    } catch {
      desc = post.content;
      price = "";
    }
    return { ...post, desc, price };
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-10 pb-24">
      <h2 className="text-4xl font-black text-aqua mb-8">Marketplace</h2>
      {/* --- Create Listing Card --- */}
      <div className="bg-[#162030]/90 border border-cyan-900/40 rounded-2xl p-8 mb-10 shadow-2xl">
        <h3 className="text-xl font-bold text-aqua mb-3">List a new item for sale</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            className="flex-1 bg-[#232e43] text-white px-4 py-2 rounded border border-cyan-800"
            placeholder="Title (e.g. Netflix Premium Account)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            maxLength={100}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-36 bg-[#232e43] text-white px-4 py-2 rounded border border-cyan-800"
            placeholder="Price (USD)"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
          />
        </div>
        <textarea
          className="w-full bg-[#232e43] text-white px-4 py-2 rounded border border-cyan-800 mt-4"
          placeholder="Describe what you are selling, delivery, terms, etc..."
          rows={4}
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          maxLength={2000}
        />
        <button
          className="mt-4 bg-aqua text-midnight px-7 py-2 rounded font-bold shadow hover:bg-cyan-400 transition"
          onClick={handleCreate}
          disabled={creating || !newTitle || !newPrice || !newDesc}
        >
          {creating ? "Posting..." : "Create Listing"}
        </button>
      </div>
      {/* --- Listings Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {listings.map(post => {
          const { desc, price } = parseListing(post);
          return (
            <div
              key={post.id}
              className="bg-[#1a2232]/80 border border-cyan-900/40 rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:shadow-[0_0_24px_#18f0ff44] transition group"
              style={{
                boxShadow: "0 4px 18px #18f0ff15, 0 1px 5px #13e0f544"
              }}
            >
              <div>
                <h3 className="font-bold text-xl text-aqua mb-2 truncate">{post.title}</h3>
                <div className="mb-3 text-cyan-200 min-h-[44px] line-clamp-2">{desc}</div>
                <div className="flex gap-2 items-center mb-3">
                  <span className="text-2xl font-extrabold text-aqua">${price}</span>
                  <span className="ml-2 text-cyan-400 text-xs">
                    by <Username animated={!!post.animatedColors && post.animatedColors.length === 2} colors={post.animatedColors}>
                      {post.username}
                    </Username>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  className="bg-aqua text-midnight px-4 py-2 rounded-full font-bold shadow hover:bg-cyan-400 transition w-full"
                  onClick={() => navigate(`/forum/marketplace/${post.id}`)}
                >
                  View / Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
