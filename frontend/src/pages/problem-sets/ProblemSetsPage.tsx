import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemSetApi } from '../../services/api';
import type { ProblemSet, ProblemSetCategory, ProblemSetDifficulty } from '../../types';

const categoryLabels: Record<ProblemSetCategory, string> = {
  BEGINNER: '入门',
  INTERMEDIATE: '进阶',
  ADVANCED: '高级',
  SPECIAL_TOPIC: '专题',
  INTERVIEW_PREP: '面试',
  CONTEST: '竞赛',
};

const difficultyColors: Record<ProblemSetDifficulty, string> = {
  EASY: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-red-100 text-red-800',
  MIXED: 'bg-purple-100 text-purple-800',
};

const difficultyLabels: Record<ProblemSetDifficulty, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
  MIXED: '混合',
};

const ProblemSetsPage: React.FC = () => {
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ProblemSetCategory | ''>('');
  const [difficulty, setDifficulty] = useState<ProblemSetDifficulty | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProblemSets = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (search) params.search = search;

      const response = await problemSetApi.list(params);
      if (response.success && response.data) {
        setProblemSets(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch problem sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemSets();
  }, [page, category, difficulty, search]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">题目集</h1>
        <p className="text-gray-600">精选优质题目集，帮助你系统提升编程能力</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索题目集..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProblemSetCategory | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部分类</option>
            <option value="BEGINNER">入门</option>
            <option value="INTERMEDIATE">进阶</option>
            <option value="ADVANCED">高级</option>
            <option value="SPECIAL_TOPIC">专题</option>
            <option value="INTERVIEW_PREP">面试</option>
            <option value="CONTEST">竞赛</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as ProblemSetDifficulty | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部难度</option>
            <option value="EASY">简单</option>
            <option value="MEDIUM">中等</option>
            <option value="HARD">困难</option>
            <option value="MIXED">混合</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problemSets.map((set) => (
              <Link
                key={set.id}
                to={`/problem-sets/${set.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {set.coverImage && (
                  <img
                    src={set.coverImage}
                    alt={set.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${difficultyColors[set.difficulty]} mb-2`}>
                        {difficultyLabels[set.difficulty]}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{set.title}</h3>
                    </div>
                    {set.isFeatured && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        精选
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{set.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>{set.problemCount} 道题</span>
                      <span>{set.totalEnrolled} 人学习</span>
                    </div>
                    {set.averageRating > 0 && renderStars(set.averageRating)}
                  </div>
                  {set.progress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>学习进度</span>
                        <span>{Math.round(set.progress.progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${set.progress.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {set.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}

          {problemSets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无符合条件的题目集
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProblemSetsPage;
