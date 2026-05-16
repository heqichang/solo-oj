import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { codeApi } from '../../services/api';
import type { CodeFavorite } from '../../types';
import { useAuth } from '../../context/AuthContext';

const LANGUAGE_LABELS: Record<string, string> = {
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
};

const CodeFavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<CodeFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await codeApi.listFavorites({ page, limit: 10 });
      if (response.success && response.data) {
        setFavorites(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('确定要取消收藏吗？')) return;
    try {
      await codeApi.removeFavorite(id);
      loadFavorites();
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [page, user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        请先登录
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">代码收藏</h1>

        <div className="flex gap-4 mb-4">
          <Link
            to="/code/favorites"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            我的收藏
          </Link>
          <Link
            to="/code/notes"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            代码笔记
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">📚</div>
          <p>暂无收藏的代码</p>
          <p className="text-sm mt-2">通过题目后可以收藏优秀的代码</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {fav.submission?.problem && (
                      <div className="mb-2">
                        <Link
                          to={`/problems/${fav.submission.problem.slug}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {fav.submission.problem.title}
                        </Link>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {fav.submission?.language && (
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {LANGUAGE_LABELS[fav.submission.language]}
                        </span>
                      )}
                      {fav.submission?.runtimeMs !== null && fav.submission?.runtimeMs !== undefined && (
                        <span>运行时间: {fav.submission.runtimeMs} ms</span>
                      )}
                      {fav.submission?.memoryMB !== null && fav.submission?.memoryMB !== undefined && (
                        <span>内存: {fav.submission.memoryMB} MB</span>
                      )}
                      <span>
                        收藏于: {new Date(fav.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {fav.note && (
                      <p className="mt-3 text-gray-600 bg-gray-50 p-3 rounded text-sm">
                        {fav.note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/submissions/${fav.submissionId}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded"
                    >
                      查看代码
                    </Link>
                    <button
                      onClick={() => handleRemove(fav.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
                {fav.submission?.code && (
                  <div className="mt-4">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-48 overflow-y-auto">
                      <code>{fav.submission.code.slice(0, 500)}...</code>
                    </pre>
                  </div>
                )}
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
    </div>
  );
};

export default CodeFavoritesPage;
