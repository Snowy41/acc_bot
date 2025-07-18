import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Username from "./Username";
import MarketplacePostView from "./MarketplacePostView";

interface Comment {
  usertag: string;
  username: string;
  text: string;
  timestamp: number;
  role?: "admin" | "premium" | "user";
  animatedColors?: string[];
}
interface Post {
  id: string;
  usertag: string;
  username: string;
  title: string;
  content: string;
  comments: Comment[];
  timestamp: number;
  category: string;
  role?: "admin" | "premium" | "user";
  is_announcement?: boolean;
  animatedColors?: string[];
}

interface ForumPostViewProps {
  usertag: string;
  displayName: string;
}

export default function ForumPostView({ usertag, displayName }: ForumPostViewProps) {
  const { category, postId } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/forum/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data.post))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => setRole(data.role || "user"));
  }, []);

  const handleComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/forum/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: comment, usertag, username: displayName }),
    });
    setComment("");
    fetch(`/api/forum/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data.post));
  };

  const canDelete = post && (role === "admin" || post.usertag === usertag);

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/forum/posts/${postId}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (data.success) {
      navigate(`/forum/${category}`);
    } else {
      alert(data.error || "Delete failed");
    }
  };

  if (loading || !post) return <div className="text-white p-12">Loading post...</div>;
  const postColors =
    typeof post.animatedColors === "string"
      ? JSON.parse(post.animatedColors)
      : post.animatedColors || [];

  if (category === "marketplace") {
  return <MarketplacePostView usertag={usertag} displayName={displayName} />;
  }


  // ----------- Layout -----------
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 relative">
      <div className="relative z-10">
        <div className="flex items-center mb-8 gap-3">
          <Link to={`/forum/${category}`} className="text-cyan-300 hover:text-aqua text-base font-semibold">&larr; Back</Link>
          <span className="uppercase tracking-widest text-cyan-500 text-xs font-mono opacity-70">
            {category}
          </span>
        </div>
        {/* OP POST */}
        <section
          className={`w-full bg-[#19222f]/90 border rounded-2xl shadow-lg p-0 mb-10 ${
            post.is_announcement
              ? "border-yellow-400/50 bg-yellow-50/10"
              : "border-cyan-700/30"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 pt-6">
            <div className="flex items-center gap-3">
              <Username
                animated={postColors.length === 2}
                colors={postColors}
                className="text-lg font-bold"
              >
                {post.username}
              </Username>
              <span className="text-xs text-cyan-400 font-mono">@{post.usertag}</span>
              <span className="text-xs text-cyan-700 ml-2">{new Date(post.timestamp).toLocaleString()}</span>
              {post.is_announcement && (
                <span className="ml-3 px-2 py-1 bg-yellow-200/30 border border-yellow-300/50 text-yellow-800 rounded font-bold text-xs">
                  ANNOUNCEMENT
                </span>
              )}
              {post.role === "admin" && !post.is_announcement && (
                <span className="ml-3 px-2 py-1 bg-cyan-800/20 border border-cyan-300/30 text-cyan-100 rounded font-bold text-xs">
                  ADMIN
                </span>
              )}
              {canDelete && (
                <button
                  className="ml-6 px-3 py-1 bg-red-500 text-white font-bold text-xs rounded hover:bg-red-600"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <div className="px-6 pt-2 pb-4">
            <h1 className={`text-2xl md:text-3xl font-black mb-1 ${
              post.is_announcement ? "text-yellow-300" : "text-aqua"
            }`}>
              {post.title}
            </h1>
            <div className="bg-[#222d3c]/80 border border-cyan-900/10 rounded-lg p-5 text-base md:text-lg text-white leading-relaxed whitespace-pre-line mt-2">
              {post.content}
            </div>
          </div>
        </section>
        {/* Replies/comments */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-cyan-400 text-xl font-bold mb-3">Replies</h2>
          {post.comments.length === 0 && (
            <div className="text-gray-400 italic bg-[#18212e]/70 p-4 rounded-xl border border-cyan-900/10 text-center">
              No replies yet.
            </div>
          )}
          <div className="space-y-4">
            {post.comments.map((cmt, idx) => {
              let animatedColors: string[] = [];
              try {
                animatedColors =
                  typeof cmt.animatedColors === "string"
                    ? JSON.parse(cmt.animatedColors)
                    : Array.isArray(cmt.animatedColors)
                    ? cmt.animatedColors
                    : [];
              } catch (e) {
                animatedColors = [];
              }
              return (
                <div
                  key={idx}
                  className="flex gap-4 items-start bg-[#161d29]/80 border border-cyan-900/20 rounded-xl p-4 shadow-inner"
                >
                  {/* Side user panel like scene boards */}
                  <div className="flex flex-col items-center min-w-[82px]">
                    <Username
                      animated={animatedColors.length === 2}
                      colors={animatedColors}
                      className="font-semibold"
                    >
                      {cmt.username}
                    </Username>
                    <span className="text-xs text-cyan-500 font-mono break-all">@{cmt.usertag}</span>
                    <span className="text-[10px] text-cyan-900/60 font-mono mt-2">{new Date(cmt.timestamp).toLocaleString()}</span>
                    {cmt.role === "admin" && (
                      <span className="mt-2 px-2 py-0.5 bg-cyan-900/30 border border-cyan-300/20 text-cyan-100 rounded text-[10px] font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  {/* Comment body */}
                  <div className="flex-1 min-w-0 text-white text-base whitespace-pre-line">
                    {cmt.text}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add reply */}
          <div className="flex items-end gap-3 mt-8">
            <input
              className="flex-1 px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua text-base"
              placeholder="Write your reply..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
              maxLength={1000}
            />
            <button
              className="bg-aqua text-midnight px-6 py-2 rounded-lg font-bold text-base shadow hover:bg-cyan-400 transition"
              onClick={handleComment}
              disabled={!comment.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
