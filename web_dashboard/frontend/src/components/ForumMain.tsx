import { useEffect, useState } from "react";

interface Comment {
  usertag: string;
  username: string;
  text: string;
  timestamp: number;
}
interface Post {
  id: string;
  usertag: string;
  username: string;
  title: string;
  content: string;
  comments: Comment[];
  timestamp: number;
}

export default function Forum({ usertag, displayName }: { usertag: string, displayName: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all posts
  useEffect(() => {
    fetch("/api/forum/posts")
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .finally(() => setLoading(false));
  }, []);

  // Add a new post
  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await fetch("/api/forum/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: newTitle, content: newContent, usertag, username: displayName }),
    });
    setNewTitle(""); setNewContent("");
    // Refetch posts
    fetch("/api/forum/posts").then(res => res.json()).then(data => setPosts(data.posts || []));
  };

  // Add a comment to a post
  const handleComment = async (postId: string, comment: string) => {
    if (!comment.trim()) return;
    await fetch(`/api/forum/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: comment, usertag, username: displayName }),
    });
    fetch("/api/forum/posts").then(res => res.json()).then(data => setPosts(data.posts || []));
  };

  if (loading) return <div className="text-white">Loading forum...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-3xl text-aqua font-extrabold mb-8">Forum</h2>
      {/* New Post */}
      <div className="bg-[#19222f] border border-cyan-900/40 rounded-xl p-6 mb-10 shadow-lg">
        <h3 className="text-xl font-bold mb-2">Create a new post</h3>
        <input
          className="w-full p-2 mb-2 rounded bg-[#232e43] text-white border border-cyan-800"
          placeholder="Title"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 mb-2 rounded bg-[#232e43] text-white border border-cyan-800"
          placeholder="Your post..."
          rows={4}
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
        />
        <button className="bg-aqua text-midnight px-4 py-2 rounded font-bold mt-2" onClick={handlePost}>
          Post
        </button>
      </div>
      {/* All Posts */}
      <div className="space-y-8">
        {posts.map(post => (
          <div key={post.id} className="bg-[#232e43] border border-cyan-900/30 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-lg text-aqua">{post.title}</span>
              <span className="ml-2 text-xs text-cyan-400">@{post.usertag}</span>
              <span className="ml-auto text-xs text-cyan-600">{new Date(post.timestamp).toLocaleString()}</span>
            </div>
            <div className="text-white mb-3">{post.content}</div>
            <div className="mb-2 text-xs text-cyan-200">by {post.username}</div>
            {/* Comments */}
            <div className="ml-4">
              <div className="text-sm text-cyan-400 mb-1">Comments:</div>
              <div className="space-y-2">
                {post.comments.map((cmt, idx) => (
                  <div key={idx} className="text-cyan-100 bg-[#213146] px-2 py-1 rounded">
                    <span className="font-mono text-xs text-cyan-400">@{cmt.usertag}</span>: {cmt.text}
                  </div>
                ))}
              </div>
              <ForumCommentBox postId={post.id} onComment={handleComment} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForumCommentBox({ postId, onComment }: { postId: string, onComment: (postId: string, comment: string) => void }) {
  const [comment, setComment] = useState("");
  return (
    <div className="flex mt-2 gap-2">
      <input
        className="flex-1 px-2 py-1 rounded bg-[#232e43] text-white border border-cyan-800"
        placeholder="Comment..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { onComment(postId, comment); setComment(""); } }}
      />
      <button className="bg-cyan-700 px-2 rounded text-white font-bold" onClick={() => { onComment(postId, comment); setComment(""); }}>
        Send
      </button>
    </div>
  );
}
