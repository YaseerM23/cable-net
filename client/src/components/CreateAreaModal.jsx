import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ReverseGeoCodeApi } from "./Map/Api";
import { fetcher } from "./Map/Fetcher";
import { useMap } from "./Map/MapProvider";

// interface CreateAreaModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   coordinates: { longitude: number, latitude: number } | null;
//   onLocationCreated: (data: any) => void;
// }

const CreateAreaModal = ({
  isOpen,
  onClose,
  coordinates,
  onLocationCreated,
  onSafeRemoveLayer,
  onSafeRemoveSource,
}) => {
  const [shouldFetch, setShouldFetch] = React.useState(false);
  const { map, olaMaps } = useMap();
  const mapRef = useRef(null);
  const olaMapsRef = useRef(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (map) mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (olaMaps) olaMapsRef.current = olaMaps;
  }, [olaMaps]);

  // Trigger API only once modal opens with valid coordinates
  React.useEffect(() => {
    if (isOpen && coordinates) setShouldFetch(true);
  }, [isOpen, coordinates]);

  const {
    data: addressData,
    error,
    isLoading,
  } = useSWR(
    shouldFetch
      ? [
          ReverseGeoCodeApi(coordinates),
          { method: "GET", headers: { "X-Request-Id": "request-123" } },
        ]
      : null,
    fetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    }
  );

  if (!isOpen || !coordinates) return null;

  const showAddressLabel = (map, coordinates, address) => {
    try {
      const sourceId = "reverse-geocode-label";
      const layerId = "reverse-geocode-layer";

      const updatedGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                Number(coordinates.longitude),
                Number(coordinates.latitude),
              ],
            },
            properties: {
              title: address,
            },
          },
        ],
      };
      console.log("Label GeoJSON:", updatedGeoJSON);
      console.log("Reverse-geocode Layer :", map.getLayer(layerId));
      console.log("Reverse-geocode Lable Source :", map.getSource(sourceId));

      // // 🧩 Check if the source already exists
      // if (map.getSource(sourceId)) {
      //   // ✅ Just update the existing label data
      //   map.getSource(sourceId).setData(updatedGeoJSON);
      //   console.log("🔁 Updated existing address label source");
      // } else {
      //   // 🆕 Add source and layer for the first time
      //   map.addSource(sourceId, {
      //     type: "geojson",
      //     data: updatedGeoJSON,
      //   });

      //   map.addLayer({
      //     id: layerId,
      //     type: "symbol",
      //     source: sourceId,
      //     minzoom: 16, // visible when zoomed in
      //     layout: {
      //       "text-field": ["get", "title"],
      //       "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      //       "text-size": 12,
      //       "text-offset": [0, -1.2],
      //       "text-anchor": "top",
      //     },
      //     paint: {
      //       "text-color": "#1a1a1a",
      //       "text-halo-color": "#ffffff",
      //       "text-halo-width": 2,
      //     },
      //   });

      //   console.log("🆕 Added new address label layer");
      // }
    } catch (error) {
      console.log("❌ Error while adding/updating address label:", error);
    }
  };

  const handleSave = () => {
    try {
      const map = mapRef.current;
      const olaMaps = olaMapsRef.current;
      if (!address) return alert("No location data found yet!");
      // console.log("Selected ADDRESS : ", address);
      showAddressLabel(map, coordinates, address);
      // const el = document.createElement("div");
      // el.className = "text-xs bg-white px-2 py-1 rounded shadow";
      // el.innerText = address;
      // const popup = olaMaps
      //   .addPopup({ offset: [0, -20], anchor: "center" })
      //   .setText(address);
      // olaMaps
      //   .addMarker({ element: el })
      //   .setPopup(popup)
      //   .setLngLat([
      //     Number(coordinates.longitude),
      //     Number(coordinates.latitude),
      //   ])
      //   .addTo(map);
      onClose();
      onLocationCreated({ coordinates, addressData });
    } catch (error) {
      console.log("ERRor While adding Address LabEL : ", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg w-[400px] p-6">
        <h2 className="text-lg font-semibold mb-4">🟩 Create Area</h2>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Longitude:</strong> {coordinates.longitude.toFixed(6)}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Latitude:</strong> {coordinates.latitude.toFixed(6)}
          </p>

          {/* 🌀 State Handling */}
          {isLoading && (
            <p className="text-gray-500 italic mt-4">Fetching address...</p>
          )}

          {error && (
            <p className="text-red-500 mt-4">
              ❌ Failed to fetch address. Please try again.
            </p>
          )}

          {addressData &&
          Array.isArray(addressData.results) &&
          addressData.results.length > 0 ? (
            <div className="bg-gray-50 p-3 rounded-md border mt-4 max-h-64 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">
                📍 Possible Addresses:
              </p>

              <ul className="space-y-2">
                {addressData.results.map((item, index) => (
                  <li
                    key={index}
                    className="p-2 bg-white rounded-md shadow-sm border hover:bg-green-50 transition"
                    onClick={() => setAddress(item.formatted_address)}
                  >
                    <p className="text-sm text-gray-800">
                      <strong>Address:</strong>{" "}
                      {item.formatted_address || item.display_name || "—"}
                    </p>

                    {item.name && (
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Place:</strong> {item.name}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            !isLoading &&
            !error && (
              <p className="text-sm text-gray-500 mt-3 italic">
                No addresses found for this location.
              </p>
            )
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              disabled={isLoading || !!error}
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg text-white ${
                isLoading || !!error
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAreaModal;
