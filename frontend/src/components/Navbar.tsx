import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">SoloOJ</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-6">
              <Link
                to="/problems"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                题目
              </Link>
              <Link
                to="/problem-sets"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                题单
              </Link>
              <Link
                to="/contests"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                竞赛
              </Link>
              <Link
                to="/rankings"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                排名
              </Link>
              <Link
                to="/discussions"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                讨论
              </Link>
              {user && (
                <>
                  <Link
                    to="/submissions"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    提交
                  </Link>
                  <Link
                    to="/learning"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    学习路径
                  </Link>
                  <Link
                    to="/code/favorites"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    代码
                  </Link>
                </>
              )}
              {user?.isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className="text-purple-600 hover:text-purple-800 px-3 py-2 text-sm font-medium flex items-center gap-1"
                  >
                    管理
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/admin/problems"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        题目管理
                      </Link>
                      <Link
                        to="/admin/plagiarism"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        查重管理
                      </Link>
                      <Link
                        to="/admin/judge"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        评测机管理
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-blue-600 text-sm font-medium"
                  >
                    {user.nickname || user.username}
                  </Link>
                  <Link
                    to="/stats"
                    className="text-gray-500 hover:text-blue-600 text-xs"
                  >
                    📊 统计
                  </Link>
                  {user.isAdmin && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                      管理员
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  已解决: {user.solvedCount}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  退出
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
