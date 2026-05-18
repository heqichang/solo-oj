import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { problemSetApi, hintApi } from '../../services/api';
import type { ProblemSet, ProblemSetProblem, ProblemSetProgress } from '../../types';
import { useAuth } from '../../context/AuthContext';

const difficultyColors: Record<string, string> = {
  EASY: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-red-100 text-red-800',
};

const difficultyLabels: Record<string, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
};

const ProblemSetDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null);
  const [problems, setProblems] = useState<ProblemSetProblem[]>([]);
  const [progress, setProgress] = useState<ProblemSetProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchProblemSet = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const response = await problemSetApi.getBySlug(slug);
        if (response.success && response.data) {
          setProblemSet(response.data);
          setProblems(response.data.problems || []);
          setProgress(response.data.progress || null);
        }
      } catch (error) {
        console.error('Failed to fetch problem set:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemSet();
  }, [slug]);

  const handleEnroll = async () => {
    if (!problemSet || !user) return;
    setEnrolling(true);
    try {
      const response = await problemSetApi.enroll(problemSet.id);
      if (response.success && response.data) {
        setProgress(response.data);
      }
    } catch (error) {
      console.error('Failed to enroll:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleRate = async () => {
    if (!problemSet || !user) return;
    try {
      await problemSetApi.rate(problemSet.id, { rating, comment });
      setShowRatingModal(false);
      setComment('');
    } catch (error) {
      console.error('Failed to rate:', error);
    }
  };

  const getProblemStatus = (problemId: string) => {
    if (!progress?.problemStatuses) return null;
    return progress.problemStatuses[problemId];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!problemSet) {
    return (
      <div className="text-center py-12 text-gray-500">
        题目集不存在
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {problemSet.coverImage && (
          <img
            src={problemSet.coverImage}
            alt={problemSet.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{problemSet.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {problemSet.category}
                </span>
                <span className="text-gray-500">
                  {problemSet.problemCount} 道题 · {problemSet.totalEnrolled} 人学习
                </span>
                {problemSet.averageRating > 0 && (
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= problemSet.averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      {problemSet.averageRating.toFixed(1)} ({problemSet.ratingCount} 评价)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {!progress ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling || !user}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? '加入中...' : '开始学习'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    评价
                  </button>
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    继续学习
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-gray-600 mb-4">{problemSet.description}</p>

          {progress && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">学习进度</span>
                <span className="text-blue-600 font-semibold">
                  {progress.solvedProblems} / {progress.totalProblems} 题 ({Math.round(progress.progressPercentage)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress.progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>已获得 {progress.earnedPoints} / {progress.totalPoints} 分</span>
                {progress.completedAt && (
                  <span>完成于 {new Date(progress.completedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {problemSet.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">题目列表</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {problems.map((item, index) => {
            const status = getProblemStatus(item.problemId);
            return (
              <Link
                key={item.id}
                to={`/problems/${item.problem?.slug}`}
                className="flex items-center p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-mono mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.problem?.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${difficultyColors[item.problem?.difficulty || 'EASY']}`}>
                      {difficultyLabels[item.problem?.difficulty || 'EASY']}
                    </span>
                    {status === 'SOLVED' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                        已通过
                      </span>
                    )}
                    {status === 'ATTEMPTED' && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        尝试过
                      </span>
                    )}
                  </div>
                  {item.section && (
                    <p className="text-sm text-gray-500 mt-1">{item.section}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-600">{item.points} 分</span>
                  {item.problem?.tags?.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">评价题目集</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl hover:scale-110 transition-transform"
                  >
                    <svg
                      className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">评论（可选）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="分享你的学习体验..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRate}
                disabled={rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交评价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSetDetailPage;
