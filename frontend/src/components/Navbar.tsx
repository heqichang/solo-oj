import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
                    to="/code/favorites"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    代码
                  </Link>
                </>
              )}
              {user?.isAdmin && (
                <Link
                  to="/admin/problems"
                  className="text-purple-600 hover:text-purple-800 px-3 py-2 text-sm font-medium"
                >
                  管理
                </Link>
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
