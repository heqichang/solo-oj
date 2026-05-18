import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hintApi, problemSetApi } from '../../services/api';
import type { UserWeakTag, LearningPathRecommendation, ProblemSet } from '../../types';

const levelColors: Record<string, string> = {
  STRONG: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-blue-100 text-blue-800 border-blue-200',
  WEAK: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  VERY_WEAK: 'bg-red-100 text-red-800 border-red-200',
};

const levelLabels: Record<string, string> = {
  STRONG: '掌握良好',
  MODERATE: '基本掌握',
  WEAK: '需要加强',
  VERY_WEAK: '薄弱环节',
};

const LearningPathPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<LearningPathRecommendation | null>(null);
  const [weakTags, setWeakTags] = useState<UserWeakTag[]>([]);
  const [recommendedSets, setRecommendedSets] = useState<ProblemSet[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'weakness' | 'sets'>('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recResponse, tagsResponse, setsResponse] = await Promise.all([
        hintApi.getLearningPath(),
        hintApi.getMyWeakTags(20),
        problemSetApi.getRecommended(10),
      ]);

      if (recResponse.success && recResponse.data) {
        setRecommendation(recResponse.data);
      }
      if (tagsResponse.success && tagsResponse.data) {
        setWeakTags(tagsResponse.data);
      }
      if (setsResponse.success && setsResponse.data) {
        setRecommendedSets(setsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch learning path data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">学习路径</h1>
        <p className="text-gray-600">基于你的提交记录，智能分析薄弱点，推荐最适合你的学习内容</p>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab('weakness')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'weakness'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            薄弱点分析
          </button>
          <button
            onClick={() => setActiveTab('sets')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'sets'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            推荐题目集
          </button>
        </div>
      </div>

      {activeTab === 'overview' && recommendation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">能力概览</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">强知识点</span>
                  <span className="font-semibold text-green-600">
                    {recommendation.strongAreas.length} 个
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">待加强知识点</span>
                  <span className="font-semibold text-yellow-600">
                    {recommendation.weakAreas.filter(w => w.level === 'WEAK').length} 个
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">薄弱知识点</span>
                  <span className="font-semibold text-red-600">
                    {recommendation.weakAreas.filter(w => w.level === 'VERY_WEAK').length} 个
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐等级</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {recommendation.recommendedLevel === 'BEGINNER' ? '入门' :
                   recommendation.recommendedLevel === 'INTERMEDIATE' ? '进阶' : '高级'}
                </div>
                <p className="text-gray-500">当前最适合你的难度级别</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐学习主题</h3>
              <div className="space-y-2">
                {recommendation.nextTopics.slice(0, 4).map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{topic.tagName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">优先学习</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendation.nextTopics.slice(0, 3).map((topic, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{topic.tagName}</h4>
                  <div className="space-y-2">
                    {topic.recommendations.slice(0, 3).map((problem, pIndex) => (
                      <Link
                        key={pIndex}
                        to={`/problems/${problem.slug}`}
                        className="block px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{problem.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            problem.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                            problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {problem.difficulty === 'EASY' ? '简单' :
                             problem.difficulty === 'MEDIUM' ? '中等' : '困难'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {recommendedSets.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐题目集</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedSets.slice(0, 3).map((set) => (
                  <Link
                    key={set.id}
                    to={`/problem-sets/${set.slug}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{set.title}</h4>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{set.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{set.problemCount} 道题</span>
                      <span className="text-blue-600">开始学习 →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'weakness' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">知识点掌握情况</h2>
            <p className="text-gray-500 mt-1">基于你的提交记录自动分析</p>
          </div>
          <div className="divide-y divide-gray-200">
            {weakTags.map((tag, index) => (
              <div key={tag.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">{tag.tagName}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${levelColors[tag.level]}`}>
                        {levelLabels[tag.level]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      共提交 {tag.totalAttempts} 次，正确 {tag.correctAttempts} 次
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(tag.accuracy * 100)}%
                    </div>
                    <p className="text-sm text-gray-500">正确率</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      tag.level === 'STRONG' ? 'bg-green-500' :
                      tag.level === 'MODERATE' ? 'bg-blue-500' :
                      tag.level === 'WEAK' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${tag.accuracy * 100}%` }}
                  ></div>
                </div>
                {tag.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">推荐练习：</p>
                    <div className="flex flex-wrap gap-2">
                      {tag.recommendations.map((problem, pIndex) => (
                        <Link
                          key={pIndex}
                          to={`/problems/${problem.slug}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {problem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {weakTags.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              暂无足够的提交记录进行分析，多做几道题试试吧！
            </div>
          )}
        </div>
      )}

      {activeTab === 'sets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedSets.map((set) => (
            <Link
              key={set.id}
              to={`/problem-sets/${set.slug}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              {set.coverImage && (
                <img
                  src={set.coverImage}
                  alt={set.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{set.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{set.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{set.problemCount} 道题</span>
                  <span>{set.totalEnrolled} 人学习</span>
                </div>
                {set.averageRating > 0 && (
                  <div className="flex items-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= set.averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">{set.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPathPage;
