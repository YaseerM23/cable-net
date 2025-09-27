"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import AddLocationModal from "../components/AddLocationModal";
import NetworkAnalytics from "../components/NetworkAnalytics";
import AdvancedFilters from "../components/AdvancedFilters";
import NetworkExport from "../components/NetworkExport";
import MapProvider, {
  CENTRAL_HUB,
  useMap,
} from "../components/Map/MapProvider";
import polyline from "polyline";
import MapWithSearch from "../components/Map/MapWithSearch";
import { SearchBox } from "../components/Map/AutoComplete";
import MapContainer from "../components/Map/MapContainer";

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
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const { map, olaMaps } = useMap();
  const isMapLoaded = useRef(false);
  const cleanupScheduled = useRef(false);

  // Earth's radius in meters
  const EARTH_RADIUS = 6378137;

  // Create location marker with hover functionality
  const createLocationMarkerElement = useCallback((location) => {
    // Create container
    const el = document.createElement("div");
    el.className =
      "w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-gray-300 bg-white hover:scale-110 transition-transform duration-200 cursor-pointer";

    // Add icon inside
    const span = document.createElement("span");
    span.className = "text-xl";
    span.innerText = location.serviceType?.icon || "📍";
    el.appendChild(span);

    // Add hover effect for showing location info
    const popupDiv = document.createElement("div");
    popupDiv.className =
      "location-popup hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white p-3 rounded shadow-lg border z-10 w-64";
    popupDiv.innerHTML = `
      <div class="font-bold text-gray-800">${
        location.serviceName?.name || "Unknown Service"
      }</div>
      <div class="text-sm text-gray-600 mt-1">${
        location.serviceType?.name || "Unknown Type"
      }</div>
      <div class="text-xs text-gray-500 mt-2">
        <div>Lat: ${location.coordinates?.latitude?.toFixed(6) || "N/A"}</div>
        <div>Lng: ${location.coordinates?.longitude?.toFixed(6) || "N/A"}</div>
      </div>
      <div class="text-xs text-gray-500 mt-1">Distance: ${
        location.distanceFromCentralHub || 0
      }m</div>
      ${
        location.notes
          ? `<div class="text-xs text-gray-500 mt-1 truncate">${location.notes}</div>`
          : ""
      }
      <div class="text-xs text-gray-400 mt-1">${new Date(
        location.createdAt
      ).toLocaleString()}</div>
    `;

    el.appendChild(popupDiv);

    // Show popup on mouseenter
    el.addEventListener("mouseenter", () => {
      popupDiv.classList.remove("hidden");
      setHoveredLocation(location);
    });

    // Hide popup on mouseleave
    el.addEventListener("mouseleave", () => {
      popupDiv.classList.add("hidden");
      setHoveredLocation(null);
    });

    return el;
  }, []);

  // Calculate destination point given distance and bearing from a start point
  const calculateDestinationPoint = useCallback(
    (lat, lng, distance, bearing) => {
      // Convert degrees to radians
      const latRad = (lat * Math.PI) / 180;
      const lngRad = (lng * Math.PI) / 180;
      const bearingRad = (bearing * Math.PI) / 180;

      // Calculate destination point
      const angularDistance = distance / EARTH_RADIUS;

      const lat2 = Math.asin(
        Math.sin(latRad) * Math.cos(angularDistance) +
          Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
      );

      const lng2 =
        lngRad +
        Math.atan2(
          Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
          Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(lat2)
        );

      // Convert back to degrees
      return {
        lat: (lat2 * 180) / Math.PI,
        lng: (lng2 * 180) / Math.PI,
      };
    },
    []
  );

  // Create circle coordinates for a given radius
  const createCircleCoordinates = useCallback(
    (centerLat, centerLng, radius) => {
      const points = [];
      const numPoints = 64; // Number of points to approximate the circle

      for (let i = 0; i <= numPoints; i++) {
        const bearing = (i * 360) / numPoints;
        const point = calculateDestinationPoint(
          centerLat,
          centerLng,
          radius,
          bearing
        );
        points.push([point.lng, point.lat]); // Note: [lng, lat] for GeoJSON
      }

      return points;
    },
    [calculateDestinationPoint]
  );

  // Safe function to check if layer exists before removing
  const safeRemoveLayer = useCallback((mapInstance, layerId) => {
    if (mapInstance && mapInstance.getLayer && mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId);
    }
  }, []);

  // Safe function to check if source exists before removing
  const safeRemoveSource = useCallback((mapInstance, sourceId) => {
    if (
      mapInstance &&
      mapInstance.getSource &&
      mapInstance.getSource(sourceId)
    ) {
      mapInstance.removeSource(sourceId);
    }
  }, []);

  // Draw concentric circles at specified intervals - with map loaded check
  const drawRadiusCircles = useCallback(
    (maxDistance = 1000, interval = 100) => {
      if (!map || !isMapLoaded.current) return;

      try {
        // Remove existing radius circles if they exist
        safeRemoveLayer(map, "radius-circles-layer");
        safeRemoveLayer(map, "radius-circles-labels");
        safeRemoveSource(map, "radius-circles");

        // Calculate how many circles to draw
        const numCircles = Math.ceil(maxDistance / interval);

        // Create GeoJSON for circles
        const circleFeatures = [];

        for (let i = 1; i <= numCircles; i++) {
          const radius = i * interval;
          const coordinates = createCircleCoordinates(
            parseFloat(CENTRAL_HUB.lat),
            parseFloat(CENTRAL_HUB.lng),
            radius
          );

          // Create a line string for the circle
          circleFeatures.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
            properties: {
              radius: radius,
              // Use different opacity based on distance (further = more transparent)
              opacity: Math.max(0.2, 1 - i * 0.1),
              // Use a consistent color with varying opacity
              color: `rgba(52, 152, 219, ${Math.max(0.2, 1 - i * 0.1)})`,
            },
          });

          // Add a label for every other circle or for significant distances
          if (radius % 200 === 0 || radius === interval) {
            circleFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  calculateDestinationPoint(
                    parseFloat(CENTRAL_HUB.lat),
                    parseFloat(CENTRAL_HUB.lng),
                    radius,
                    0
                  ).lng,
                  calculateDestinationPoint(
                    parseFloat(CENTRAL_HUB.lat),
                    parseFloat(CENTRAL_HUB.lng),
                    radius,
                    0
                  ).lat,
                ],
              },
              properties: {
                radius: radius,
                type: "label",
                label: `${radius}m`,
                color: `rgba(52, 152, 219, ${Math.max(0.4, 1 - i * 0.1)})`,
              },
            });
          }
        }

        // Add source
        map.addSource("radius-circles", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: circleFeatures,
          },
        });

        // Add line layer for circles
        map.addLayer({
          id: "radius-circles-layer",
          type: "line",
          source: "radius-circles",
          filter: ["!=", "type", "label"], // Exclude labels from line layer
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-dasharray": [2, 2], // Dashed line for better visibility
          },
        });

        // Add symbol layer for labels
        map.addLayer({
          id: "radius-circles-labels",
          type: "symbol",
          source: "radius-circles",
          filter: ["==", "type", "label"],
          layout: {
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-anchor": "left",
            "text-offset": [0.5, 0],
          },
          paint: {
            "text-color": ["get", "color"],
            "text-halo-color": "white",
            "text-halo-width": 1,
          },
        });
      } catch (error) {
        console.log("Error drawing radius circles:", error);
      }
    },
    [
      map,
      createCircleCoordinates,
      calculateDestinationPoint,
      safeRemoveLayer,
      safeRemoveSource,
    ]
  );

  // Build GeoJSON for routes
  const buildRoutesGeoJSON = useCallback((elements) => {
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
            color: conn.serviceType?.colorForMarking || "#3498db",
            id: index,
          },
        };
      }),
    };
  }, []);

  // Render connections with markers - with map loaded check
  const renderConnections = useCallback(
    async (connections) => {
      if (!map || !olaMaps || !isMapLoaded.current) return;

      try {
        // Clear existing markers
        const mapContainer = map.getContainer();
        const existingMarkers =
          mapContainer.querySelectorAll(".location-marker");
        existingMarkers.forEach((marker) => {
          if (marker.parentNode) {
            marker.parentNode.removeChild(marker);
          }
        });

        // Remove existing routes
        safeRemoveLayer(map, "routes-layer");
        safeRemoveSource(map, "routes");

        // Add new markers
        for (let conn of connections) {
          const markerElement = createLocationMarkerElement(conn);
          markerElement.classList.add("location-marker");

          olaMaps
            .addMarker({
              element: markerElement,
              anchor: "center",
            })
            .setLngLat([
              Number(conn.coordinates.longitude),
              Number(conn.coordinates.latitude),
            ])
            .addTo(map);
        }

        // Create distance matrix request
        if (connections.length > 0) {
          const locationString = connections
            .map(
              (conn) =>
                `${conn.coordinates.latitude}%2C${conn.coordinates.longitude}`
            )
            .join("%7C");

          console.log("Location string for distance matrix:", locationString);

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
            distance: el.distance,
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

          console.log("Distance Matrix converted:", convertedElements);
          const geojson = buildRoutesGeoJSON(convertedElements);

          // Add routes source and layer
          if (!map.getSource("routes")) {
            map.addSource("routes", {
              type: "geojson",
              data: geojson,
            });
          } else {
            map.getSource("routes").setData(geojson);
          }

          if (!map.getLayer("routes-layer")) {
            map.addLayer({
              id: "routes-layer",
              type: "line",
              source: "routes",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-width": 4,
                "line-color": ["get", "color"],
              },
            });
          }
        }

        // Calculate max distance for radius circles
        const maxDistance =
          connections.length > 0
            ? Math.max(
                ...connections.map((conn) => conn.distanceFromCentralHub || 0)
              )
            : 1000;

        // Draw radius circles (at least up to 500m, or max distance + 100m)
        const circleMaxDistance = Math.max(
          500,
          Math.ceil(maxDistance / 100) * 100 + 100
        );
        drawRadiusCircles(circleMaxDistance, 100);
      } catch (error) {
        console.log("Error in renderConnections:", error);
      }
    },
    [
      map,
      olaMaps,
      createLocationMarkerElement,
      drawRadiusCircles,
      buildRoutesGeoJSON,
      safeRemoveLayer,
      safeRemoveSource,
    ]
  );
  useEffect(() => {
    if (map || olaMaps) {
      console.log("Thiz is map Val in NetworkMap : ", map, olaMaps);
    }
  }, [map, olaMaps]);

  // Initialize map and fetch data
  useEffect(() => {
    if (!map || !olaMaps) return;
    console.log("Thiz is map Val in NetworkMap : ", map, olaMaps);

    // Wait for map to be fully loaded
    const handleMapLoad = () => {
      isMapLoaded.current = true;

      // Set up map click handler
      const handleClick = (e) => {
        const { lng, lat } = e.lngLat;
        handleMapClick({ longitude: lng, latitude: lat });
      };

      map.on("click", handleClick);

      // Fit map to central hub initially
      map.flyTo({
        center: [parseFloat(CENTRAL_HUB.lng), parseFloat(CENTRAL_HUB.lat)],
        zoom: 14,
        duration: 1000,
      });

      // Fetch data
      fetchData();

      // Store cleanup function
      return () => {
        cleanupScheduled.current = true;
        map.off("click", handleClick);

        // Clean up layers
        safeRemoveLayer(map, "radius-circles-layer");
        safeRemoveLayer(map, "radius-circles-labels");
        safeRemoveLayer(map, "routes-layer");

        // Clean up sources
        safeRemoveSource(map, "radius-circles");
        safeRemoveSource(map, "routes");
      };
    };

    if (map.isStyleLoaded()) {
      const cleanup = handleMapLoad();
      return cleanup;
    } else {
      const handleStyleLoad = () => {
        map.off("styledata", handleStyleLoad);
        const cleanup = handleMapLoad();

        return () => {
          if (cleanup) cleanup();
        };
      };

      map.on("styledata", handleStyleLoad);

      return () => {
        map.off("styledata", handleStyleLoad);
        cleanupScheduled.current = true;
      };
    }
  }, [map, olaMaps, safeRemoveLayer, safeRemoveSource]);

  // Update filtered locations when all locations change
  useEffect(() => {
    setFilteredLocations(allLocations);
  }, [allLocations]);

  // Re-render connections when filtered locations change
  useEffect(() => {
    if (
      map &&
      olaMaps &&
      isMapLoaded.current &&
      filteredLocations.length >= 0
    ) {
      renderConnections(filteredLocations);
    }
  }, [filteredLocations, map, olaMaps, renderConnections]);

  // Fetch data function
  const fetchData = async () => {
    try {
      const [locationsRes, servicesRes, serviceTypesRes] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/services"),
        axios.get("/api/service-types"),
      ]);

      setAllLocations(locationsRes.data);
      setServices(servicesRes.data);
      setServiceTypes(serviceTypesRes.data);

      // Render connections after setting state
      setTimeout(() => {
        if (map && olaMaps && isMapLoaded.current) {
          renderConnections(locationsRes.data);
        }
      }, 100);
    } catch (error) {
      console.log("Error fetching locations, services, service-types:", error);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Handle filters change
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

  // Handle map click to add location
  const handleMapClick = (coordinates) => {
    setClickedCoordinates(coordinates);
    setShowAddModal(true);
  };

  // Handle location created
  const handleLocationCreated = (newLocation) => {
    setAllLocations((prev) => [...prev, newLocation]);
    setSuccess("Location added successfully!");

    // Re-render connections with new location
    setTimeout(() => {
      if (map && olaMaps && isMapLoaded.current) {
        renderConnections([...allLocations, newLocation]);
      }
    }, 100);

    setTimeout(() => setSuccess(""), 3000);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setClickedCoordinates(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupScheduled.current = true;
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading network map...</div>;
  }

  return (
    <div>
      <div className="relative">
        <MapContainer className="w-full h-[600px]" />

        {/* overlays */}
        <div className="absolute top-4 left-0 w-full flex justify-center gap-4 px-4">
          <SearchBox />
          <AdvancedFilters
            onFiltersChange={handleFiltersChange}
            services={services}
            serviceTypes={serviceTypes}
            locations={filteredLocations}
          />
        </div>
      </div>
      <NetworkAnalytics
        locations={filteredLocations}
        serviceTypes={serviceTypes}
        services={services}
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
