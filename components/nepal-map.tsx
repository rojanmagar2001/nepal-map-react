/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Types
interface Project {
  id: number;
  name: string;
  description: string;
  district: string;
  lat: number;
  lng: number;
  type: "hydro" | "education" | "health" | "infrastructure" | "other";
}

interface NewProjectForm {
  name: string;
  description: string;
  district: string;
  lat: number;
  lng: number;
  type: "hydro" | "education" | "health" | "infrastructure" | "other";
}

type LayerType = "basic" | "districts" | "provinces";

interface MapUpdaterProps {
  center: LatLngExpression;
  zoom: number;
}

// Custom project marker icons based on type
const getProjectIcon = (type: string) => {
  const iconColors: Record<string, string> = {
    hydro: "#3b82f6", // blue
    education: "#f59e0b", // amber
    health: "#ef4444", // red
    infrastructure: "#8b5cf6", // purple
    other: "#6b7280", // gray
  };

  const iconEmojis: Record<string, string> = {
    hydro: "⚡",
    education: "🎓",
    health: "🏥",
    infrastructure: "🏗️",
    other: "📍",
  };

  const color = iconColors[type] || iconColors.other;
  const emoji = iconEmojis[type] || iconEmojis.other;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: markerDrop 0.6s ease-out, markerBounce 0.3s ease-out 0.6s;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
        ">${emoji}</span>
      </div>
      <style>
        @keyframes markerDrop {
          0% {
            transform: translateY(-200px) rotate(-45deg);
            opacity: 0;
          }
          60% {
            transform: translateY(10px) rotate(-45deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0) rotate(-45deg);
          }
        }
        @keyframes markerBounce {
          0%, 100% {
            transform: translateY(0) rotate(-45deg);
          }
          50% {
            transform: translateY(-10px) rotate(-45deg);
          }
        }
      </style>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const NepalMap: React.FC = () => {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Hydro Project A",
      description: "Renewable energy",
      district: "Kathmandu",
      lat: 27.7172,
      lng: 85.324,
      type: "hydro",
    },
    {
      id: 2,
      name: "School Building",
      description: "Education infrastructure",
      district: "Pokhara",
      lat: 28.2096,
      lng: 83.9856,
      type: "education",
    },
  ]);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>("districts");
  const [showAddProject, setShowAddProject] = useState<boolean>(false);
  const [newProject, setNewProject] = useState<NewProjectForm>({
    name: "",
    description: "",
    district: "",
    lat: 27.7172,
    lng: 85.324,
    type: "other",
  });
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([
    28.3949, 84.124,
  ]);
  const [mapZoom, setMapZoom] = useState<number>(7.5);

  // Load GeoJSON based on selected layer
  useEffect(() => {
    const loadGeoJSON = async (): Promise<void> => {
      try {
        let fileName = "";
        switch (selectedLayer) {
          case "basic":
            fileName = "nepal-acesmndr.geojson";
            break;
          case "districts":
            fileName = "nepal-with-districts-acesmndr.geojson";
            break;
          case "provinces":
            fileName = "nepal-with-provinces-acesmndr.geojson";
            break;
          default:
            fileName = "nepal-with-districts-acesmndr.geojson";
        }

        fileName = "nepal-with-provinces-acesmndr.geojson";

        // In your Next.js app, place the GeoJSON files in the public folder
        // and fetch them like this:
        const response = await fetch(`/${fileName}`);
        const data: FeatureCollection = await response.json();
        setGeoData(data);

        console.log(`Loaded: ${fileName}`);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadGeoJSON();
  }, [selectedLayer]);

  const onEachFeature = (
    feature: Feature<Geometry, any>,
    layer: L.Layer
  ): void => {
    if (feature.properties) {
      const popupContent = Object.entries(feature.properties)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join("<br/>");
      (layer as L.Path).bindPopup(popupContent);
    }

    (layer as L.Path).on({
      mouseover: (e: L.LeafletMouseEvent) => {
        (e.target as L.Path).setStyle({
          weight: 3,
          color: "#666",
          fillOpacity: 0.7,
        });
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        (e.target as L.Path).setStyle({
          weight: 2,
          color: "#2563eb",
          fillOpacity: 0.6,
        });
      },
    });
  };

  const geoJSONStyle: L.PathOptions = {
    color: "#2563eb",
    weight: 2,
    opacity: 1,
    fillColor: "#93c5fd",
    fillOpacity: 0.6,
  };

  const handleAddProject = (): void => {
    const project: Project = {
      id: Date.now(),
      ...newProject,
    };
    setProjects([...projects, project]);
    setShowAddProject(false);
    setNewProject({
      name: "",
      description: "",
      district: "",
      lat: 27.7172,
      lng: 85.324,
      type: "other",
    });
  };

  const handleDeleteProject = (id: number): void => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleProjectClick = (project: Project): void => {
    setMapCenter([project.lat, project.lng]);
    setMapZoom(12);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md p-2">
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          Nepal District Map - Project Locator
        </h1>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Layer Selection */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">
              Map Layer:
            </label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value as LayerType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">Basic Nepal</option>
              <option value="districts">With Districts</option>
              <option value="provinces">With Provinces</option>
            </select>
          </div>

          {/* Add Project Button */}
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            {showAddProject ? "Cancel" : "+ Add Project"}
          </button>

          {/* Project Count */}
          <div className="ml-auto text-xs text-gray-600">
            Total Projects:{" "}
            <span className="font-semibold">{projects.length}</span>
          </div>
        </div>

        {/* Add Project Form */}
        {showAddProject && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold mb-2 text-gray-800">
              Add New Project
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              />
              <input
                type="text"
                placeholder="District"
                value={newProject.district}
                onChange={(e) =>
                  setNewProject({ ...newProject, district: e.target.value })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              />
              <select
                value={newProject.type}
                onChange={(e) =>
                  setNewProject({ ...newProject, type: e.target.value as any })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              >
                <option value="hydro">⚡ Hydro Power</option>
                <option value="education">🎓 Education</option>
                <option value="health">🏥 Health</option>
                <option value="infrastructure">🏗️ Infrastructure</option>
                <option value="other">📍 Other</option>
              </select>
              <input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={newProject.lat}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    lat: parseFloat(e.target.value),
                  })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={newProject.lng}
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    lng: parseFloat(e.target.value),
                  })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-gray-800"
              />
              <textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2 placeholder:text-gray-400 text-gray-800"
                rows={2}
              />
              <button
                onClick={handleAddProject}
                disabled={!newProject.name || !newProject.district}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed md:col-span-2"
              >
                Add Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map and Sidebar Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            maxBounds={[
              [26.3, 80.0],
              [30.5, 88.3],
            ]}
            maxBoundsViscosity={1.0}
            minZoom={7.5}
            maxZoom={13}
            style={{
              height: "100%",
              width: "100%",
              backgroundColor: "transparent",
            }}
            className="z-0"
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
            dragging={true}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {/* Only show base layer when GeoJSON is not loaded */}
            {!geoData && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {geoData && (
              <GeoJSON
                data={geoData}
                style={geoJSONStyle}
                onEachFeature={onEachFeature}
              />
            )}

            {projects.map((project) => (
              <Marker
                key={project.id}
                position={[project.lat, project.lng]}
                icon={getProjectIcon(project.type)}
                eventHandlers={{
                  mouseover: (e) => {
                    const marker = e.target;
                    const tooltip = L.tooltip({
                      permanent: false,
                      direction: "top",
                      className: "custom-tooltip",
                      offset: [0, -20],
                    })
                      .setContent(
                        `
                        <div style="
                          background: white;
                          padding: 8px 12px;
                          border-radius: 8px;
                          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                          border: 2px solid ${
                            project.type === "hydro"
                              ? "#3b82f6"
                              : project.type === "education"
                              ? "#f59e0b"
                              : project.type === "health"
                              ? "#ef4444"
                              : project.type === "infrastructure"
                              ? "#8b5cf6"
                              : "#6b7280"
                          };
                          font-family: system-ui, -apple-system, sans-serif;
                        ">
                          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${
                            project.name
                          }</div>
                          <div style="font-size: 12px; color: #666; margin-bottom: 2px;">📍 ${
                            project.district
                          }</div>
                          <div style="font-size: 11px; color: #888;">${
                            project.description
                          }</div>
                        </div>
                      `
                      )
                      .setLatLng([project.lat, project.lng]);
                    marker.bindTooltip(tooltip).openTooltip();
                  },
                  mouseout: (e) => {
                    e.target.closeTooltip();
                  },
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      District: {project.district}
                    </p>
                    <p className="text-sm mb-2">{project.description}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Type: {project.type}
                    </p>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar - Project List */}
        <div className="w-64 bg-white shadow-lg overflow-y-auto p-3">
          <h2 className="text-lg font-bold mb-3 text-gray-800">
            Projects List
          </h2>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-xs">
              No projects added yet. Click &quot;Add Project&quot; to begin.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-2 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <h3 className="font-semibold text-sm text-gray-800">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {project.type === "hydro" && "⚡"}
                    {project.type === "education" && "🎓"}
                    {project.type === "health" && "🏥"}
                    {project.type === "infrastructure" && "🏗️"}
                    {project.type === "other" && "📍"} {project.district}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {project.description}
                  </p>
                  <div className="text-xs text-gray-400 mt-1">
                    Lat: {project.lat.toFixed(4)}, Lng: {project.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NepalMap;
