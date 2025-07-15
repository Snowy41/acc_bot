import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  usertag: string;
  username: string;
  title: string;
  content: string;
  comments: any[];
  timestamp: number;
  category: string;
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

  useEffect(() => {
    fetch(`/api/forum/posts?category=${category}`)
      .then(res => res.json())
      .then(data => setPosts(data.posts || []));
  }, [category]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: newTitle, content: newContent, category, usertag, username: displayName }),
    });
    setNewTitle(""); setNewContent("");
    fetch(`/api/forum/posts?category=${category}`).then(res => res.json()).then(data => setPosts(data.posts || []));
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 relative">
      {/* BG shapes, blurred gradient glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[24vh] bg-gradient-to-tr from-aqua/30 to-cyan-500/15 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[36vw] h-[22vh] bg-gradient-to-tl from-cyan-400/30 to-fuchsia-500/10 blur-2xl rounded-full" />
      </div>
      <div className="relative z-10">
        {/* SECTION CARD */}
        <div className="bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl p-0 pb-14 pt-6">
          <h2 className="text-3xl font-extrabold text-aqua mb-4 px-8 capitalize tracking-wide drop-shadow">Posts in {category}</h2>
          <Link to="/forum" className="text-cyan-300 hover:text-aqua mb-6 block px-8">&larr; All Categories</Link>
          <div className="flex flex-col md:flex-row gap-12 items-start w-full px-4 md:px-12">
            {/* POST LIST INSIDE BIG GLASS BOX */}
            <div className="flex-1 min-w-[380px]">
              <div className="bg-[#1b2435]/95 border border-cyan-900/40 rounded-2xl shadow-2xl p-7">
                <h3 className="text-xl font-bold text-aqua mb-6">All Posts</h3>
                <div className="space-y-8">
                  {posts.map(post => (
                    <Link
                      key={post.id}
                      to={`/forum/${category}/${post.id}`}
                      className="block bg-gradient-to-tr from-[#223348]/80 to-cyan-800/40 rounded-2xl shadow-lg border-2 border-cyan-900/20 hover:border-aqua hover:shadow-aqua/40 hover:scale-[1.03] transition-all duration-150"
                      style={{ boxShadow: "0 0 18px #36f1cd33, 0 2px 12px #14d4ff44" }}
                    >
                      {/* Title + meta */}
                      <div className="flex items-center justify-between px-7 pt-6 pb-3 rounded-t-2xl bg-[#162030] border-b border-cyan-900/20">
                        <span className="font-bold text-2xl text-aqua drop-shadow">{post.title}</span>
                        <span className="text-xs text-cyan-600">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-3 px-7 pb-2 pt-1 text-cyan-300 text-xs">
                        <span>by <span className="text-white font-bold">{post.username}</span></span>
                        <span className="font-mono">@{post.usertag}</span>
                      </div>
                      <div className="bg-[#232e43]/90 text-white text-base px-7 py-6 rounded-b-2xl border border-cyan-900/10 mx-4 my-3 whitespace-pre-line shadow-inner">
                        {post.content ? (post.content.length > 300 ? post.content.slice(0, 300) + "..." : post.content) : <span className="italic text-gray-400">No content</span>}
                      </div>
                    </Link>
                  ))}
                  {posts.length === 0 && (
                    <div className="text-cyan-300 text-lg my-8 text-center">No posts in this category yet.</div>
                  )}
                </div>
              </div>
            </div>
            {/* CREATE NEW POST BOX */}
            <div className="w-full md:w-[400px] bg-[#18212e]/90 border border-cyan-900/40 rounded-2xl p-8 shadow-2xl sticky top-28">
              <h3 className="text-xl font-bold mb-4 text-aqua">Create a new post</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-cyan-300 mb-1 font-medium">Title</label>
                  <input
                    className="w-full px-4 py-3 rounded-lg bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                    placeholder="Title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
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
                  />
                </div>
                <button
                  className="bg-aqua text-midnight px-6 py-2 rounded-lg font-bold text-lg shadow hover:bg-cyan-400 transition w-full"
                  onClick={handlePost}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
