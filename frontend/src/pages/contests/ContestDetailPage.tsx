import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contestApi } from '../../services/api';
import type { Contest } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CONTEST_RULE_LABELS: Record<string, string> = {
  ACM: 'ACM',
  OI: 'OI',
  IOI: 'IOI',
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ContestDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadContest = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await contestApi.get(slug);
      if (response.success && response.data) {
        setContest(response.data.contest);
        const registered = response.data.contest.participants?.some(
          (p: any) => p.userId === user?.id
        );
        setIsRegistered(!!registered);
      }
    } catch (error) {
      console.error('Failed to load contest:', error);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!contest) return;
    setRegistering(true);
    try {
      const response = await contestApi.register(contest.id);
      if (response.success) {
        setIsRegistered(true);
        setMessage({ type: 'success', text: '报名成功！' });
        loadContest();
      } else {
        setMessage({ type: 'error', text: response.error || '报名失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '报名失败' });
    }
    setRegistering(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getContestStatus = () => {
    if (!contest) return 'UPCOMING';
    const now = new Date().getTime();
    const start = new Date(contest.startTime).getTime();
    const end = new Date(contest.endTime).getTime();
    if (now < start) return 'UPCOMING';
    if (now >= start && now < end) return 'RUNNING';
    return 'ENDED';
  };

  useEffect(() => {
    loadContest();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        竞赛不存在
      </div>
    );
  }

  const status = getContestStatus();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                {CONTEST_RULE_LABELS[contest.ruleType]}
              </span>
              {status === 'RUNNING' && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 animate-pulse">
                  进行中
                </span>
              )}
              {contest.isFrozen && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                  封榜中
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{contest.description}</p>
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div>开始: {formatDate(contest.startTime)}</div>
              <div>结束: {formatDate(contest.endTime)}</div>
              <div>参赛: {contest.participantCount} 人</div>
              <div>题目: {contest.problems?.length || 0} 道</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {status === 'UPCOMING' && !isRegistered && (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {registering ? '报名中...' : '报名参加'}
              </button>
            )}
            {status === 'UPCOMING' && isRegistered && (
              <div className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                已报名
              </div>
            )}
            {status === 'RUNNING' && isRegistered && (
              <Link
                to={`/contests/${contest.slug}/problems/${contest.problems?.[0]?.index || 'A'}`}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
              >
                开始答题
              </Link>
            )}
            <Link
              to={`/contests/${contest.slug}/leaderboard`}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
            >
              排行榜
            </Link>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {status === 'RUNNING' && isRegistered && contest.problems && contest.problems.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">题目列表</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {contest.problems.map((cp) => (
                <Link
                  key={cp.id}
                  to={`/contests/${contest.slug}/problems/${cp.index}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-center"
                >
                  <div className="text-xl font-bold text-blue-600">{cp.index}</div>
                  <div className="text-sm text-gray-600 mt-1 truncate">
                    {cp.problem?.title || '加载中...'}
                  </div>
                  {contest.ruleType === 'OI' && (
                    <div className="text-xs text-gray-400 mt-1">{cp.score} 分</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {status === 'ENDED' && contest.problems && contest.problems.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">题目列表</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {contest.problems.map((cp) => (
                <Link
                  key={cp.id}
                  to={`/contests/${contest.slug}/problems/${cp.index}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-center"
                >
                  <div className="text-xl font-bold text-blue-600">{cp.index}</div>
                  <div className="text-sm text-gray-600 mt-1 truncate">
                    {cp.problem?.title || '加载中...'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {status === 'UPCOMING' && (
          <div className="border-t pt-6">
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-lg text-gray-500">比赛尚未开始，请耐心等待</div>
              <div className="text-sm text-gray-400 mt-2">
                比赛开始后可在此处查看题目
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestDetailPage;
