import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Username from "./Username";

interface Post {
  id: string;
  usertag: string;
  username: string;
  title: string;
  content: string;
  comments: any[];
  timestamp: number;
  role?: "admin" | "premium" | "user";
  category: string;
  is_announcement?: boolean;
  animatedColors?: string[];
}

interface ForumCategoryViewProps {
  usertag: string;
  displayName: string;
}

export default function ForumCategoryView({ usertag, displayName }: ForumCategoryViewProps) {
  const { category } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/forum/posts?category=${category}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    fetch("/api/auth/status", { credentials: "include" })
      .then(res => res.json())
      .then(data => setRole(data.role || "user"));
  }, []);

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        category,
        usertag,
        username: displayName,
        role,
        is_announcement: role === "admin" ? isAnnouncement : false,
      }),
    });
    setNewTitle("");
    setNewContent("");
    setIsAnnouncement(false);
    fetch(`/api/forum/posts?category=${category}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  };

  const stickyPosts = posts.filter(p => p.is_announcement);
  const regularPosts = posts.filter(p => !p.is_announcement);

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/forum/posts/${postId}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (data.success) {
      setPosts(posts => posts.filter(p => p.id !== postId));
    } else {
      alert(data.error || "Delete failed");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 relative">
      <div className="relative z-10">
        <div
          className="border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl py-6 px-2 md:px-8 mb-10"
          style={{
            background: "rgba(24, 33, 46, 0.50)" // 0.50 = 50% transparent; change to 0.30 for 30%, etc.
          }}
        >
          <div className="flex items-center justify-between mb-6 border-b border-cyan-900/20 pb-2">
            <div>
              <h2 className="text-3xl font-extrabold text-aqua mb-0 capitalize tracking-wide">{category}</h2>
              <Link to="/forum" className="text-cyan-300 hover:text-aqua mt-1 block text-base">&larr; All Categories</Link>
            </div>
            <button onClick={() => navigate("/forum")} className="hidden md:inline text-cyan-400 hover:text-aqua text-lg font-medium">&larr; Back</button>
          </div>
          {/* Sticky/announcements */}
          {stickyPosts.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-300 text-xl">📢</span>
                <span className="text-cyan-200 text-base font-bold tracking-wide">Sticky/Announcements</span>
              </div>
              <div className="space-y-2">
                {stickyPosts.map(post => (
                  <ThreadRow
                    key={post.id}
                    post={post}
                    category={category!}
                    isSticky
                    currentUserTag={usertag}
                    role={role}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
          {/* All other threads */}
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2 text-base">Threads</div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-white text-center">Loading posts...</div>
              ) : (
                regularPosts.length === 0 ? (
                  <div className="text-cyan-300 text-base my-8 text-center">No threads in this category yet.</div>
                ) : (
                  regularPosts.map(post => (
                    <ThreadRow
                      key={post.id}
                      post={post}
                      category={category!}
                      currentUserTag={usertag}
                      role={role}
                      onDelete={handleDelete}
                    />
                  ))
                )
              )}
            </div>
          </div>
        </div>
        {/* Post form */}
        <div className="w-full md:max-w-lg mx-auto bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl mt-12 mb-10">
          <h3 className="text-lg font-bold mb-4 text-aqua flex items-center gap-2">
            Create a new post
          </h3>
          {category?.toLowerCase().includes("announc") && role !== "admin" ? (
            <div className="text-red-300 bg-[#232e43]/80 border border-red-400/20 px-4 py-6 rounded-lg text-base font-semibold flex items-center gap-2">
              <span className="text-xl">🔒</span>
              Only <span className="text-yellow-200 mx-1">admins</span> can post announcements.
            </div>
          ) : (
            <div className="space-y-3">
              {role === "admin" && (
                <div className="flex items-center gap-3 mb-1">
                  <input
                    type="checkbox"
                    id="isAnnouncement"
                    checked={isAnnouncement}
                    onChange={e => setIsAnnouncement(e.target.checked)}
                    className="accent-aqua w-5 h-5"
                  />
                  <label htmlFor="isAnnouncement" className="text-cyan-300 font-medium select-none cursor-pointer">
                    Mark as announcement
                  </label>
                </div>
              )}
              <div>
                <label className="block text-cyan-300 mb-1 font-medium">Title</label>
                <input
                  className="w-full px-4 py-2 rounded bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                  placeholder="Thread title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-cyan-300 mb-1 font-medium">Your post</label>
                <textarea
                  className="w-full px-4 py-2 rounded bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                  placeholder="What's on your mind?"
                  rows={6}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  maxLength={3000}
                />
              </div>
              <button
                className="bg-aqua text-midnight px-5 py-2 rounded-lg font-bold text-base shadow hover:bg-cyan-400 transition w-full"
                onClick={handlePost}
                disabled={!newTitle.trim() || !newContent.trim()}
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Thread Row like scene boards ---
function ThreadRow({
  post,
  category,
  isSticky,
  currentUserTag,
  role,
  onDelete,
}: {
  post: any;
  category: string;
  isSticky?: boolean;
  currentUserTag: string;
  role: string;
  onDelete: (postId: string) => void;
}) {
  const animatedColors =
    typeof post.animatedColors === "string"
      ? JSON.parse(post.animatedColors)
      : post.animatedColors || [];
  const canDelete = role === "admin" || post.usertag === currentUserTag;

  return (
    <Link
      to={`/forum/${category}/${post.id}`}
      className={`flex items-center border rounded-xl bg-[#1a2232]/60 px-3 md:px-6 py-4 gap-5 transition group
        ${isSticky ? "border-yellow-300/50" : "border-cyan-900/40"}
        hover:border-aqua hover:bg-cyan-900/40 hover:scale-[1.01] cursor-pointer relative`}
      style={{ textDecoration: "none" }}
    >
      {/* Left meta */}
      <div className="flex flex-col items-center min-w-[70px] select-none">
        <Username
          animated={animatedColors.length === 2}
          colors={animatedColors}
          className="font-bold"
        >
          {post.username}
        </Username>
        <span className="text-xs text-cyan-400 font-mono break-all">@{post.usertag}</span>
        <span className="text-[11px] text-cyan-700 font-mono">{new Date(post.timestamp).toLocaleString()}</span>
        {isSticky && (
          <span className="mt-2 px-2 py-0.5 bg-yellow-200/30 border border-yellow-200/60 text-yellow-800 rounded text-[10px] font-bold">ANNOUNCE</span>
        )}
        {post.role === "admin" && !isSticky && (
          <span className="mt-2 px-2 py-0.5 bg-cyan-900/30 border border-cyan-300/20 text-cyan-100 rounded text-[10px] font-bold">
            ADMIN
          </span>
        )}
      </div>
      {/* Thread info */}
      <div className="flex-1 min-w-0">
        <div className="block font-bold text-lg md:text-xl text-cyan-100 group-hover:text-aqua transition truncate">
          {post.title}
        </div>
        <div className="text-cyan-200/80 text-sm line-clamp-2 whitespace-pre-line mt-1">
          {post.content.length > 128 ? post.content.slice(0, 128) + "..." : post.content}
        </div>
      </div>
      <div className="flex flex-col items-end ml-2 gap-2">
        <span className="text-xs text-cyan-400 font-mono">{post.comments.length} replies</span>
        {canDelete && (
          <button
            className="px-2 py-1 bg-red-500 text-white text-xs rounded font-bold shadow hover:bg-red-600 absolute top-2 right-3 z-20"
            onClick={e => { e.preventDefault(); onDelete(post.id); }}
            title="Delete thread"
          >
            Delete
          </button>
        )}
      </div>
    </Link>
  );
}