"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import OLAMap from "../components/OLAMap";
import AddLocationModal from "../components/AddLocationModal";
import NetworkAnalytics from "../components/NetworkAnalytics";
import AdvancedFilters from "../components/AdvancedFilters";
import NetworkExport from "../components/NetworkExport";
import { CENTRAL_HUB, useMap } from "../components/Map/MapProvider";
import polyline from "polyline";
import { SearchBox } from "../components/Map/AutoComplete";
import MapWithSearch from "../components/Map/MapWithSearch";

const NetworkMap = () => {
  const [allLocations, setAllLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState(null);
  const [success, setSuccess] = useState("");
  const { map, olaMaps } = useMap();

  useEffect(() => {
    if (!map || !olaMaps) return; // wait until they are ready
    fetchData();
  }, [map, olaMaps]);

  function createLocationMarkerElement(icon) {
    // Create container
    const el = document.createElement("div");
    el.className =
      "w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-300 bg-white hover:scale-110 transition-transform duration-200";

    // Add icon inside (emoji or font-awesome class)
    const span = document.createElement("span");
    span.className = "text-xl"; // size
    span.innerText = icon; // can be emoji like 📶 or 🌐
    el.appendChild(span);

    return el;
  }

  async function renderConnections(connections) {
    try {
      for (let conn of connections) {
        olaMaps
          .addMarker({
            element: createLocationMarkerElement(conn.serviceType.icon),
            anchor: "center",
          })
          .setLngLat([
            Number(conn.coordinates.longitude),
            Number(conn.coordinates.latitude),
          ])
          .addTo(map);
      }
      const locationString = connections
        .map(
          (conn) =>
            `${conn.coordinates.latitude}%2C${conn.coordinates.longitude}`
        )
        .join("%7C");
      console.log("This si the locatio string passing ::) ", locationString);
      const response = await fetch(
        `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${CENTRAL_HUB.lat}%2C${CENTRAL_HUB.lng}&destinations=${locationString}&api_key=dxEuToWnHB5W4e4lcqiFwu2RwKA64Ixi0BFR73kQ`,
        {
          method: "GET",
          headers: { "X-Request-Id": "XXX" },
        }
      );
      const data = await response.json();
      const elements = data.rows[0].elements;
      const convertedElements = elements.map((el, index) => ({
        distance: `${el.distance}`,
        duration: `${Math.floor(el.duration / 3600)} hrs ${Math.floor(
          (el.duration % 3600) / 60
        )} min`,
        polyline: el.polyline,
        service: connections[index]?.serviceName,
        serviceType: connections[index]?.serviceType,
        createdAt: connections[index]?.createdAt,
        distanceFromCentralHub: connections[index]?.distanceFromCentralHub,
        image: connections[index]?.image,
        notes: connections[index]?.notes,
        location: connections[index]?.coordinates || "N/A",
      }));
      console.log(
        "THE successive OF DeistMatrix CONVERTED :-:",
        convertedElements
      );
      const geojson = buildRoutesGeoJSON(convertedElements);

      if (!map.getSource("routes")) {
        map.addSource("routes", { type: "geojson", data: geojson });

        map.addLayer({
          id: "routes-layer",
          type: "line",
          source: "routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 4,
            "line-color": ["get", "color"], // use property color 🎨
          },
        });
      } else {
        map.getSource("routes").setData(geojson);
      }
    } catch (error) {
      console.log("THe ERROR in renderCOllect CT BLCOK : ", error);
    }
  }

  function buildRoutesGeoJSON(elements) {
    return {
      type: "FeatureCollection",
      features: elements.map((conn, index) => {
        // decode into [lat, lng], then swap → [lng, lat]
        const decoded = polyline
          .decode(conn.polyline)
          .map(([lat, lng]) => [lng, lat]);

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: decoded,
          },
          properties: {
            color: conn.serviceType.colorForMarking, // dynamic color 🎨
            id: index,
          },
        };
      }),
    };
  }

  function paintTheMap(elements) {
    try {
      for (let conn of elements) {
        const decodedPolyglon = polyline.decode(conn.polyline);
        const swappedPolyline = decodedPolyglon.map(([lat, lng]) => [lng, lat]);
      }
    } catch (error) {
      console.log("Error While Painting the Map : ", error);
    }
  }

  useEffect(() => {
    setFilteredLocations(allLocations);
  }, [allLocations]);

  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ]);
      await renderConnections(locationsRes.data);
      setAllLocations(locationsRes.data);
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);
    } catch (error) {
      console.log(
        "Error WHILE fetch locations,services,services-types : ",
        error
      );

      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters) => {
    let filtered = [...allLocations];

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (location) =>
          location.notes?.toLowerCase().includes(searchTerm) ||
          location.serviceName?.name?.toLowerCase().includes(searchTerm) ||
          location.serviceType?.name?.toLowerCase().includes(searchTerm) ||
          location.coordinates.latitude.toString().includes(searchTerm) ||
          location.coordinates.longitude.toString().includes(searchTerm)
      );
    }

    // Apply service filter
    if (filters.service) {
      filtered = filtered.filter(
        (location) => location.serviceName._id === filters.service
      );
    }

    // Apply service type filter
    if (filters.serviceType) {
      filtered = filtered.filter(
        (location) => location.serviceType._id === filters.serviceType
      );
    }

    // Apply distance range filter
    if (filters.distanceRange) {
      const [min, max] = filters.distanceRange.includes("+")
        ? [
            Number.parseInt(filters.distanceRange.replace("+", "")),
            Number.POSITIVE_INFINITY,
          ]
        : filters.distanceRange.split("-").map(Number);

      filtered = filtered.filter((location) => {
        const distance = location.distanceFromCentralHub;
        return distance >= min && distance < max;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.serviceName?.name || "";
          bValue = b.serviceName?.name || "";
          break;
        case "type":
          aValue = a.serviceType?.name || "";
          bValue = b.serviceType?.name || "";
          break;
        case "created":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "distance":
        default:
          aValue = a.distanceFromCentralHub;
          bValue = b.distanceFromCentralHub;
          break;
      }

      if (filters.sortOrder === "desc") {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredLocations(filtered);
  };

  const handleMapClick = (coordinates) => {
    setClickedCoordinates(coordinates);
    setShowAddModal(true);
  };

  const handleLocationCreated = (newLocation) => {
    setAllLocations((prev) => [...prev, newLocation]);
    setSuccess("Location added successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setClickedCoordinates(null);
  };

  if (loading) {
    return <div className="loading">Loading network map...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Interactive Network Map</h2>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Click anywhere on the map to add a new location
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
      <NetworkAnalytics
        locations={filteredLocations}
        serviceTypes={serviceTypes}
        services={services}
      />
      <AdvancedFilters
        onFiltersChange={handleFiltersChange}
        services={services}
        serviceTypes={serviceTypes}
        locations={filteredLocations}
      />
      <NetworkExport
        locations={filteredLocations}
        services={services}
        serviceTypes={serviceTypes}
      />
      <AddLocationModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        coordinates={clickedCoordinates}
        onLocationCreated={handleLocationCreated}
      />
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Network Locations ({filteredLocations.length})
          </h3>
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor:
                            location.serviceType?.colorForMarking || "#3498db",
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
                      <div>
                        Lng: {location.coordinates.longitude.toFixed(6)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "bold", color: "#2c3e50" }}>
                      {location.distanceFromCentralHub}m
                    </span>
                  </td>
                  <td
                    style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {location.notes || "No notes"}
                  </td>
                  <td>{new Date(location.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No locations match your current filters. Try adjusting your search
            criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkMap;
