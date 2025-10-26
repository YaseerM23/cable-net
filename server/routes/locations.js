const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const upload = require("../middleware/upload");
// const Admin = require("./models/Admin");
const Admin = require("../server");

// Get all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find()
      .populate("serviceName")
      .populate("serviceType");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get locations by service type (for filtering)
router.get("/filter/service-type/:serviceTypeId", async (req, res) => {
  try {
    const locations = await Location.find({
      serviceType: req.params.serviceTypeId,
    })
      .populate("serviceName")
      .populate("serviceType");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get location by ID
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate("serviceName")
      .populate("serviceType");
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new location
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Build location data
    const locationData = {
      serviceName: req.body.serviceName,
      serviceType: req.body.serviceType,
      notes: req.body.notes || "",
      coordinates: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      },
    };

    // Add image path if uploaded
    if (req.file) {
      locationData.image = `/uploads/${req.file.filename}`;
    }

    const location = new Location(locationData);
    const savedLocation = await location.save();
    const populatedLocation = await Location.findById(savedLocation._id)
      .populate("serviceName")
      .populate("serviceType");

    res.status(201).json(populatedLocation);
  } catch (error) {
    // Clean up uploaded file if validation fails
    if (req.file) {
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// Update location
router.put("/:id", async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("serviceName")
      .populate("serviceType");
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete location
router.delete("/:id/:adminId", async (req, res) => {
  try {
    const { id, adminId } = req.params;

    // 1️⃣ Find and delete the location
    const deletedLocation = await Location.findOneAndDelete({ _id: id });

    if (!deletedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    // 2️⃣ Extract coordinates from deleted location
    const { latitude, longitude } = deletedLocation.coordinates;

    console.log("latitude, longitude", latitude, longitude);

    // 3️⃣ Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin || !admin.geojson) {
      return res.status(404).json({ message: "Admin or geojson not found" });
    }

    // 4️⃣ Remove that specific coordinate from admin.geojson.features (if it's a FeatureCollection)
    if (
      admin.geojson.type === "FeatureCollection" &&
      Array.isArray(admin.geojson.features)
    ) {
      // console.log("INside If statement : ", admin.geojson.features);

      admin.geojson.features = admin.geojson.features.filter((feature) => {
        const { longitude: lng, latitude: lat } = feature.coordinates;

        if (lng === longitude && lat === latitude)
          console.log("Same Got : ", deletedLocation);

        return !(lng === longitude && lat === latitude);
      });
    }

    // 5️⃣ Save admin document
    await admin.save();

    res.json({
      message: "Location deleted and geojson updated successfully",
      updatedUser: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        geojson: admin.geojson,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments();
    const Service = require("../models/Service");
    const ServiceType = require("../models/ServiceType");

    const totalServices = await Service.countDocuments();
    const totalServiceTypes = await ServiceType.countDocuments();

    res.json({
      totalLocations,
      totalServices,
      totalServiceTypes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
