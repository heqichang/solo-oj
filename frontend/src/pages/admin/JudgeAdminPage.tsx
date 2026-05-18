import React, { useState, useEffect } from 'react';
import { judgeAdminApi } from '../../services/api';
import type { JudgeNode, JudgeNodeStatus, JudgeQueueStatus } from '../../types';

const statusColors: Record<JudgeNodeStatus, string> = {
  ONLINE: 'bg-green-100 text-green-800',
  OFFLINE: 'bg-gray-100 text-gray-800',
  BUSY: 'bg-yellow-100 text-yellow-800',
  MAINTENANCE: 'bg-blue-100 text-blue-800',
  ERROR: 'bg-red-100 text-red-800',
};

const statusLabels: Record<JudgeNodeStatus, string> = {
  ONLINE: '在线',
  OFFLINE: '离线',
  BUSY: '繁忙',
  MAINTENANCE: '维护中',
  ERROR: '错误',
};

const JudgeAdminPage: React.FC = () => {
  const [nodes, setNodes] = useState<JudgeNode[]>([]);
  const [queueStatus, setQueueStatus] = useState<JudgeQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNode, setNewNode] = useState({
    name: '',
    endpoint: '',
    token: '',
    type: 'STANDARD' as const,
    maxConcurrentJobs: 10,
    priority: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nodesResponse, queueResponse] = await Promise.all([
        judgeAdminApi.listJudgeNodes(),
        judgeAdminApi.getQueueStatus(),
      ]);

      if (nodesResponse.success && nodesResponse.data) {
        setNodes(nodesResponse.data);
      }
      if (queueResponse.success && queueResponse.data) {
        setQueueStatus(queueResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddNode = async () => {
    try {
      await judgeAdminApi.registerJudgeNode(newNode);
      setShowAddModal(false);
      setNewNode({
        name: '',
        endpoint: '',
        token: '',
        type: 'STANDARD',
        maxConcurrentJobs: 10,
        priority: 10,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add node:', error);
    }
  };

  const handleToggleNode = async (node: JudgeNode) => {
    try {
      await judgeAdminApi.updateJudgeNode(node.id, { isEnabled: !node.isEnabled });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle node:', error);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('确定要删除这个评测机节点吗？')) return;
    try {
      await judgeAdminApi.deleteJudgeNode(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleQueueAction = async (action: 'pause' | 'resume' | 'empty') => {
    if (action === 'empty' && !confirm('确定要清空队列吗？这将删除所有待处理的评测任务。')) return;
    try {
      if (action === 'pause') {
        await judgeAdminApi.pauseQueue();
      } else if (action === 'resume') {
        await judgeAdminApi.resumeQueue();
      } else {
        await judgeAdminApi.emptyQueue();
      }
      fetchData();
    } catch (error) {
      console.error(`Failed to ${action} queue:`, error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">评测机管理</h1>
          <p className="text-gray-600 mt-1">管理评测节点和任务队列</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 添加评测机
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">等待中</div>
          <div className="text-3xl font-bold text-yellow-600">{queueStatus?.waiting || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">执行中</div>
          <div className="text-3xl font-bold text-blue-600">{queueStatus?.active || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">已完成</div>
          <div className="text-3xl font-bold text-green-600">{queueStatus?.completed || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">失败</div>
          <div className="text-3xl font-bold text-red-600">{queueStatus?.failed || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">队列操作</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleQueueAction('pause')}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
          >
            暂停队列
          </button>
          <button
            onClick={() => handleQueueAction('resume')}
            className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
          >
            恢复队列
          </button>
          <button
            onClick={() => handleQueueAction('empty')}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
          >
            清空队列
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">评测节点</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {nodes.map((node) => (
              <div key={node.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[node.status]}`}>
                        {statusLabels[node.status]}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {node.type === 'STANDARD' ? '标准评测' :
                         node.type === 'SPECIAL' ? 'Special Judge' :
                         node.type === 'INTERACTIVE' ? '交互式' : '通用'}
                      </span>
                      {!node.isEnabled && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-600">
                          已禁用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{node.endpoint}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">当前任务</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {node.currentJobs} / {node.maxConcurrentJobs}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">总处理数</div>
                        <div className="text-lg font-semibold text-gray-900">{node.totalJobsProcessed}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">错误数</div>
                        <div className="text-lg font-semibold text-red-600">{node.totalErrors}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">CPU 使用率</div>
                        <div className="text-lg font-semibold text-gray-900">{node.cpuUsage.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">内存使用率</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {node.memoryTotal > 0 ? ((node.memoryUsage / node.memoryTotal) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">优先级</div>
                        <div className="text-lg font-semibold text-gray-900">{node.priority}</div>
                      </div>
                    </div>

                    {node.lastHeartbeat && (
                      <div className="mt-2 text-xs text-gray-400">
                        最后心跳: {new Date(node.lastHeartbeat).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleNode(node)}
                      className={`px-3 py-1.5 text-sm rounded ${
                        node.isEnabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {node.isEnabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {nodes.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            暂无评测节点
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">添加评测机</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={newNode.name}
                  onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="评测机名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">端点地址</label>
                <input
                  type="text"
                  value={newNode.endpoint}
                  onChange={(e) => setNewNode({ ...newNode, endpoint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="http://localhost:3001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token（可选）</label>
                <input
                  type="text"
                  value={newNode.token}
                  onChange={(e) => setNewNode({ ...newNode, token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="认证 Token"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={newNode.type}
                    onChange={(e) => setNewNode({ ...newNode, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="STANDARD">标准评测</option>
                    <option value="SPECIAL">Special Judge</option>
                    <option value="INTERACTIVE">交互式</option>
                    <option value="UNIVERSAL">通用</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <input
                    type="number"
                    value={newNode.priority}
                    onChange={(e) => setNewNode({ ...newNode, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大并发任务数</label>
                <input
                  type="number"
                  value={newNode.maxConcurrentJobs}
                  onChange={(e) => setNewNode({ ...newNode, maxConcurrentJobs: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddNode}
                disabled={!newNode.name || !newNode.endpoint}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeAdminPage;
