const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/predict-price", async (req, res) => {
  try {
    const response = await axios.post("http://127.0.0.1:5001/predict", {
      Location: req.body.location,
      Type: req.body.type,
      Bedrooms: Number(req.body.bedrooms),
      Bathrooms: Number(req.body.bathrooms),
      Salons: Number(req.body.salons),
      Kitchens: Number(req.body.kitchens),
      "Area (m²)": Number(req.body.area),
      Floor: Number(req.body.floor),
      "Year Built": Number(req.body.yearBuilt),
      Condition: req.body.condition,
      "Proximity to Amenities (m)": Number(req.body.proximityToAmenities)
    });

    res.json({
      predictedPrice: response.data.price
    });

  } catch (error) {
    console.error("Prediction error:", error.message);
    res.status(500).json({
      message: "Prediction failed"
    });
  }
});

module.exports = router;