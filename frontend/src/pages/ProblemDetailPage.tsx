import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemApi, submissionApi } from '../services/api';
import type { Problem, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import CodeEditor, { defaultTemplates } from '../components/CodeEditor';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_BG_COLORS,
  LANGUAGE_LABELS,
} from '../utils/judgeStatus';

const ProblemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(defaultTemplates.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProblem(slug);
    }
  }, [slug]);

  const loadProblem = async (slug: string) => {
    setLoading(true);
    try {
      const response = await problemApi.get(slug);
      if (response.success && response.data) {
        setProblem(response.data.problem);
      }
    } catch (error) {
      console.error('Failed to load problem:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCode(defaultTemplates[language] || '');
  }, [language]);

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!problem) return;

    setSubmitting(true);
    setSubmissionId(null);
    setSubmission(null);
    
    try {
      const response = await submissionApi.submit({
        problemId: problem.id,
        code,
        language,
      });
      
      if (response.success && response.data) {
        setSubmissionId(response.data.submission.id);
        setSubmission(response.data.submission);
        setPolling(true);
      }
    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.error || '提交失败');
    }
    
    setSubmitting(false);
  };

  useEffect(() => {
    if (!polling || !submissionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await submissionApi.get(submissionId);
        if (response.success && response.data) {
          setSubmission(response.data.submission);
          
          if (response.data.submission.status !== 'PENDING' && response.data.submission.status !== 'RUNNING') {
            setPolling(false);
          }
        }
      } catch (error) {
        console.error('Failed to poll submission:', error);
        setPolling(false);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [polling, submissionId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        题目不存在
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      ACCEPTED: 'text-green-600',
      WRONG_ANSWER: 'text-red-600',
      TIME_LIMIT_EXCEEDED: 'text-purple-600',
      MEMORY_LIMIT_EXCEEDED: 'text-yellow-600',
      RUNTIME_ERROR: 'text-red-600',
      COMPILATION_ERROR: 'text-orange-600',
      PENDING: 'text-gray-500',
      RUNNING: 'text-blue-500',
      SYSTEM_ERROR: 'text-gray-500',
    };
    return styles[status] || 'text-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${DIFFICULTY_BG_COLORS[problem.difficulty]} ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                {DIFFICULTY_LABELS[problem.difficulty]}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>时间限制: {problem.timeLimitMs}ms</span>
              <span>内存限制: {problem.memoryLimitMB}MB</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {problem.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">题目描述</h3>
              <div className="text-gray-700 whitespace-pre-wrap mb-6">
                {problem.description}
              </div>

              <h3 className="text-lg font-semibold mb-2">输入格式</h3>
              <div className="text-gray-700 whitespace-pre-wrap mb-6">
                {problem.inputFormat}
              </div>

              <h3 className="text-lg font-semibold mb-2">输出格式</h3>
              <div className="text-gray-700 whitespace-pre-wrap mb-6">
                {problem.outputFormat}
              </div>

              {problem.examples?.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">样例</h3>
                  {problem.examples.map((example, index) => (
                    <div key={index} className="mb-4">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">样例输入 {index + 1}:</span>
                        <pre className="bg-gray-100 p-3 rounded mt-1 overflow-x-auto text-sm">
                          {example.input}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">样例输出 {index + 1}:</span>
                        <pre className="bg-gray-100 p-3 rounded mt-1 overflow-x-auto text-sm">
                          {example.output}
                        </pre>
                      </div>
                      {example.explanation && (
                        <div className="mt-2 text-gray-600 text-sm">
                          说明: {example.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {problem.hints?.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mb-2">提示</h3>
                  <ul className="list-disc list-inside text-gray-700">
                    {problem.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">代码编辑</h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <CodeEditor
              language={language}
              code={code}
              onChange={setCode}
              height="400px"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || polling}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : polling ? '评测中...' : '提交代码'}
            </button>
          </div>

          {submission && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">评测结果</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">状态</span>
                  <span className={`font-medium ${getStatusStyle(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                {submission.runtimeMs !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">运行时间</span>
                    <span>{submission.runtimeMs}ms</span>
                  </div>
                )}
                {submission.memoryMB !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">内存使用</span>
                    <span>{submission.memoryMB}MB</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">通过测试用例</span>
                  <span>{submission.passedTestCases} / {submission.totalTestCases}</span>
                </div>
              </div>

              {submission.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">
                    {submission.errorMessage}
                  </pre>
                </div>
              )}

              {submission.testResults?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">测试用例详情</h4>
                  {submission.testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">测试用例 {result.testCase}</span>
                        <span className={`text-sm font-medium ${getStatusStyle(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                      {result.status !== 'ACCEPTED' && result.status !== 'PENDING' && result.status !== 'RUNNING' && (
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-gray-500">输入:</span>
                            <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                              {result.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-gray-500">期望输出:</span>
                            <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                              {result.expectedOutput}
                            </pre>
                          </div>
                          <div>
                            <span className="text-gray-500">实际输出:</span>
                            <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                              {result.actualOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
