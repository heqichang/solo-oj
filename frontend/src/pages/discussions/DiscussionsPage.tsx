import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { discussionApi } from '../../services/api';
import type { DiscussionPost } from '../../types';
import { useAuth } from '../../context/AuthContext';

const DiscussionsPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'NEWEST' | 'HOTTEST'>('NEWEST');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10, sort };
      if (search) params.search = search;

      const response = await discussionApi.list(params);
      if (response.success && response.data) {
        setPosts(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load discussions:', error);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await discussionApi.create({
        title: newTitle,
        content: newContent,
      });
      if (response.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        loadPosts();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
    setSubmitting(false);
  };

  const handleLike = async (postId: string) => {
    try {
      await discussionApi.like(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
                isLiked: !p.isLiked,
              }
            : p
        )
      );
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page, sort, search]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">讨论区</h1>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              发布帖子
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <form
              onSubmit={(e) => { e.preventDefault(); setPage(1); loadPosts(); }}
              className="flex gap-2 flex-1"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索帖子..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 max-w-xl"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                搜索
              </button>
            </form>

            <div className="flex gap-2">
              <button
                onClick={() => { setSort('NEWEST'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sort === 'NEWEST'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                最新
              </button>
              <button
                onClick={() => { setSort('HOTTEST'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sort === 'HOTTEST'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                最热
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无帖子</div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            置顶
                          </span>
                        )}
                        <h2 className="text-lg font-semibold">
                          <Link
                            to={`/discussions/${post.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {post.title}
                          </Link>
                        </h2>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {post.user?.avatar ? (
                            <img
                              src={post.user.avatar}
                              alt={post.user.nickname || post.user.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-semibold">
                                {(post.user?.nickname || post.user?.username || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-gray-700">
                            {post.user?.nickname || post.user?.username}
                          </span>
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1 ${
                            post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <span>{post.isLiked ? '❤️' : '🤍'}</span>
                          <span>{post.likeCount}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.replyCount}</span>
                        </span>
                        {post.problem && (
                          <Link
                            to={`/problems/${post.problem.slug}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            题目: {post.problem.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="text-gray-600">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">发布新帖子</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标题
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入帖子标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请输入帖子内容，支持 Markdown"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newTitle.trim() || !newContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '发布中...' : '发布'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionsPage;
