// One-off script: create pre-verified test users for smoke testing.
// Usage: node scripts/createTestUsers.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { User } = await import("../src/models/User.js").then((m) => ({
  User: m.default,
}));

const SALT_ROUNDS = 10;
const TEST_PASSWORD = "TestPass123!";

const users = [
  {
    email: "test.member@fiziomidia.test",
    fullName: "Test Member",
    role: "member",
    language: "en",
  },
  {
    email: "test.pt@fiziomidia.test",
    fullName: "Test Physiotherapist",
    role: "physiotherapist",
    language: "en",
    physioApproval: true,
    ptProfile: {
      title: "Mr.",
      institution: "University of Dodoma",
      isPrivatePractice: true,
      licenses: [
        {
          licenseNumber: "TEST-PT-001",
          licenseFileUrl: "https://example.com/test-license.pdf",
          licenseFilePublicId: "test/license",
          licenseFileType: "application/pdf",
          verificationStatus: "approved",
          verified: true,
          submittedAt: new Date(),
        },
      ],
      speciality: ["Orthopedics", "Sports Medicine"],
      yearsOfExperience: 5,
      workingHours: [
        { dayOfWeek: "Monday", from: "08:00", to: "17:00", isAvailable: true },
        { dayOfWeek: "Tuesday", from: "08:00", to: "17:00", isAvailable: true },
        { dayOfWeek: "Wednesday", from: "08:00", to: "17:00", isAvailable: true },
        { dayOfWeek: "Thursday", from: "08:00", to: "17:00", isAvailable: true },
        { dayOfWeek: "Friday", from: "08:00", to: "16:00", isAvailable: true },
      ],
      services: [
        {
          name: "Initial Consultation",
          description: "First assessment and treatment plan",
          duration: 60,
          price: 50000,
        },
        {
          name: "Follow-up Session",
          description: "Ongoing treatment session",
          duration: 45,
          price: 35000,
        },
      ],
      languages: [{ language: "English", proficiency: "Fluent" }],
      availability: { isAcceptingNewPatients: true },
    },
  },
  {
    email: "test.admin@fiziomidia.test",
    fullName: "Test Admin",
    role: "admin",
    language: "en",
  },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "fiziomidia" });
  console.log("Connected to MongoDB");

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      existing.fullName = u.fullName;
      existing.role = u.role;
      existing.passwordHash = passwordHash;
      existing.isVerified = true;
      existing.isActive = true;
      existing.isBanned = false;
      existing.language = u.language;
      if (u.physioApproval !== undefined) existing.physioApproval = u.physioApproval;
      if (u.ptProfile) existing.ptProfile = u.ptProfile;
      await existing.save();
      console.log(`Updated: ${u.email} (role=${u.role})`);
    } else {
      await User.create({
        ...u,
        passwordHash,
        isVerified: true,
        isActive: true,
        isBanned: false,
        isLoggedIn: false,
        refreshTokens: [],
      });
      console.log(`Created: ${u.email} (role=${u.role})`);
    }
  }

  console.log("\n=== Test credentials ===");
  console.log(`Password for all: ${TEST_PASSWORD}`);
  users.forEach((u) => console.log(`  ${u.email}  (${u.role})`));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
