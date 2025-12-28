'use client'

import React from 'react'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import type { User as UserType } from '@/types/global'
import Pagination from '@/components/admin/Pagination'

interface UsersTabProps {
  users: UserType[]
  filteredUsers: UserType[]
  paginatedUsers: UserType[]
  userSearchTerm: string
  currentUsersPage: number
  totalUsersPages: number
  usersStartIndex: number
  usersEndIndex: number
  usersPerPage: number
  onUserSearchChange: (term: string) => void
  onUserPageChange: (page: number) => void
  onUsersPerPageChange: (perPage: number) => void
  onAddUser: () => void
  onEditUser: (user: UserType) => void
  onDeleteUser: (id: number) => void
  onViewUserHistory: (userId: number) => void
}

export default function UsersTab({
  users,
  filteredUsers,
  paginatedUsers,
  userSearchTerm,
  currentUsersPage,
  totalUsersPages,
  usersStartIndex,
  usersEndIndex,
  usersPerPage,
  onUserSearchChange,
  onUserPageChange,
  onUsersPerPageChange,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onViewUserHistory
}: UsersTabProps) {
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900">Потребители</h2>
          <p className="text-sm text-gray-600 mt-1">
            {userSearchTerm ? `${filteredUsers.length} от ${users.length} потребители` : `${users.length} потребители`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Търси по име, телефон или имейл..."
              value={userSearchTerm}
              onChange={(e) => onUserSearchChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {userSearchTerm && (
              <button
                onClick={() => onUserSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Add User Button */}
          <button
            onClick={onAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добави потребител</span>
          </button>
        </div>
      </div>
      
      {/* Mobile: Card Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  {user.phone && (
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  )}
                  {user.email && (
                    <p className="text-sm text-gray-600">{user.email}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => user.id !== undefined && onViewUserHistory(user.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="История на резервациите"
                    disabled={user.id === undefined}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditUser(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактирай"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => user.id !== undefined && onDeleteUser(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Изтрий"
                    disabled={user.id === undefined}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop: Table Layout */}
      <div className="hidden sm:block">
        <table className="w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Име
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Имейл
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {user.phone}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => user.id !== undefined && onViewUserHistory(user.id)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="История на резервациите"
                      disabled={user.id === undefined}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Редактирай"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => user.id !== undefined && onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Изтрий"
                      disabled={user.id === undefined}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls for Users */}
      <Pagination
        currentPage={currentUsersPage}
        totalPages={totalUsersPages}
        totalItems={filteredUsers.length}
        startIndex={usersStartIndex}
        endIndex={usersEndIndex}
        itemsPerPage={usersPerPage}
        onPageChange={onUserPageChange}
        onItemsPerPageChange={onUsersPerPageChange}
        label="потребители"
      />
    </div>
  )
}
