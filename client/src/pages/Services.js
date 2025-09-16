"use client"

import { useState, useEffect } from "react"
import axios from "axios"

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await axios.get("/api/services")
      setServices(response.data)
    } catch (error) {
      setError("Failed to fetch services")
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      if (editingService) {
        await axios.put(`/api/services/${editingService._id}`, formData)
        setSuccess("Service updated successfully")
      } else {
        await axios.post("/api/services", formData)
        setSuccess("Service created successfully")
      }

      fetchServices()
      resetForm()
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed")
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      image: service.image || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await axios.delete(`/api/services/${id}`)
        setSuccess("Service deleted successfully")
        fetchServices()
      } catch (error) {
        setError("Failed to delete service")
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: "", image: "" })
    setEditingService(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="loading">Loading services...</div>
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Service Management</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add New Service"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cable TV, WiFi Services"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-success">
                {editingService ? "Update Service" : "Create Service"}
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
              <th>Name</th>
              <th>Image</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id}>
                <td>{service.name}</td>
                <td>
                  {service.image ? (
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }}
                    />
                  ) : (
                    "No image"
                  )}
                </td>
                <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(service)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(service._id)}
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

        {services.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No services found. Create your first service to get started.
          </div>
        )}
      </div>
    </div>
  )
}

export default Services
