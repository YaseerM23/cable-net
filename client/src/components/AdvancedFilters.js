"use client"

import { useState } from "react"

const AdvancedFilters = ({ onFiltersChange, services, serviceTypes, locations }) => {
  const [filters, setFilters] = useState({
    service: "",
    serviceType: "",
    distanceRange: "",
    searchTerm: "",
    sortBy: "distance",
    sortOrder: "asc",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      service: "",
      serviceType: "",
      distanceRange: "",
      searchTerm: "",
      sortBy: "distance",
      sortOrder: "asc",
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value && value !== "distance" && value !== "asc").length
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="card-title">
            Filters & Search
            {getActiveFilterCount() > 0 && (
              <span
                style={{
                  background: "#e74c3c",
                  color: "white",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  marginLeft: "8px",
                }}
              >
                {getActiveFilterCount()}
              </span>
            )}
          </h3>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ fontSize: "12px", padding: "6px 12px" }}
          >
            {showAdvanced ? "Simple" : "Advanced"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showAdvanced ? "1fr 1fr" : "1fr", gap: "15px" }}>
        <div>
          <div className="form-group">
            <label className="form-label">Search Locations</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by notes, service name, or coordinates..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Service</label>
              <select
                className="form-select"
                value={filters.service}
                onChange={(e) => handleFilterChange("service", e.target.value)}
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select
                className="form-select"
                value={filters.serviceType}
                onChange={(e) => handleFilterChange("serviceType", e.target.value)}
              >
                <option value="">All Types</option>
                {serviceTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div>
            <div className="form-group">
              <label className="form-label">Distance from Hub</label>
              <select
                className="form-select"
                value={filters.distanceRange}
                onChange={(e) => handleFilterChange("distanceRange", e.target.value)}
              >
                <option value="">All Distances</option>
                <option value="0-500">0 - 500m</option>
                <option value="500-1000">500m - 1km</option>
                <option value="1000-2000">1km - 2km</option>
                <option value="2000+">2km+</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="distance">Distance</option>
                  <option value="name">Service Name</option>
                  <option value="type">Service Type</option>
                  <option value="created">Date Created</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Order</label>
                <select
                  className="form-select"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button className="btn btn-danger" onClick={clearFilters} style={{ fontSize: "12px", padding: "6px 12px" }}>
          Clear All Filters
        </button>
        <div style={{ fontSize: "12px", color: "#666", alignSelf: "center" }}>
          Showing {locations.length} location{locations.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  )
}

export default AdvancedFilters
