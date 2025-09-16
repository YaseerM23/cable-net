"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const Locations = () => {
  const [locations, setLocations] = useState([])
  const [services, setServices] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [filteredServiceTypes, setFilteredServiceTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceType: "",
    image: "",
    notes: "",
    coordinates: {
      latitude: "",
      longitude: "",
    },
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter service types based on selected service
    if (formData.serviceName) {
      const filtered = serviceTypes.filter((st) => st.service._id === formData.serviceName)
      setFilteredServiceTypes(filtered)
    } else {
      setFilteredServiceTypes([])
    }
  }, [formData.serviceName, serviceTypes])

  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ])
      setLocations(locationsRes.data)
      setServices(servicesRes.data)
      setServiceTypes(serviceTypesRes.data)
    } catch (error) {
      setError("Failed to fetch data")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate coordinates
    const lat = Number.parseFloat(formData.coordinates.latitude)
    const lng = Number.parseFloat(formData.coordinates.longitude)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)")
      return
    }

    const locationData = {
      ...formData,
      coordinates: {
        latitude: lat,
        longitude: lng,
      },
    }

    try {
      if (editingLocation) {
        await axios.put(`/api/locations/${editingLocation._id}`, locationData)
        setSuccess("Location updated successfully")
      } else {
        await axios.post("/api/locations", locationData)
        setSuccess("Location created successfully")
      }

      fetchData()
      resetForm()
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed")
    }
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({
      serviceName: location.serviceName._id,
      serviceType: location.serviceType._id,
      image: location.image || "",
      notes: location.notes || "",
      coordinates: {
        latitude: location.coordinates.latitude.toString(),
        longitude: location.coordinates.longitude.toString(),
      },
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await axios.delete(`/api/locations/${id}`)
        setSuccess("Location deleted successfully")
        fetchData()
      } catch (error) {
        setError("Failed to delete location")
      }
    }
  }

  const resetForm = () => {
    setFormData({
      serviceName: "",
      serviceType: "",
      image: "",
      notes: "",
      coordinates: { latitude: "", longitude: "" },
    })
    setEditingLocation(null)
    setShowForm(false)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            coordinates: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            },
          })
          setSuccess("Current location detected!")
        },
        (error) => {
          setError("Unable to get current location. Please enter coordinates manually.")
        },
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }

  if (loading) {
    return <div className="loading">Loading locations...</div>
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Location Management</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add New Location"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Service</label>
                <select
                  className="form-select"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value, serviceType: "" })}
                  required
                >
                  <option value="">Select a service</option>
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
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  required
                  disabled={!formData.serviceName}
                >
                  <option value="">Select a service type</option>
                  {filteredServiceTypes.map((serviceType) => (
                    <option key={serviceType._id} value={serviceType._id}>
                      {serviceType.icon} {serviceType.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", alignItems: "end" }}>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={formData.coordinates.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, latitude: e.target.value },
                    })
                  }
                  placeholder="10.981010"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={formData.coordinates.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: { ...formData.coordinates, longitude: e.target.value },
                    })
                  }
                  placeholder="76.9668453"
                  required
                />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={getCurrentLocation}
                style={{ height: "fit-content" }}
              >
                📍 Get Current Location
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/location-image.jpg"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this location..."
                rows="3"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-success">
                {editingLocation ? "Update Location" : "Create Location"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Type</th>
              <th>Coordinates</th>
              <th>Distance from Hub</th>
              <th>Notes</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location._id}>
                <td>{location.serviceName?.name || "N/A"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>{location.serviceType?.icon}</span>
                    {location.serviceType?.name || "N/A"}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: "12px" }}>
                    <div>Lat: {location.coordinates.latitude.toFixed(6)}</div>
                    <div>Lng: {location.coordinates.longitude.toFixed(6)}</div>
                  </div>
                </td>
                <td>{location.distanceFromCentralHub}m</td>
                <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {location.notes || "No notes"}
                </td>
                <td>{new Date(location.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(location)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(location._id)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {locations.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No locations found. Create your first location to get started.
          </div>
        )}
      </div>
    </div>
  )
}

export default Locations
