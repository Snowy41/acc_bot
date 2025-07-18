import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Username from "./Username";

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
  is_announcement?: boolean; // NEW
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

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 relative">
      <div className="relative z-10">
        <Link to={`/forum/${category}`} className="text-cyan-300 hover:text-aqua mb-6 block">&larr; Back to {category}</Link>
        {canDelete && (
          <div className="flex justify-end mb-2">
            <button
              className="bg-red-500 text-white rounded px-4 py-2 text-sm font-bold shadow hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete Post
            </button>
          </div>
        )}
        <div className="bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl pb-6 pt-8 px-0">
          {/* POST SECTION */}
          <div className="mx-auto max-w-2xl mb-8">
            <div className={`bg-gradient-to-br from-aqua/30 to-cyan-800/40 p-7 rounded-2xl border border-cyan-700/20 shadow-lg ${post.is_announcement ? "border-yellow-400/60" : ""}`}>
              <div className="flex items-center mb-2 gap-2">
                <h2 className="font-black text-3xl text-aqua drop-shadow tracking-tight flex-1">{post.title}</h2>
                {post.is_announcement && (
                  <span className="text-yellow-300 bg-yellow-100/10 border border-yellow-400/30 px-3 py-1 rounded text-xs font-bold">Announcement</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-cyan-200 text-sm mb-3">
                <span>by <Username animated={postColors.length === 2} colors={postColors}>{post.username}</Username></span>
                <span className="font-mono text-cyan-400">@{post.usertag}</span>
                <span className="mx-2">&bull;</span>
                <span>{new Date(post.timestamp).toLocaleString()}</span>
              </div>
              <div className="bg-[#232e43] rounded-lg p-6 text-lg text-white border border-cyan-800 shadow-inner mb-2 whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          </div>
          {/* COMMENTS SECTION */}
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-cyan-400 text-lg font-bold ml-1">Replies</span>
              <span className="text-cyan-900/40 text-lg">|</span>
              <span className="text-cyan-300 text-sm font-mono">{post.comments.length} comment{post.comments.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-4 mb-6">
              {post.comments.length === 0 && (
                <div className="text-gray-400 italic bg-[#18212e]/70 p-3 rounded-xl border border-cyan-900/10">No comments yet.</div>
              )}
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
                    className="bg-[#212b38] border border-cyan-900/10 rounded-xl p-4 shadow flex flex-col"
                    style={{ boxShadow: "0 0 12px #36f1cd11" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyan-400">@{cmt.usertag}</span>
                      <Username animated={animatedColors.length === 2} colors={animatedColors}>{cmt.username}</Username>
                      <span className="ml-auto text-xs text-cyan-700">{new Date(cmt.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-white text-base whitespace-pre-wrap">{cmt.text}</div>
                  </div>
                );
              })}
            </div>
            {/* Comment input */}
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 px-4 py-2 rounded-xl bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                placeholder="Write a reply..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
                maxLength={1000}
              />
              <button className="bg-aqua text-midnight px-6 rounded-xl font-bold text-base shadow hover:bg-cyan-400 transition" onClick={handleComment} disabled={!comment.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
