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
  is_announcement?: boolean; // NEW
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
  const [isAnnouncement, setIsAnnouncement] = useState(false); // NEW
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
        is_announcement: role === "admin" ? isAnnouncement : false, // NEW
      }),
    });
    setNewTitle("");
    setNewContent("");
    setIsAnnouncement(false);
    fetch(`/api/forum/posts?category=${category}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  };

  // NEW: Use is_announcement
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
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[24vh] bg-gradient-to-tr from-aqua/30 to-cyan-500/15 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[36vw] h-[22vh] bg-gradient-to-tl from-cyan-400/30 to-fuchsia-500/10 blur-2xl rounded-full" />
      </div>
      <div className="relative z-10">
        <div className="bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl py-8 px-4 md:px-10 mb-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-4xl font-extrabold text-aqua mb-0 capitalize tracking-wide drop-shadow">{category}</h2>
              <Link to="/forum" className="text-cyan-300 hover:text-aqua mt-1 block text-base">&larr; All Categories</Link>
            </div>
            <button onClick={() => navigate("/forum")} className="hidden md:inline text-cyan-400 hover:text-aqua text-lg font-medium">&larr; Back</button>
          </div>
          {/* --- Sticky/Announcements --- */}
          {stickyPosts.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-300 text-xl">📢</span>
                <span className="text-cyan-200 text-lg font-bold tracking-wide">Official Announcements</span>
              </div>
              <div className="space-y-4">
                {stickyPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    category={category!}
                    sticky
                    currentUserTag={usertag}
                    role={role}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
          {/* --- All Other Posts --- */}
          <div className="mt-2">
            <div className="text-cyan-400 text-lg font-bold mb-4">Threads</div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-white text-center">Loading posts...</div>
              ) : (
                regularPosts.length === 0 ? (
                  <div className="text-cyan-300 text-lg my-8 text-center">No posts in this category yet.</div>
                ) : (
                  regularPosts.map(post => (
                    <PostCard
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
        {/* --- Post Form --- */}
        <div className="w-full md:max-w-lg mx-auto bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl mt-12 mb-10">
          <h3 className="text-xl font-bold mb-4 text-aqua flex items-center gap-2">
            Create a new post
          </h3>
          {category?.toLowerCase().includes("announc") && role !== "admin" ? (
            <div className="text-red-300 bg-[#232e43]/80 border border-red-400/20 px-4 py-6 rounded-lg text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              Only <span className="text-yellow-200 mx-1">admins</span> can post announcements.
            </div>
          ) : (
            <div className="space-y-4">
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
                    Mark as announcement (sticky)
                  </label>
                </div>
              )}
              <div>
                <label className="block text-cyan-300 mb-1 font-medium">Title</label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                  placeholder="Thread title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-cyan-300 mb-1 font-medium">Your post</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                  placeholder="What's on your mind?"
                  rows={7}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  maxLength={3000}
                />
              </div>
              <button
                className="bg-aqua text-midnight px-6 py-2 rounded-lg font-bold text-lg shadow hover:bg-cyan-400 transition w-full"
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

// --- Reusable Card for Each Post (summary) ---
function PostCard({
  post,
  category,
  sticky = false,
  currentUserTag,
  role,
  onDelete,
}: {
  post: Post;
  category: string;
  sticky?: boolean;
  currentUserTag: string;
  role: string;
  onDelete: (postId: string) => void;
}) {
  const animatedColors =
    typeof post.animatedColors === "string"
      ? JSON.parse(post.animatedColors)
      : post.animatedColors || [];

  const canDelete = role === "admin" || post.usertag === currentUserTag;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(post.id);
  };

  return (
    <Link
      to={`/forum/${category}/${post.id}`}
      className={`block rounded-xl border transition
        ${post.is_announcement
          ? "bg-gradient-to-br from-yellow-300/10 to-aqua/5 border-yellow-400/40 shadow-lg"
          : "bg-gradient-to-tr from-[#223348]/80 to-cyan-800/40 border-cyan-900/20 hover:border-aqua hover:shadow-aqua/40"
        }
        hover:scale-[1.03] relative`}
      style={{
        boxShadow: post.is_announcement
          ? "0 0 32px #ffe06622, 0 4px 24px #12fff1cc"
          : "0 0 18px #36f1cd33, 0 2px 12px #14d4ff44"
      }}
    >
      <div className={`flex items-center justify-between px-7 pt-5 pb-3 rounded-t-xl ${post.is_announcement ? "bg-yellow-100/5" : "bg-[#162030]"}`}>
        <span className={`font-bold text-xl md:text-2xl ${post.is_announcement ? "text-yellow-200" : "text-aqua"} drop-shadow`}>{post.title}</span>
        <span className={`text-xs ${post.is_announcement ? "text-yellow-500" : "text-cyan-600"}`}>{new Date(post.timestamp).toLocaleString()}</span>
        {canDelete && (
          <button
            className="ml-4 px-3 py-1 rounded bg-red-500 text-white font-bold text-xs shadow hover:bg-red-600 z-10"
            onClick={handleDelete}
            title="Delete post"
          >
            Delete
          </button>
        )}
      </div>
      <div className={`flex items-center gap-3 px-7 pb-2 pt-1 ${post.is_announcement ? "text-yellow-400" : "text-cyan-300"} text-xs`}>
        <span>
          by{" "}
          <Username
            animated={animatedColors.length === 2}
            colors={animatedColors}
          >
            {post.username}
          </Username>
        </span>
        <span className="font-mono">@{post.usertag}</span>
        {post.is_announcement && <span className="ml-3 px-2 py-1 bg-yellow-400/30 rounded font-bold text-yellow-700 text-xs">Announcement</span>}
      </div>
      <div className={`bg-[#232e43]/90 text-white text-base px-7 py-5 rounded-b-xl border border-cyan-900/10 mx-4 my-2 whitespace-pre-line shadow-inner`}>
        {post.content ? (
          post.content.length > 180
            ? post.content.slice(0, 180) + "..."
            : post.content
        ) : (
          <span className="italic text-gray-400">No content</span>
        )}
      </div>
    </Link>
  );
}
