import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemApi } from '../services/api';
import type { Problem, Tag } from '../types';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, DIFFICULTY_BG_COLORS } from '../utils/judgeStatus';

const ProblemsPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (difficulty) params.difficulty = difficulty;
      if (tag) params.tag = tag;
      if (search) params.search = search;

      const response = await problemApi.list(params);
      if (response.success && response.data) {
        setProblems(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    }
    setLoading(false);
  };

  const loadTags = async () => {
    try {
      const response = await problemApi.listTags();
      if (response.success && response.data) {
        setTags(response.data.tags);
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    loadProblems();
  }, [page, difficulty, tag, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProblems();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">题目列表</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索题目..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                搜索
              </button>
            </form>

            <select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有难度</option>
              <option value="EASY">简单</option>
              <option value="MEDIUM">中等</option>
              <option value="HARD">困难</option>
            </select>

            <select
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有标签</option>
              {tags.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>

            {(difficulty || tag || search) && (
              <button
                onClick={() => { setDifficulty(''); setTag(''); setSearch(''); setPage(1); }}
                className="text-blue-600 hover:text-blue-700"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : problems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无题目</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    难度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标签
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通过率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400">-</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/problems/${problem.slug}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${DIFFICULTY_BG_COLORS[problem.difficulty]} ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                        {DIFFICULTY_LABELS[problem.difficulty]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {problem.tags?.length > 3 && (
                          <span className="text-xs text-gray-400">+{problem.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {problem.acceptanceRate ?? 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default ProblemsPage;
