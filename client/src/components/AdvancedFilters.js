"use client";

import { useState } from "react";
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const AdvancedFilters = ({
  onFiltersChange,
  services,
  serviceTypes,
  locations,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    service: [],
    serviceType: [],
    distanceRange: [],
    searchTerm: "",
    sortBy: [],
    sortOrder: [],
  });

  const toggleFilter = (key, value) => {
    let updated = Array.isArray(filters[key]) ? [...filters[key]] : [];

    if (updated.includes(value)) {
      updated = updated.filter((v) => v !== value); // remove
    } else {
      updated.push(value); // add
    }

    const newFilters = { ...filters, [key]: updated };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key, value) => {
    let updated = [];

    if (value) {
      updated = filters[key].filter((v) => v !== value);
    }

    const newFilters = {
      ...filters,
      [key]: value ? updated : [],
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAll = () => {
    const reset = {
      service: [],
      serviceType: [],
      distanceRange: [],
      searchTerm: "",
      sortBy: [],
      sortOrder: [],
    };
    setFilters(reset);
    onFiltersChange(reset);
  };

  // 🔑 helpers to resolve names
  const getServiceName = (id) => services.find((s) => s._id === id)?.name || id;
  const getServiceTypeName = (id) =>
    serviceTypes.find((t) => t._id === id)?.name || id;

  return (
    <div>
      {/* Filter toggle button */}
      <button
        className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg shadow hover:bg-gray-200"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={18} />
        <span>Filters</span>
      </button>

      {/* Active filters chips */}
      <div className="space-y-4 mt-4">
        {/* Section Header */}
        {(filters.service.length > 0 ||
          filters.serviceType.length > 0 ||
          filters.distanceRange.length > 0 ||
          filters.sortBy.length > 0 ||
          filters.sortOrder.length > 0) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                Active Filters
              </span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                {Object.values(filters).flat().length} active
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>
        )}

        {/* Filter Sections */}
        <div className="space-y-3">
          {/* Service Section */}
          {filters.service.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Service
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.service.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <span>{getServiceName(id)}</span>
                    <button
                      onClick={() => clearFilter("service", id)}
                      className="p-0.5 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <X size={12} className="text-blue-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Type Section */}
          {filters.serviceType.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Service Type
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.serviceType.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-lg text-sm border border-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    <span>{getServiceTypeName(id)}</span>
                    <button
                      onClick={() => clearFilter("serviceType", id)}
                      className="p-0.5 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      <X size={12} className="text-purple-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distance Range Section */}
          {filters.distanceRange.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Distance Range
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.distanceRange.map((range) => (
                  <div
                    key={range}
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <span>{range}</span>
                    <button
                      onClick={() => clearFilter("distanceRange", range)}
                      className="p-0.5 rounded-full hover:bg-green-200 transition-colors"
                    >
                      <X size={12} className="text-green-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sort By Section */}
          {filters.sortBy.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Sort By
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.sortBy.map((sort) => (
                  <div
                    key={sort}
                    className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    <span>{sort}</span>
                    <button
                      onClick={() => clearFilter("sortBy", sort)}
                      className="p-0.5 rounded-full hover:bg-orange-200 transition-colors"
                    >
                      <X size={12} className="text-orange-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sort Order Section */}
          {filters.sortOrder.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Sort Order
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.sortOrder.map((order) => (
                  <div
                    key={order}
                    className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    <span>{order === "asc" ? "Ascending" : "Descending"}</span>
                    <button
                      onClick={() => clearFilter("sortOrder", order)}
                      className="p-0.5 rounded-full hover:bg-red-200 transition-colors"
                    >
                      <X size={12} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {Object.values(filters).flat().length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Filter size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              No active filters
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Apply filters to see them here
            </p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-lg p-4 z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Search Locations
              </label>
              <input
                type="text"
                className="w-full border px-2 py-1 rounded"
                placeholder="Search..."
                value={filters.searchTerm}
                onChange={(e) => {
                  const newFilters = { ...filters, searchTerm: e.target.value };
                  setFilters(newFilters);
                  onFiltersChange(newFilters);
                }}
              />
            </div>

            {/* Services */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Services</label>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => {
                  const isSelected = filters.service.includes(service._id);
                  return (
                    <button
                      key={service._id}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleFilter("service", service._id)}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Service Types
              </label>
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map((type) => {
                  const isSelected = filters.serviceType.includes(type._id);
                  return (
                    <button
                      key={type._id}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleFilter("serviceType", type._id)}
                    >
                      {type.icon} {type.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Distance</label>
              <div className="flex flex-wrap gap-2">
                {["0-500", "500-1000", "1000-2000", "2000+"].map((range) => {
                  const isSelected = filters.distanceRange.includes(range);
                  return (
                    <button
                      key={range}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleFilter("distanceRange", range)}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Sort</label>
              <div className="flex flex-wrap gap-2">
                {["distance", "name", "type", "created"].map((sort) => {
                  const isSelected = filters.sortBy.includes(sort);
                  return (
                    <button
                      key={sort}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleFilter("sortBy", sort)}
                    >
                      {sort}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Order</label>
              <div className="flex flex-wrap gap-2">
                {["asc", "desc"].map((order) => {
                  const isSelected = filters.sortOrder.includes(order);
                  return (
                    <button
                      key={order}
                      type="button"
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                      onClick={() => toggleFilter("sortOrder", order)}
                    >
                      {order}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <button
                className="bg-gray-200 px-4 py-2 rounded"
                onClick={clearAll}
              >
                Clear All
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
