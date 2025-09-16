"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import OLAMap from "../components/OLAMap"
import AddLocationModal from "../components/AddLocationModal"
import NetworkAnalytics from "../components/NetworkAnalytics"
import AdvancedFilters from "../components/AdvancedFilters"
import NetworkExport from "../components/NetworkExport"

const NetworkMap = () => {
  const [allLocations, setAllLocations] = useState([])
  const [filteredLocations, setFilteredLocations] = useState([])
  const [services, setServices] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [clickedCoordinates, setClickedCoordinates] = useState(null)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setFilteredLocations(allLocations)
  }, [allLocations])

  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ])
      setAllLocations(locationsRes.data)
      setServices(servicesRes.data)
      setServiceTypes(serviceTypesRes.data)
    } catch (error) {
      setError("Failed to fetch data")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (filters) => {
    let filtered = [...allLocations]

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(
        (location) =>
          location.notes?.toLowerCase().includes(searchTerm) ||
          location.serviceName?.name?.toLowerCase().includes(searchTerm) ||
          location.serviceType?.name?.toLowerCase().includes(searchTerm) ||
          location.coordinates.latitude.toString().includes(searchTerm) ||
          location.coordinates.longitude.toString().includes(searchTerm),
      )
    }

    // Apply service filter
    if (filters.service) {
      filtered = filtered.filter((location) => location.serviceName._id === filters.service)
    }

    // Apply service type filter
    if (filters.serviceType) {
      filtered = filtered.filter((location) => location.serviceType._id === filters.serviceType)
    }

    // Apply distance range filter
    if (filters.distanceRange) {
      const [min, max] = filters.distanceRange.includes("+")
        ? [Number.parseInt(filters.distanceRange.replace("+", "")), Number.POSITIVE_INFINITY]
        : filters.distanceRange.split("-").map(Number)

      filtered = filtered.filter((location) => {
        const distance = location.distanceFromCentralHub
        return distance >= min && distance < max
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (filters.sortBy) {
        case "name":
          aValue = a.serviceName?.name || ""
          bValue = b.serviceName?.name || ""
          break
        case "type":
          aValue = a.serviceType?.name || ""
          bValue = b.serviceType?.name || ""
          break
        case "created":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case "distance":
        default:
          aValue = a.distanceFromCentralHub
          bValue = b.distanceFromCentralHub
          break
      }

      if (filters.sortOrder === "desc") {
        return aValue < bValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })

    setFilteredLocations(filtered)
  }

  const handleMapClick = (coordinates) => {
    setClickedCoordinates(coordinates)
    setShowAddModal(true)
  }

  const handleLocationCreated = (newLocation) => {
    setAllLocations((prev) => [...prev, newLocation])
    setSuccess("Location added successfully!")
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setClickedCoordinates(null)
  }

  if (loading) {
    return <div className="loading">Loading network map...</div>
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Interactive Network Map</h2>
          <div style={{ fontSize: "14px", color: "#666" }}>Click anywhere on the map to add a new location</div>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <OLAMap locations={filteredLocations} onMapClick={handleMapClick} />
      </div>

      <NetworkAnalytics locations={filteredLocations} serviceTypes={serviceTypes} services={services} />

      <AdvancedFilters
        onFiltersChange={handleFiltersChange}
        services={services}
        serviceTypes={serviceTypes}
        locations={filteredLocations}
      />

      <NetworkExport locations={filteredLocations} services={services} serviceTypes={serviceTypes} />

      <AddLocationModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        coordinates={clickedCoordinates}
        onLocationCreated={handleLocationCreated}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Network Locations ({filteredLocations.length})</h3>
        </div>

        {filteredLocations.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Type</th>
                <th>Coordinates</th>
                <th>Distance from Hub</th>
                <th>Notes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => (
                <tr key={location._id}>
                  <td>{location.serviceName?.name || "N/A"}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "16px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: location.serviceType?.colorForMarking || "#3498db",
                          color: "white",
                        }}
                      >
                        {location.serviceType?.icon}
                      </span>
                      {location.serviceType?.name || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px" }}>
                      <div>Lat: {location.coordinates.latitude.toFixed(6)}</div>
                      <div>Lng: {location.coordinates.longitude.toFixed(6)}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{location.distanceFromCentralHub}m</span>
                  </td>
                  <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {location.notes || "No notes"}
                  </td>
                  <td>{new Date(location.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No locations match your current filters. Try adjusting your search criteria.
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkMap
