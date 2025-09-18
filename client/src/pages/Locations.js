"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [filteredServiceTypes, setFilteredServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceType: "",
    image: "",
    notes: "",
    coordinates: {
      latitude: "",
      longitude: "",
    },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.serviceName) {
      const filtered = serviceTypes.filter(
        (st) => st.service._id === formData.serviceName
      );
      setFilteredServiceTypes(filtered);
    } else {
      setFilteredServiceTypes([]);
    }
  }, [formData.serviceName, serviceTypes]);

  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ]);
      setLocations(locationsRes.data);
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);
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

    const lat = Number.parseFloat(formData.coordinates.latitude);
    const lng = Number.parseFloat(formData.coordinates.longitude);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError(
        "Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)"
      );
      return;
    }

    const locationData = {
      ...formData,
      coordinates: { latitude: lat, longitude: lng },
    };

    try {
      if (editingLocation) {
        await axios.put(`/api/locations/${editingLocation._id}`, locationData);
        setSuccess("Location updated successfully");
      } else {
        await axios.post("/api/locations", locationData);
        setSuccess("Location created successfully");
      }

      fetchData();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      serviceName: location.serviceName?._id || "",
      serviceType: location.serviceType?._id || "",
      image: location.image || "",
      notes: location.notes || "",
      coordinates: {
        latitude: location.coordinates.latitude.toString(),
        longitude: location.coordinates.longitude.toString(),
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await axios.delete(`/api/locations/${id}`);
        setSuccess("Location deleted successfully");
        fetchData();
      } catch (error) {
        setError("Failed to delete location");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      serviceType: "",
      image: "",
      notes: "",
      coordinates: { latitude: "", longitude: "" },
    });
    setEditingLocation(null);
    setShowForm(false);
  };

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
          });
          setSuccess("Current location detected!");
        },
        () => {
          setError(
            "Unable to get current location. Please enter coordinates manually."
          );
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Pagination & Search Logic
  const filteredLocations = locations.filter((location) => {
    const serviceName = location.serviceName?.name || "";
    const serviceType = location.serviceType?.name || "";
    const notes = location.notes || "";
    const searchLower = searchTerm.toLowerCase();

    return (
      serviceName.toLowerCase().includes(searchLower) ||
      serviceType.toLowerCase().includes(searchLower) ||
      notes.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLocations = filteredLocations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 mx-1 rounded-lg transition-colors ${
            i === currentPage
              ? "bg-blue-600 text-white font-semibold"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 mx-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-xl">Loading locations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-lg rounded-2xl p-6 lg:p-8">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-gray-800 tracking-wide">
            Location Management
          </h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search locations..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <button
              className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : "➕ Add New"}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 border border-gray-200 rounded-xl p-6 mb-8 bg-gray-50 shadow-inner"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Service
                </label>
                <select
                  className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  value={formData.serviceName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceName: e.target.value,
                      serviceType: "",
                    })
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
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Service Type
                </label>
                <select
                  className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  value={formData.coordinates.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: {
                        ...formData.coordinates,
                        latitude: e.target.value,
                      },
                    })
                  }
                  placeholder="10.981010"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  value={formData.coordinates.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: {
                        ...formData.coordinates,
                        longitude: e.target.value,
                      },
                    })
                  }
                  placeholder="76.9668453"
                  required
                />
              </div>
              <button
                type="button"
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                onClick={getCurrentLocation}
              >
                📍 Get Current Location
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Image URL (Optional)
              </label>
              <input
                type="url"
                className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://example.com/location-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                className="w-full border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this location..."
                rows="3"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
              >
                {editingLocation ? "Update Location" : "Create Location"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-400 text-white rounded-lg shadow hover:bg-gray-500 transition-colors"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto relative shadow-lg rounded-xl border border-gray-200">
          <table className="w-full text-sm text-gray-700">
            <thead className="text-xs uppercase bg-gray-100 text-gray-500">
              <tr>
                <th scope="col" className="p-4 text-left">
                  Service
                </th>
                <th scope="col" className="p-4 text-left">
                  Type
                </th>
                <th scope="col" className="p-4 text-left">
                  Coordinates
                </th>
                <th scope="col" className="p-4 text-left hidden md:table-cell">
                  Notes
                </th>
                <th scope="col" className="p-4 text-left hidden lg:table-cell">
                  Created At
                </th>
                <th scope="col" className="p-4 text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentLocations.map((location) => (
                <tr
                  key={location._id}
                  className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium whitespace-nowrap">
                    {location.serviceName?.name || "N/A"}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <span className="text-xl">
                      {location.serviceType?.icon}
                    </span>
                    <span>{location.serviceType?.name || "N/A"}</span>
                  </td>
                  <td className="p-4 text-xs">
                    <div>Lat: {location.coordinates.latitude.toFixed(6)}</div>
                    <div>Lng: {location.coordinates.longitude.toFixed(6)}</div>
                  </td>
                  <td className="p-4 max-w-[200px] truncate hidden md:table-cell">
                    {location.notes || "No notes"}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {new Date(location.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => handleEdit(location)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM3 5h2v12H3V5zm4 10h10v2H7v-2z"></path>
                      </svg>
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                      onClick={() => handleDelete(location._id)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentLocations.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No locations match your search or exist.
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default Locations;
