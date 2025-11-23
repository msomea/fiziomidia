// importLocationsFromCSV.js
// npm install mongoose csv-parser dotenv

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB schema
const LocationSchema = new mongoose.Schema({
  region: { type: String, index: true },
  district: { type: String, index: true },
  ward: { type: String, index: true },
  street: { type: String, index: true },
  places: String,
});

const Location = mongoose.model("Location", LocationSchema);

const CSV_FOLDER = path.join(process.cwd(), "location-files");

async function importCSVFiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const files = fs
      .readdirSync(CSV_FOLDER)
      .filter((f) => f.toLowerCase().endsWith(".csv"));

    const allDocs = [];

    for (const file of files) {
      const filePath = path.join(CSV_FOLDER, file);

      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser({ separator: ",", skipLines: 0 }))
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });

      if (rows.length === 0) {
        console.warn(`⚠️ No rows found in ${file}`);
        continue;
      }

      for (const row of rows) {
        const region = row["REGION"]?.trim();
        const district = row["DISTRICT"]?.trim();
        const ward = row["WARD"]?.trim();
        const street = row["STREET"]?.trim();
        const places = row["PLACES"]?.trim();

        if (region && district && ward && street) {
          allDocs.push({
            region,
            district,
            ward,
            street,
            places: places || null,
          });
        }
      }

      console.log(`✅ Processed ${rows.length} rows from ${file}`);
    }

    console.log(`🟢 Total documents to import: ${allDocs.length}`);

    if (allDocs.length > 0) {
      // Optional: remove duplicates before insert
      const uniqueDocs = Array.from(
        new Map(
          allDocs.map((d) => [
            `${d.region}|${d.district}|${d.ward}|${d.street}`,
            d,
          ])
        ).values()
      );

      await Location.deleteMany({});
      await Location.insertMany(uniqueDocs);
      console.log(
        `🎉 Successfully imported ${uniqueDocs.length} unique location documents!`
      );
    } else {
      console.log("⚠️ No valid data found to import.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error importing locations:", err);
  }
}

importCSVFiles();
