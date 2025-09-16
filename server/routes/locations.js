const express = require("express")
const router = express.Router()
const Location = require("../models/Location")

// Get all locations
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find().populate("serviceName").populate("serviceType")
    res.json(locations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get locations by service type (for filtering)
router.get("/filter/service-type/:serviceTypeId", async (req, res) => {
  try {
    const locations = await Location.find({ serviceType: req.params.serviceTypeId })
      .populate("serviceName")
      .populate("serviceType")
    res.json(locations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get location by ID
router.get("/:id", async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate("serviceName").populate("serviceType")
    if (!location) {
      return res.status(404).json({ message: "Location not found" })
    }
    res.json(location)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create new location
router.post("/", async (req, res) => {
  try {
    const location = new Location(req.body)
    const savedLocation = await location.save()
    const populatedLocation = await Location.findById(savedLocation._id).populate("serviceName").populate("serviceType")
    res.status(201).json(populatedLocation)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update location
router.put("/:id", async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("serviceName")
      .populate("serviceType")
    if (!location) {
      return res.status(404).json({ message: "Location not found" })
    }
    res.json(location)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Delete location
router.delete("/:id", async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id)
    if (!location) {
      return res.status(404).json({ message: "Location not found" })
    }
    res.json({ message: "Location deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get dashboard statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const totalLocations = await Location.countDocuments()
    const Service = require("../models/Service")
    const ServiceType = require("../models/ServiceType")

    const totalServices = await Service.countDocuments()
    const totalServiceTypes = await ServiceType.countDocuments()

    res.json({
      totalLocations,
      totalServices,
      totalServiceTypes,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
