// importLocationsFromCSV.js
// npm install mongoose csv-parser dotenv

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// --- MongoDB Schema ---
const LocationSchema = new mongoose.Schema({
  region: String,
  district: String,
  ward: String,
  street: String,
  coordinates: { type: [Number], default: undefined }, // optional
});

const Location = mongoose.model("Location", LocationSchema);

// --- Path to CSV folder ---
const CSV_FOLDER = path.join(process.cwd(), "location-files"); // folder with tanga.csv, dar.csv etc.

async function importCSVFiles() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const files = fs.readdirSync(CSV_FOLDER).filter(f => f.endsWith(".csv"));
  const locationDocs = [];

  for (const file of files) {
    const filePath = path.join(CSV_FOLDER, file);
    console.log(`Processing ${file}...`);

    const rows = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser({ separator: "\t" }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    for (const row of rows) {
      // Normalize field names in CSV
      const region = row["REGION"]?.trim();
      const district = row["DISTRICT"]?.trim();
      const ward = row["WARD"]?.trim();
      const street = row["STREET"]?.trim();

      if (region && district && ward && street) {
        locationDocs.push({ region, district, ward, street });
      }
    }
  }

  console.log(`Prepared ${locationDocs.length} location documents.`);

  // Insert into MongoDB
  await Location.deleteMany({}); // optional: clear old data
  await Location.insertMany(locationDocs);

  console.log("CSV location data imported into MongoDB successfully!");
  await mongoose.disconnect();
}

importCSVFiles().catch(err => console.error(err));
