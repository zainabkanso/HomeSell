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
        validateStatus: () => true,
      },
    );

    const contentType = String(
      response.headers["content-type"] || "",
    );

    if (!contentType.includes("application/json")) {
      console.error(
        "AI PREDICTION ERROR: Non-JSON response received from AI service.",
      );

      return res.status(502).json({
        message:
          "AI service returned an invalid response. Check AI_SERVICE_URL and that the AI Render service is running.",
      });
    }

    if (response.status >= 400) {
      return res.status(502).json({
        message:
          response.data?.message ||
          "Unable to obtain the price prediction",
        error: response.data?.error,
      });
    }

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
