const express = require("express");
const axios = require("axios");

const router = express.Router();

const mapPredictionPayload = (body) => ({
  Location: body.location,
  Type: body.type,
  Bedrooms: Number(body.bedrooms),
  Bathrooms: Number(body.bathrooms),
  Salons: Number(body.salons),
  Kitchens: Number(body.kitchens),
  "Area (m²)": Number(body.area),
  Floor: Number(body.floor),
  "Year Built": Number(body.yearBuilt),
  Condition: body.condition,
  "Proximity to Amenities (m)": Number(body.proximityToAmenities),
});

router.post("/predict-price", async (req, res) => {
  try {
    const aiBaseUrl = process.env.AI_SERVICE_URL;

    if (!aiBaseUrl) {
      return res.status(500).json({
        message: "AI service URL is not configured",
      });
    }

    const response = await axios.post(
      `${aiBaseUrl.replace(/\/$/, "")}/predict`,
      mapPredictionPayload(req.body),
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      predictedPrice: response.data.price,
    });
  } catch (error) {
    console.error(
      "AI PREDICTION ERROR:",
      error.response?.data || error.message,
    );

    return res.status(502).json({
      message: "Unable to obtain the price prediction",
      error:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message,
    });
  }
});

module.exports = router;
