import { useParams, Link } from "react-router-dom";
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

  useEffect(() => {
    fetch(`/api/forum/posts/${postId}`)
      .then(res => res.json())
      .then(data => setPost(data.post));
  }, [postId]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/forum/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text: comment, usertag, username: displayName }),
    });
    setComment("");
    fetch(`/api/forum/posts/${postId}`).then(res => res.json()).then(data => setPost(data.post));
  };

  if (!post) return <div className="text-white">Loading...</div>;
  const postColors =
    typeof post.animatedColors === "string"
      ? JSON.parse(post.animatedColors)
      : post.animatedColors || [];

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 relative">
      {/* BG shapes, blurred gradient glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[70vw] h-[18vh] bg-gradient-to-tr from-aqua/30 to-cyan-500/15 blur-3xl rounded-full" />
      </div>
      <div className="relative z-10">
        <Link to={`/forum/${category}`} className="text-cyan-300 hover:text-aqua mb-6 block">&larr; Back to {category}</Link>
        <div className="bg-white/10 border border-cyan-700/40 shadow-[0_6px_36px_0_rgba(0,255,255,0.09)] backdrop-blur-xl rounded-3xl pb-6 pt-8 px-0">
          {/* POST SECTION */}
          <div className="mx-auto max-w-2xl mb-8">
            <div className="bg-gradient-to-br from-aqua/30 to-cyan-800/40 p-7 rounded-2xl border border-cyan-700/20 shadow-lg">
              <h2 className="font-black text-3xl text-aqua mb-2 drop-shadow tracking-tight">{post.title}</h2>
              <div className="flex items-center gap-2 text-cyan-200 text-sm mb-3">
                <span>by <Username
                            animated={postColors.length === 2}
                            colors={postColors}
                          >
                            {post.username}
                          </Username>

                     <span className="font-mono">@{post.usertag}</span>
                </span>
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
            <div className="text-cyan-400 mb-4 text-lg font-bold ml-1">Comments</div>
            <div className="space-y-4 mb-6">
              {post.comments.length === 0 && (
                <div className="text-gray-400 italic bg-[#18212e]/70 p-3 rounded-xl border border-cyan-900/10">
                  No comments yet.
                </div>
              )}
              {post.comments.map((cmt, idx) => {
                const animatedColors =
                  typeof cmt.animatedColors === "string"
                    ? JSON.parse(cmt.animatedColors)
                    : cmt.animatedColors || [];

                return (
                  <div
                    key={idx}
                    className="bg-[#212b38] border border-cyan-900/10 rounded-xl p-4 shadow flex flex-col"
                    style={{ boxShadow: "0 0 12px #36f1cd11" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyan-400">@{cmt.usertag}</span>
                      <Username
                        animated={animatedColors.length === 2}
                        colors={animatedColors}
                      >
                        {cmt.username}
                      </Username>
                      <span className="ml-auto text-xs text-cyan-700">
                        {new Date(cmt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-white text-base whitespace-pre-wrap">
                      {cmt.text}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Comment input */}
            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 px-4 py-2 rounded-xl bg-[#232e43] text-white border border-cyan-800 focus:outline-none focus:ring-2 focus:ring-aqua"
                placeholder="Write a comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
              />
              <button className="bg-aqua text-midnight px-6 rounded-xl font-bold text-base shadow hover:bg-cyan-400 transition" onClick={handleComment}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
