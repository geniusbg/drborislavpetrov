'use client'

import React from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Service as ServiceType } from '@/types/global'
import Pagination from '@/components/admin/Pagination'

interface ServicesTabProps {
  services: ServiceType[]
  filteredServices: ServiceType[]
  paginatedServices: ServiceType[]
  serviceSearchTerm: string
  currentServicesPage: number
  totalServicesPages: number
  servicesStartIndex: number
  servicesEndIndex: number
  servicesPerPage: number
  onServiceSearchChange: (term: string) => void
  onServicePageChange: (page: number) => void
  onServicesPerPageChange: (perPage: number) => void
  onAddService: () => void
  onEditService: (service: ServiceType) => void
  onDeleteService: (id: number) => void
}

export default function ServicesTab({
  services,
  filteredServices,
  paginatedServices,
  serviceSearchTerm,
  currentServicesPage,
  totalServicesPages,
  servicesStartIndex,
  servicesEndIndex,
  servicesPerPage,
  onServiceSearchChange,
  onServicePageChange,
  onServicesPerPageChange,
  onAddService,
  onEditService,
  onDeleteService
}: ServicesTabProps) {
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900">Услуги</h2>
          <p className="text-sm text-gray-600 mt-1">
            {serviceSearchTerm ? `${filteredServices.length} от ${services.length} услуги` : `${services.length} услуги`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Търси по име или описание..."
              value={serviceSearchTerm}
              onChange={(e) => onServiceSearchChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {serviceSearchTerm && (
              <button
                onClick={() => onServiceSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Add Service Button */}
          <button
            onClick={onAddService}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добави услуга</span>
          </button>
        </div>
      </div>
      
      {/* Mobile: Card Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {paginatedServices.map((service) => (
            <div key={service.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {service.duration} мин
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditService(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактирай"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteService(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Изтрий"
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
                Услуга
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Описание
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Продължителност
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                  {service.name}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {service.description || '-'}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {service.duration} мин
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditService(service)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Редактирай"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteService(service.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Изтрий"
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
      
      {/* Pagination Controls for Services */}
      <Pagination
        currentPage={currentServicesPage}
        totalPages={totalServicesPages}
        totalItems={filteredServices.length}
        startIndex={servicesStartIndex}
        endIndex={servicesEndIndex}
        itemsPerPage={servicesPerPage}
        onPageChange={onServicePageChange}
        onItemsPerPageChange={onServicesPerPageChange}
        label="услуги"
      />
    </div>
  )
}
