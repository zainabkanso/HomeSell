const express = require("express");
const router = express.Router();
const Home = require("../models/Home");

router.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Please write something.",
        homes: [],
      });
    }

    const parseNumber = (value) => {
      if (!value) return null;
      const normalized = value.toLowerCase().trim();
      if (normalized.endsWith("k")) {
        return Number(normalized.slice(0, -1)) * 1000;
      }
      return Number(normalized);
    };

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const text = message.toLowerCase();
    const query = {};
    let hasFilter = false;

    const locationMatch = text.match(/(?:in|at|near|around)\s+([a-z0-9\s,]+)/);
    if (locationMatch) {
      let locationText = locationMatch[1]
        .replace(
          /(?:under|above|over|less than|below|more than|with|max|up to).*$/g,
          "",
        )
        .replace(/,/g, " ")
        .trim();

      if (locationText) {
        const locationWords = locationText.split(/\s+/).filter(Boolean);
        query.location = {
          $regex: locationWords.map(escapeRegex).join(".*"),
          $options: "i",
        };
        hasFilter = true;
      }
    }

    const underMatch = text.match(
      /(?:under|less than|below|max|up to)\s+\$?(\d+(?:k)?)/,
    );
    if (underMatch) {
      const amount = parseNumber(underMatch[1]);
      if (!Number.isNaN(amount)) {
        query.price = { ...query.price, $lte: amount };
        hasFilter = true;
      }
    }

    const aboveMatch = text.match(
      /(?:above|over|more than|min)\s+\$?(\d+(?:k)?)/,
    );
    if (aboveMatch) {
      const amount = parseNumber(aboveMatch[1]);
      if (!Number.isNaN(amount)) {
        query.price = { ...query.price, $gte: amount };
        hasFilter = true;
      }
    }

    const bedroomMatch = text.match(/(\d+)\s*(?:bedroom|bedrooms|bd)/);
    if (bedroomMatch) {
      query.bedrooms = Number(bedroomMatch[1]);
      hasFilter = true;
    }

    const bathroomMatch = text.match(/(\d+)\s*(?:bathroom|bathrooms|ba)/);
    if (bathroomMatch) {
      query.bathrooms = Number(bathroomMatch[1]);
      hasFilter = true;
    }

    const areaUnderMatch = text.match(
      /area\s+(?:under|less than|below)\s+(\d+(?:k)?)/,
    );
    if (areaUnderMatch) {
      const amount = parseNumber(areaUnderMatch[1]);
      if (!Number.isNaN(amount)) {
        query.area = { ...query.area, $lte: amount };
        hasFilter = true;
      }
    }

    const areaAboveMatch = text.match(
      /area\s+(?:above|over|more than)\s+(\d+(?:k)?)/,
    );
    if (areaAboveMatch) {
      const amount = parseNumber(areaAboveMatch[1]);
      if (!Number.isNaN(amount)) {
        query.area = { ...query.area, $gte: amount };
        hasFilter = true;
      }
    }

    const keywordLocations = [
      "beirut",
      "rawshe",
      "rawsheh",
      "bourj hammoud",
      "sour",
      "batroun",
      "hazmieh",
      "achrafieh",
      "jal el dib",
    ];

    if (!hasFilter) {
      const foundLocation = keywordLocations.find((location) =>
        text.includes(location),
      );
      if (foundLocation) {
        query.location = {
          $regex: escapeRegex(foundLocation),
          $options: "i",
        };
        hasFilter = true;
      }
    }

    if (!hasFilter) {
      const titleLocationMatch = text.match(
        /(?:home|house|property|apartments?)\s+(?:named\s+|called\s+)?([a-z0-9\s]+)/,
      );
      if (titleLocationMatch) {
        const titleText = titleLocationMatch[1].trim();
        if (titleText) {
          const titleWords = titleText.split(/\s+/).filter(Boolean);
          query.$or = [
            {
              title: {
                $regex: titleWords.map(escapeRegex).join(".*"),
                $options: "i",
              },
            },
            {
              location: {
                $regex: titleWords.map(escapeRegex).join(".*"),
                $options: "i",
              },
            },
          ];
          hasFilter = true;
        }
      }
    }

    if (!hasFilter) {
      const searchWords = text.split(/\s+/).filter(Boolean);
      if (searchWords.length) {
        const regexString = searchWords.map(escapeRegex).join(".*");
        query.$or = [
          { title: { $regex: regexString, $options: "i" } },
          { location: { $regex: regexString, $options: "i" } },
        ];
        hasFilter = true;
      }
    }

    if (!hasFilter) {
      return res.json({
        reply:
          "I couldn’t understand that. Try: homes in beirut under 100000, homes near rawshe over 200000, or 3 bedrooms in sour.",
        homes: [],
      });
    }

    const homes = await Home.find(query).sort({ createdAt: -1 });

    res.json({
      reply: homes.length
        ? `I found ${homes.length} homes matching your request.`
        : "Sorry, I could not find homes matching your request.",
      homes,
    });
  } catch (error) {
    res.status(500).json({
      reply: "Something went wrong.",
      homes: [],
      error: error.message,
    });
  }
});

module.exports = router;
