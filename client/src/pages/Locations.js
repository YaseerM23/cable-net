// components/Locations.js
"use client";

import { useState, useEffect } from "react";
import axios from "../components/axios";
import { DataTable } from "../components/DataTable";
import useUserStore from "../store/adminStore";

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [imageFile2, setImageFile2] = useState(null);
  const [imagePreview2, setImagePreview2] = useState(null);
  const [filteredServiceTypes, setFilteredServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceType: "",
    image: "",
    image2: "",
    notes: "",
    coordinates: {
      latitude: "",
      longitude: "",
    },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { user, setUser } = useUserStore();

  // ✅ Cloudinary Upload Function (Hardcoded)
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "react_upload_preset"); // ← Replace with your preset name
    formData.append("cloud_name", "dgixdcqvh"); // ← Replace with your cloud name

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dgixdcqvh/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Upload failed");
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.serviceName) {
      const filtered = serviceTypes.filter(
        (st) => st.service?._id === formData.serviceName
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

      // Cloudinary URLs are already absolute — no fix needed
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

    try {
      let image1Url = formData.image; // Keep existing if not uploading new
      let image2Url = formData.image2;

      // Upload new images if selected
      if (imageFile) {
        image1Url = await uploadToCloudinary(imageFile);
      }
      if (imageFile2) {
        image2Url = await uploadToCloudinary(imageFile2);
      }

      const locationData = {
        serviceName: formData.serviceName,
        serviceType: formData.serviceType,
        notes: formData.notes,
        latitude: lat,
        longitude: lng,
        ...(image1Url !== undefined && { image: image1Url }),
        ...(image2Url !== undefined && { image2: image2Url }),
      };

      let response;
      if (editingLocation) {
        response = await axios.put(
          `/api/locations/${editingLocation._id}`,
          locationData
        );
      } else {
        response = await axios.post("/api/locations", locationData);
      }

      setSuccess(
        editingLocation
          ? "Location updated successfully"
          : "Location created successfully"
      );
      fetchData();
      resetForm();
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Operation failed");
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      serviceName: location.serviceName?._id || "",
      serviceType: location.serviceType?._id || "",
      image: location.image || "",
      image2: location.image2 || "",
      notes: location.notes || "",
      coordinates: {
        latitude: location.coordinates.latitude.toString(),
        longitude: location.coordinates.longitude.toString(),
      },
    });
    setImageFile(null);
    setImageFile2(null);
    setImagePreview(null);
    setImagePreview2(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        const { data } = await axios.delete(`/api/locations/${id}/${user.id}`);
        setUser(data.updatedUser);
        localStorage.setItem("auth", JSON.stringify(data.updatedUser));
        setSuccess("Location deleted successfully");
        fetchData();
      } catch (error) {
        console.log("Error While Delete Location: ", error);
        setError("Failed to delete location");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: "",
      serviceType: "",
      image: "",
      image2: "",
      notes: "",
      coordinates: { latitude: "", longitude: "" },
    });
    setImageFile(null);
    setImageFile2(null);
    setImagePreview(null);
    setImagePreview2(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleImageChange2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }
      setImageFile2(file);
      setImagePreview2(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const removeImage2 = () => {
    setImageFile2(null);
    setImagePreview2(null);
  };

  // Pagination & Search Logic (unchanged)
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

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={`px-4 py-2 mx-1 rounded-lg transition-colors ${
              i + 1 === currentPage
                ? "bg-blue-600 text-white font-semibold"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
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
                  setCurrentPage(1);
                }}
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
          </div>
        </div>

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

            {/* Image 1 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Upload Image (Optional, max 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {(imagePreview || formData.image) && (
                <div className="mt-3 flex items-center gap-4">
                  <img
                    src={imagePreview || formData.image}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Image 2 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Upload Second Image (Optional, max 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {(imagePreview2 || formData.image2) && (
                <div className="mt-3 flex items-center gap-4">
                  <img
                    src={imagePreview2 || formData.image2}
                    alt="Preview 2"
                    className="h-20 w-20 object-cover rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage2}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Remove Image
                  </button>
                </div>
              )}
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

        <DataTable
          data={currentLocations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          columns={[
            {
              key: "serviceName",
              header: "Service",
              render: (l) => l.serviceName?.name || "N/A",
            },
            {
              key: "serviceType",
              header: "Type",
              render: (l) => (
                <div className="flex items-center gap-2">
                  <span className="text-xl">{l.serviceType?.icon}</span>
                  <span>{l.serviceType?.name || "N/A"}</span>
                </div>
              ),
            },
            {
              key: "coordinates",
              header: "Coordinates",
              render: (l) => (
                <div className="text-xs">
                  <div>Lat: {l.coordinates.latitude.toFixed(6)}</div>
                  <div>Lng: {l.coordinates.longitude.toFixed(6)}</div>
                </div>
              ),
            },
            {
              key: "notes",
              header: "Notes",
              className: "hidden md:table-cell max-w-[200px] truncate",
              render: (l) => l.notes || "No notes",
            },
            {
              key: "createdAt",
              header: "Created At",
              className: "hidden lg:table-cell",
              render: (l) => new Date(l.createdAt).toLocaleDateString(),
            },
            {
              key: "image",
              header: "Image",
              className: "hidden md:table-cell",
              render: (l) => (
                <div className="flex gap-1">
                  {l.image && (
                    <img
                      src={l.image}
                      alt="1"
                      className="h-8 w-8 object-cover rounded border"
                    />
                  )}
                  {l.image2 && (
                    <img
                      src={l.image2}
                      alt="2"
                      className="h-8 w-8 object-cover rounded border"
                    />
                  )}
                  {!l.image && !l.image2 && (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              ),
            },
          ]}
        />
        {currentLocations.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No locations match your search or exist.
          </div>
        )}

        {renderPagination()}
      </div>
    </div>
  );
};

export default Locations;
