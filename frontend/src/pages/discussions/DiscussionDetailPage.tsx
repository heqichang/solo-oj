import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { discussionApi } from '../../services/api';
import type { DiscussionPost, DiscussionReply } from '../../types';
import { useAuth } from '../../context/AuthContext';

const DiscussionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [replyTotalPages, setReplyTotalPages] = useState(1);

  const loadPost = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await discussionApi.get(id);
      if (response.success && response.data) {
        setPost(response.data.post);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    }
    setLoading(false);
  };

  const loadReplies = async () => {
    if (!id) return;
    try {
      const response = await discussionApi.listReplies(id, { page: replyPage, limit: 20 });
      if (response.success && response.data) {
        setReplies(response.data);
        setReplyTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const handleLikePost = async () => {
    if (!post || !user) return;
    try {
      await discussionApi.like(post.id);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
              isLiked: !prev.isLiked,
            }
          : null
      );
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!user || !id) return;
    try {
      await discussionApi.likeReply(id, replyId);
      setReplies((prev) =>
        prev.map((r) =>
          r.id === replyId
            ? {
                ...r,
                likeCount: r.isLiked ? r.likeCount - 1 : r.likeCount + 1,
                isLiked: !r.isLiked,
              }
            : r
        )
      );
    } catch (error) {
      console.error('Failed to like reply:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !id || !user) return;

    setSubmitting(true);
    try {
      const response = await discussionApi.createReply(id, { content: newReply });
      if (response.success) {
        setNewReply('');
        loadReplies();
        if (post) {
          setPost({ ...post, replyCount: post.replyCount + 1 });
        }
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
    setSubmitting(false);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('确定要删除这条回复吗？') || !id) return;
    try {
      await discussionApi.deleteReply(id, replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      if (post) {
        setPost({ ...post, replyCount: post.replyCount - 1 });
      }
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('确定要删除这篇帖子吗？') || !post) return;
    try {
      await discussionApi.delete(post.id);
      window.location.href = '/discussions';
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  useEffect(() => {
    loadPost();
  }, [id]);

  useEffect(() => {
    loadReplies();
  }, [id, replyPage]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        帖子不存在
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/discussions" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← 返回讨论区
      </Link>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {post.isPinned && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                  置顶
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                {post.user?.avatar ? (
                  <img
                    src={post.user.avatar}
                    alt={post.user.nickname || post.user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {(post.user?.nickname || post.user?.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium text-gray-700">
                  {post.user?.nickname || post.user?.username}
                </span>
              </div>
              <span>{formatDate(post.createdAt)}</span>
              {post.updatedAt !== post.createdAt && (
                <span>(更新于 {formatDate(post.updatedAt)})</span>
              )}
            </div>
            <div className="prose max-w-none">
              <div className="text-gray-700 whitespace-pre-wrap">{post.content}</div>
            </div>
            {post.problem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">相关题目：</span>
                <Link
                  to={`/problems/${post.problem.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                >
                  {post.problem.title}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t">
          <button
            onClick={handleLikePost}
            disabled={!user}
            className={`flex items-center gap-2 ${
              post.isLiked
                ? 'text-red-500'
                : 'text-gray-500 hover:text-red-500 disabled:opacity-50'
            }`}
          >
            <span className="text-xl">{post.isLiked ? '❤️' : '🤍'}</span>
            <span>{post.likeCount}</span>
          </button>
          <span className="text-gray-500 flex items-center gap-2">
            <span>💬</span>
            <span>{post.replyCount} 条回复</span>
          </span>
          {user?.isAdmin && (
            <button
              onClick={handleDeletePost}
              className="text-red-600 hover:text-red-800 text-sm ml-auto"
            >
              删除帖子
            </button>
          )}
        </div>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">发表回复</h3>
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
              placeholder="写下你的回复..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newReply.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '发布中...' : '发布回复'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          回复 ({post.replyCount})
        </h3>
        {replies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            暂无回复，快来发表第一条回复吧！
          </div>
        ) : (
          <>
            {replies.map((reply) => (
              <div key={reply.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {reply.user?.avatar ? (
                        <img
                          src={reply.user.avatar}
                          alt={reply.user.nickname || reply.user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(reply.user?.nickname || reply.user?.username || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {reply.user?.nickname || reply.user?.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap ml-11">
                      {reply.content}
                    </div>
                    <div className="flex items-center gap-4 ml-11 mt-2">
                      <button
                        onClick={() => handleLikeReply(reply.id)}
                        disabled={!user}
                        className={`text-sm ${
                          reply.isLiked
                            ? 'text-red-500'
                            : 'text-gray-500 hover:text-red-500 disabled:opacity-50'
                        }`}
                      >
                        {reply.isLiked ? '❤️' : '🤍'} {reply.likeCount}
                      </button>
                      {(user?.isAdmin || user?.id === reply.userId) && (
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {replyTotalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setReplyPage((p) => Math.max(1, p - 1))}
                  disabled={replyPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-gray-600">
                  第 {replyPage} / {replyTotalPages} 页
                </span>
                <button
                  onClick={() => setReplyPage((p) => Math.min(replyTotalPages, p + 1))}
                  disabled={replyPage === replyTotalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetailPage;
