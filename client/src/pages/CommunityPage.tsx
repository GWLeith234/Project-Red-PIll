import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Star, Pin, Loader2, Users, BarChart3, CalendarDays, AlertCircle } from "lucide-react";
import PollWidget from "@/components/widgets/PollWidget";
import EventsWidget from "@/components/widgets/EventsWidget";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getVoterId(): string {
  let id = localStorage.getItem("community_voter_id");
  if (!id) {
    id = "anon_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("community_voter_id", id);
  }
  return id;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PollCard({ poll }: { poll: any }) {
  const queryClient = useQueryClient();
  const voterId = getVoterId();
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `poll_voted_${poll.id}`;
  const hasVoted = votedOptionId !== null || localStorage.getItem(storageKey) !== null;
  const savedVote = localStorage.getItem(storageKey);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setVotedOptionId(saved);
  }, [storageKey]);

  const options: { text: string; votes: number }[] = poll.options || [];
  const totalVotes = options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
  const isFeatured = poll.featured || poll.isFeatured;

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: String(optionIndex), voterIdentifier: voterId }),
      });
      if (res.ok) {
        const optId = String(optionIndex);
        setVotedOptionId(optId);
        localStorage.setItem(storageKey, optId);
        queryClient.invalidateQueries({ queryKey: ["/api/public/community-polls"] });
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`bg-background border rounded-xl p-6 ${isFeatured ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-border"}`}
      data-testid={`card-poll-${poll.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground pr-4" data-testid={`text-poll-question-${poll.id}`}>
          {poll.question}
        </h3>
        {isFeatured && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400 flex-shrink-0" data-testid={`badge-poll-featured-${poll.id}`}>
            <Star className="h-3 w-3 fill-amber-400" />
            Featured
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {options.map((option: any, idx: number) => {
          const pct = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
          const isSelected = savedVote === String(idx) || votedOptionId === String(idx);

          if (hasVoted) {
            return (
              <div key={idx} className="relative" data-testid={`poll-result-${poll.id}-${idx}`}>
                <div className="relative h-11 rounded-lg overflow-hidden bg-muted border border-border">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                      isSelected ? "bg-amber-500/30" : "bg-muted/50"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between h-full px-4">
                    <span className={`text-sm font-medium ${isSelected ? "text-amber-300" : "text-foreground/80"}`}>
                      {option.text}
                    </span>
                    <span className={`text-sm font-bold ${isSelected ? "text-amber-400" : "text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={submitting}
              className="w-full h-11 rounded-lg border border-border bg-muted text-foreground/80 text-sm font-medium hover:border-amber-500/50 hover:bg-muted hover:text-foreground transition-all disabled:opacity-50 px-4 text-left"
              data-testid={`poll-option-${poll.id}-${idx}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span data-testid={`text-poll-votes-${poll.id}`}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        {poll.createdAt && (
          <>
            <span>·</span>
            <span>{timeAgo(poll.createdAt)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function DiscussionPost({ post, depth = 0 }: { post: any; depth?: number }) {
  const queryClient = useQueryClient();
  const voterId = getVoterId();
  const [liked, setLiked] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyName, setReplyName] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likesCount || 0);

  const likeKey = `post_liked_${post.id}`;
  useEffect(() => {
    if (localStorage.getItem(likeKey)) setLiked(true);
  }, [likeKey]);

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch(`/api/public/community-posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likerIdentifier: voterId }),
      });
      if (res.ok) {
        setLiked(true);
        setLocalLikes((prev: number) => prev + 1);
        localStorage.setItem(likeKey, "1");
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleReply = async () => {
    if (!replyName.trim() || !replyContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: replyName.trim(),
          content: replyContent.trim(),
          parentId: post.id,
        }),
      });
      if (res.ok) {
        setReplyContent("");
        setShowReply(false);
        queryClient.invalidateQueries({ queryKey: ["/api/public/community-posts"] });
      }
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isPinned = post.pinned || post.isPinned;
  const replies: any[] = post.replies || [];

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""} data-testid={`card-post-${post.id}`}>
      <div className="bg-background border border-border rounded-xl p-5 mb-3">
        {isPinned && depth === 0 && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-3" data-testid={`badge-pinned-${post.id}`}>
            <Pin className="h-3.5 w-3.5 fill-amber-400" />
            Pinned Post
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {post.authorAvatar ? (
              <img
                src={post.authorAvatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                data-testid={`img-avatar-${post.id}`}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-purple-500/30 flex items-center justify-center ring-2 ring-border">
                <span className="text-xs font-bold text-foreground" data-testid={`text-initials-${post.id}`}>
                  {getInitials(post.authorName || "A")}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground" data-testid={`text-author-${post.id}`}>
                {post.authorName || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {post.createdAt ? timeAgo(post.createdAt) : ""}
              </span>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
              {post.content}
            </p>

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
                }`}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-red-400" : ""}`} />
                <span data-testid={`text-likes-${post.id}`}>{localLikes}</span>
              </button>
              {depth === 0 && (
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-400 transition-colors"
                  data-testid={`button-reply-${post.id}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>

        {showReply && (
          <div className="mt-4 ml-13 space-y-2" data-testid={`form-reply-${post.id}`}>
            <input
              type="text"
              placeholder="Your name"
              value={replyName}
              onChange={(e) => setReplyName(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50"
              data-testid={`input-reply-name-${post.id}`}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50"
                data-testid={`input-reply-content-${post.id}`}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
              />
              <button
                onClick={handleReply}
                disabled={submitting || !replyName.trim() || !replyContent.trim()}
                className="px-3 py-2 bg-amber-500 text-gray-950 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
                data-testid={`button-submit-reply-${post.id}`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div>
          {replies.map((reply: any) => (
            <DiscussionPost key={reply.id} post={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PollsTab() {
  const { data: polls = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/community-polls"],
    queryFn: async () => {
      const res = await fetch("/api/public/community-polls");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-background border border-border rounded-xl p-6 animate-pulse">
            <div className="h-5 bg-muted rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-11 bg-muted rounded-lg" />
              <div className="h-11 bg-muted rounded-lg" />
              <div className="h-11 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-20" data-testid="empty-polls">
        <BarChart3 className="h-16 w-16 text-foreground/80 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No polls yet</h3>
        <p className="text-muted-foreground">Community polls will appear here. Check back soon!</p>
      </div>
    );
  }

  const featured = polls.filter((p: any) => p.featured || p.isFeatured);
  const regular = polls.filter((p: any) => !p.featured && !p.isFeatured);

  return (
    <div className="space-y-4" data-testid="polls-list">
      {featured.map((poll: any) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
      {regular.map((poll: any) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}

const MAX_POST_LENGTH = 2000;

function DiscussionTab() {
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/community-posts"],
    queryFn: async () => {
      const res = await fetch("/api/public/community-posts");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleSubmit = async () => {
    if (!authorName.trim() || !content.trim() || submitting || content.length > MAX_POST_LENGTH) return;
    setSubmitting(true);
    setRateLimited(false);
    try {
      const body: any = { authorName: authorName.trim(), content: content.trim() };
      if (authorEmail.trim()) body.authorEmail = authorEmail.trim();
      const res = await fetch("/api/public/community-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["/api/public/community-posts"] });
      } else if (res.status === 429) {
        setRateLimited(true);
      }
    } catch (err) {
      console.error("Post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedPosts = posts.filter((p: any) => p.pinned || p.isPinned);
  const regularPosts = posts.filter((p: any) => !p.pinned && !p.isPinned);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-background border border-border rounded-xl p-5 animate-pulse">
          <div className="h-10 bg-muted rounded-lg mb-3" />
          <div className="h-20 bg-muted rounded-lg" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-background border border-border rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="discussion-tab">
      <div className="bg-background border border-border rounded-xl p-5 mb-6" data-testid="form-new-post">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Write a post</h4>
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 mb-3"
          data-testid="input-post-name"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 mb-3"
          data-testid="input-post-email"
        />
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_POST_LENGTH) setContent(e.target.value);
          }}
          rows={3}
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50 resize-none mb-1"
          data-testid="input-post-content"
        />
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs ${content.length >= MAX_POST_LENGTH ? "text-red-400" : "text-muted-foreground"}`} data-testid="text-char-count">
            {content.length}/{MAX_POST_LENGTH}
          </span>
          {rateLimited && (
            <span className="flex items-center gap-1 text-xs text-red-400" data-testid="text-rate-limit">
              <AlertCircle className="h-3 w-3" />
              Please wait before posting again
            </span>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !authorName.trim() || !content.trim() || content.length > MAX_POST_LENGTH}
            className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 text-gray-950 rounded-full text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
            data-testid="button-submit-post"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20" data-testid="empty-discussion">
          <MessageCircle className="h-16 w-16 text-foreground/80 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-1" data-testid="discussion-list">
          {pinnedPosts.map((post: any) => (
            <DiscussionPost key={post.id} post={post} />
          ))}
          {regularPosts.map((post: any) => (
            <DiscussionPost key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"polls" | "discussion">("polls");

  return (
    <div className="bg-background text-foreground min-h-screen" data-testid="community-page">
      <div className="relative py-16 px-4 text-center bg-gradient-to-b from-background to-background">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-4">
            <Users className="h-3.5 w-3.5" />
            COMMUNITY HUB
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" data-testid="text-community-title">Community</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-community-subtitle">
            Join the conversation, vote on polls, and connect with fellow members
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-background border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Upcoming Events</h3>
          </div>
          <EventsWidget limit={2} />
        </div>

        <div className="flex border-b border-border mb-8" data-testid="tab-switcher">
          <button
            onClick={() => setActiveTab("polls")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "polls"
                ? "text-amber-400 border-amber-400"
                : "text-muted-foreground border-transparent hover:text-foreground/80"
            }`}
            data-testid="tab-polls"
          >
            <BarChart3 className="h-4 w-4" />
            Polls
          </button>
          <button
            onClick={() => setActiveTab("discussion")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "discussion"
                ? "text-amber-400 border-amber-400"
                : "text-muted-foreground border-transparent hover:text-foreground/80"
            }`}
            data-testid="tab-discussion"
          >
            <MessageCircle className="h-4 w-4" />
            Discussion
          </button>
        </div>

        <div className="flex justify-center mb-2">
          <PollWidget />
        </div>

        <div className="mt-6">
          {activeTab === "polls" ? <PollsTab /> : <DiscussionTab />}
        </div>
      </div>
    </div>
  );
}
