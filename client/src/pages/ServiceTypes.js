"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { DataTable } from "../components/DataTable";

const ServiceTypes = () => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServiceType, setEditingServiceType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    colorForMarking: "#3498db",
    icon: "",
    service: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [serviceTypesRes, servicesRes] = await Promise.all([
        axios.get("/api/service-types"),
        axios.get("/api/services"),
      ]);
      setServiceTypes(serviceTypesRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingServiceType) {
        await axios.put(
          `/api/service-types/${editingServiceType._id}`,
          formData
        );
        setSuccess("Service type updated successfully");
      } else {
        await axios.post("/api/service-types", formData);
        setSuccess("Service type created successfully");
      }

      fetchData();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (serviceType) => {
    setEditingServiceType(serviceType);
    setFormData({
      name: serviceType.name,
      colorForMarking: serviceType.colorForMarking,
      icon: serviceType.icon,
      service: serviceType.service._id,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service type?")) {
      try {
        await axios.delete(`/api/service-types/${id}`);
        setSuccess("Service type deleted successfully");
        fetchData();
      } catch (error) {
        setError("Failed to delete service type");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      colorForMarking: "#3498db",
      icon: "",
      service: "",
    });
    setEditingServiceType(null);
    setShowForm(false);
  };

  const iconOptions = [
    "📡",
    "🔌",
    "📶",
    "🌐",
    "⚡",
    "🔧",
    "📊",
    "🎯",
    "🔗",
    "📋",
    "🏢",
    "🏠",
    "🏭",
    "🏪",
    "🏫",
    "🏥",
    "🏦",
    "🏨",
    "🏩",
    "🏰",
  ];

  if (loading) {
    return <div className="loading">Loading service types...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-lg rounded-2xl p-6 lg:p-8">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-gray-800 tracking-wide">
            Service Type Management
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "Add New Service Type"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
            <div className="form-group">
              <label className="form-label">Service Type Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., AC Node, Injector, Tenda, Railwire"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Service</label>
              <select
                className="form-select"
                value={formData.service}
                onChange={(e) =>
                  setFormData({ ...formData, service: e.target.value })
                }
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
              <label className="form-label">Color for Marking</label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  type="color"
                  value={formData.colorForMarking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colorForMarking: e.target.value,
                    })
                  }
                  style={{
                    width: "50px",
                    height: "40px",
                    border: "none",
                    borderRadius: "4px",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={formData.colorForMarking}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colorForMarking: e.target.value,
                    })
                  }
                  placeholder="#3498db"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(10, 1fr)",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    style={{
                      padding: "8px",
                      border:
                        formData.icon === icon
                          ? "2px solid #3498db"
                          : "1px solid #ddd",
                      borderRadius: "4px",
                      background: formData.icon === icon ? "#e3f2fd" : "white",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="Select an icon above or enter custom"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-success">
                {editingServiceType
                  ? "Update Service Type"
                  : "Create Service Type"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <DataTable
          data={serviceTypes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          columns={[
            { key: "name", header: "Name" },
            {
              key: "service",
              header: "Service",
              render: (s) => s.service?.name || "N/A",
            },
            {
              key: "colorForMarking",
              header: "Color",
              render: (s) => (
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: s.colorForMarking,
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {s.colorForMarking}
                </div>
              ),
            },
            {
              key: "icon",
              header: "Icon",
              render: (s) => <span className="text-lg">{s.icon}</span>,
            },
            {
              key: "createdAt",
              header: "Created At",
              render: (s) => new Date(s.createdAt).toLocaleDateString(),
            },
          ]}
        />

        {serviceTypes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No service types found. Create your first service type to get
            started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTypes;
