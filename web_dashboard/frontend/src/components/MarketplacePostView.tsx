import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Username from "./Username";

export default function MarketplacePostView({ usertag, displayName }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/forum/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data.post));
  }, [postId]);

  if (!post) return <div>Loading...</div>;

  // Parse content
  let desc = "", price = "";
  try {
    const obj = JSON.parse(post.content);
    desc = obj.desc || "";
    price = obj.price || "";
  } catch {
    desc = post.content;
    price = "";
  }

  // Comments/replies logic
  // (copy your existing replies/comments UI, just style as Q&A/offers if you want)

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-[#19222f]/90 border border-cyan-700/40 rounded-2xl p-8 shadow-xl mb-10">
        <h1 className="text-3xl font-bold text-aqua mb-2">{post.title}</h1>
        <div className="text-xl text-cyan-200 font-mono mb-4">
          <span className="font-bold text-aqua">${price}</span>
        </div>
        <div className="text-white mb-6">{desc}</div>
        <div className="flex gap-2 items-center mb-4">
          <span className="text-cyan-400">Seller:</span>
          <Username animated={!!post.animatedColors && post.animatedColors.length === 2} colors={post.animatedColors}>
            {post.username}
          </Username>
        </div>
        <button
          className="bg-aqua text-midnight px-7 py-2 rounded-full font-bold shadow hover:bg-cyan-400 transition"
          // onClick={} // For now, maybe open DM with seller or support ticket
        >
          Contact Seller
        </button>
      </div>
      {/* Comments/Replies Section */}
      {/* Copy your forum reply code here */}
    </div>
  );
}
