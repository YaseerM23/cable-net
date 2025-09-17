import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import NetworkMap from "./pages/NetworkMap";
import Locations from "./pages/Locations";
import Services from "./pages/Services";
import ServiceTypes from "./pages/ServiceTypes";
import "./App.css";
import MapProvider from "./components/Map/MapProvider";
import { SearchBox } from "./components/Map/AutoComplete";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/network-map"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MapProvider
                      overlay={
                        <>
                          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg px-4">
                            <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                              <SearchBox />
                            </div>
                          </div>
                        </>
                      }
                    >
                      <NetworkMap />
                    </MapProvider>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Locations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Services />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-types"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceTypes />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
