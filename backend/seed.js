/**
 * seed.js
 *
 * Usage: node seed.js
 *
 * - Small seed (Option B):
 *    10 physiotherapists
 *    15 members
 * - default password: password123
 *
 * - PT profiles include realistic fields but no profile images.
 */

import mongoose from "mongoose";
import faker from "faker";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import path from "path";

// Models (adjust paths if you place this inside backend/)
import User from "./src/models/User.js";
import Clinic from "./src/models/Clinic.js";
import Appointment from "./src/models/Appointment.js";
import Conversation from "./src/models/Conversation.js";
import Message from "./src/models/Message.js";
import ForumSub from "./src/models/ForumSub.js";
import Post from "./src/models/Post.js";
import Comment from "./src/models/Comment.js";
import Promotion from "./src/models/Promotion.js";
import Review from "./src/models/Review.js";


dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI in your environment.");
  process.exit(1);
}

// Connect
await mongoose.connect(MONGO_URI, { dbName: process.env.DB_NAME || undefined });
console.log("MongoDB connected.");

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const SALT_ROUNDS = 10;

// Small option counts
const NUM_PTS = 10;
const NUM_MEMBERS = 15;
const NUM_FORUM_SUBS = 12;
const NUM_POSTS = 30;
const NUM_COMMENTS = 60;
const NUM_CONVERSATIONS = 8;
const NUM_MESSAGES = 60;
const NUM_REVIEWS = 20;
const NUM_PROMOTIONS = 10;
const NUM_CLINICS = 6;
const NUM_APPOINTMENTS = 25;

function randLicenseNumber() {
  // Example MCT ####
  return `MCT${String(Math.floor(1000 + Math.random() * 9000))}`;
}

function sampleWorkingHours() {
  // Choose a few weekdays and assign simple slots
  const possible = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 days
  const chosen = faker.helpers.shuffle(possible).slice(0, count);
  return chosen.map((day) => {
    const fromHour = 8 + Math.floor(Math.random() * 4); // 8-11
    const toHour = 16 + Math.floor(Math.random() * 3); // 16-18
    return {
      dayOfWeek: day,
      from: `${String(fromHour).padStart(2, "0")}:00`,
      to: `${String(toHour).padStart(2, "0")}:00`,
      isAvailable: true,
    };
  });
}

function sampleServices() {
  const svc = [
    { name: "Initial Assessment", duration: 60, price: 25000 },
    { name: "Follow-up Session", duration: 45, price: 20000 },
    { name: "Home Exercise Plan", duration: 30, price: 15000 },
    { name: "Manual Therapy", duration: 60, price: 30000 },
  ];
  const count = 1 + Math.floor(Math.random() * svc.length);
  return faker.helpers.shuffle(svc).slice(0, count);
}

function sampleEducation() {
  return [
    {
      institution: faker.company.companyName(),
      degree: "Bachelor of Physiotherapy",
      field: "Physiotherapy",
      startYear: String(2010 + Math.floor(Math.random() * 6)),
      endYear: String(2014 + Math.floor(Math.random() * 6)),
      certificateUrl: null,
    },
  ];
}

function sampleWorkExperience() {
  return [
    {
      institution: faker.company.companyName(),
      position: "Senior Physiotherapist",
      startDate: new Date(2016, 0, 1),
      endDate: null,
      current: true,
      description: faker.lorem.sentences(2),
    },
  ];
}

function sampleLanguages() {
  const langs = ["English", "Swahili"];
  return langs.map((l) => ({ language: l, proficiency: "Fluent" }));
}

function randomRegionDistrict() {
  // Lightweight realistic-ish Tanzania-like data
  const regions = [
    "DAR-ES-SALAAM",
    "ARUSHA",
    "KILIMANJARO",
    "MOROGORO",
    "MBEYA",
    "MANYARA",
    "MARA",
    "MWANZA",
    "TANGA",
    "DODOMA",
  ];
  const region = randomItem(regions);
  const district = `${faker.address.city()} District`;
  const ward = faker.address.county();
  const street = faker.address.streetName();
  return { region, district, ward, street };
}

function makeGeoPoint() {
  // Use faker to generate lat/lng in Tanzania-ish range (approx)
  // Tanzania approx lat: -11 to +1, lng: 29 to 41
  const lat = parseFloat((-11 + Math.random() * 12).toFixed(6));
  const lng = parseFloat((29 + Math.random() * 12).toFixed(6));
  return [lng, lat];
}

async function seed() {
  try {
    console.log("Clearing collections...");
    await Promise.all([
      User.deleteMany(),
      Clinic.deleteMany(),
      Appointment.deleteMany(),
      ForumSub.deleteMany(),
      Post.deleteMany(),
      Comment.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
      Promotion.deleteMany(),
      Review.deleteMany(),
    ]);
    console.log("Collections cleared.");

    // Pre-hash default password
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    const users = [];

    // Create physiotherapists
    console.log(`Creating ${NUM_PTS} physiotherapists...`);
    for (let i = 0; i < NUM_PTS; i++) {
      const name = faker.name.findName();
      const email = `pt${i + 1}@fiziomidia.test`;
      const phone = faker.phone.phoneNumberFormat();
      const { region, district, ward, street } = randomRegionDistrict();
      const coords = makeGeoPoint();

      const ptProfile = {
        title: "Physiotherapist",
        institution: faker.company.companyName(),
        isPrivatePractice: faker.datatype.boolean(),
        clinicIds: [],
        licenseImageUrl: null,
        licenseNumber: randLicenseNumber(),
        licenseVerified: faker.datatype.boolean(),
        licenseVerificationStatus: faker.helpers.randomize(["pending", "approved", "rejected"]),
        licenseVerificationNotes: null,
        licenseSubmittedAt: faker.date.past(3),
        bio: faker.lorem.sentences(2),
        speciality: faker.helpers.shuffle(["Orthopedics", "Neurology", "Sports", "Pediatrics"]).slice(0, 2),
        yearsOfExperience: faker.datatype.number({ min: 1, max: 20 }),
        workingHours: sampleWorkingHours(),
        promotionActiveUntil: null,
        promotionType:"sponsored",
        promotionViews: 0,
        promotionClicks: 0,
        education: sampleEducation(),
        workExperience: sampleWorkExperience(),
        services: sampleServices(),
        languages: sampleLanguages(),
        gallery: [],
        ratings: { average: parseFloat((2 + Math.random() * 3).toFixed(2)), count: faker.datatype.number({ min: 1, max: 100 }) },
        availability: { isAcceptingNewPatients: faker.datatype.boolean(), nextAvailableDate: null },
        professionalMemberships: [],
        documents: [],
        changeLogs: [],
      };

      const userDoc = await User.create({
        email,
        passwordHash: hashedPassword,
        role: "physiotherapist",
        fullName: name,
        phone,
        profileImageUrl: null, // per your request
        ptProfile,
        bio: faker.lorem.sentence(),
        createdAt: new Date(),
        lastLogin: faker.date.recent(30),
        isLoggedIn: false,
        isActive: true,
        refreshTokens: [],
        appointments: [],
        notifications: [],
        location: {
          type: "Point",
          coordinates: coords,
          region,
          district,
          ward,
          street,
        },
      });

      users.push(userDoc);
    }
    console.log("Physiotherapists created.");

    // Create members
    console.log(`Creating ${NUM_MEMBERS} members...`);
    for (let i = 0; i < NUM_MEMBERS; i++) {
      const name = faker.name.findName();
      const email = `member${i + 1}@fiziomidia.test`;
      const phone = faker.phone.phoneNumberFormat();
      const { region, district, ward, street } = randomRegionDistrict();
      const coords = makeGeoPoint();

      const userDoc = await User.create({
        email,
        passwordHash: hashedPassword,
        role: "member",
        fullName: name,
        phone,
        profileImageUrl: null,
        ptProfile: null,
        bio: faker.lorem.sentence(),
        createdAt: new Date(),
        lastLogin: faker.date.recent(60),
        isLoggedIn: false,
        isActive: true,
        refreshTokens: [],
        appointments: [],
        notifications: [],
        location: {
          type: "Point",
          coordinates: coords,
          region,
          district,
          ward,
          street,
        },
      });

      users.push(userDoc);
    }
    console.log("Members created.");

    // Separate lists
    const pts = users.filter((u) => u.role === "physiotherapist");
    const members = users.filter((u) => u.role === "member");

    // Create Clinics (attach to random PT owners)
    console.log(`Creating ${NUM_CLINICS} clinics...`);
    const clinics = [];
    for (let i = 0; i < NUM_CLINICS; i++) {
      const owner = randomItem(pts);
      const coords = makeGeoPoint();
      const clinic = await Clinic.create({
        name: `${faker.company.companyName()} Clinic`,
        address: faker.address.streetAddress(),
        location: { type: "Point", coordinates: coords },
        contactPhone: faker.phone.phoneNumber(),
        ownerUserId: owner._id,
      });
      clinics.push(clinic);

      // push clinic id to PT's ptProfile.clinicIds
      owner.ptProfile = owner.ptProfile || {};
      owner.ptProfile.clinicIds = owner.ptProfile.clinicIds || [];
      owner.ptProfile.clinicIds.push(clinic._id);
      await owner.save();
    }
    console.log("Clinics created.");

    // Create Appointments
    console.log(`Creating ${NUM_APPOINTMENTS} appointments...`);
    const appointments = [];
    for (let i = 0; i < NUM_APPOINTMENTS; i++) {
      const pt = randomItem(pts);
      const member = randomItem(members);
      const clinic = randomItem(clinics);
      const requestedAt = randomDate(new Date(2024, 0, 1), new Date());
      const scheduledAt = randomDate(new Date(), new Date(2025, 11, 31));
      const appt = await Appointment.create({
        requester: member._id,
        pt: pt._id,
        clinic: clinic ? clinic._id : null,
        requestedAt,
        scheduledAt,
        durationMinutes: randomItem([30, 45, 60]),
        status: randomItem(["pending", "accepted", "declined", "cancelled", "completed"]),
        notes: faker.lorem.sentence(),
        adminNotes: "",
      });
      appointments.push(appt);
    }
    console.log("Appointments created.");

    // Create ForumSubs (realistic)
    console.log(`Creating ${NUM_FORUM_SUBS} forum subreddits...`);
    const forumTopics = [
      { title: "Neurological Rehab", slug: "neurological-rehab", description: "Discussion and resources for neurological physiotherapy (stroke, spinal cord, brain injuries)." },
      { title: "Sports Injuries", slug: "sports-injuries", description: "Injury prevention, return-to-play protocols, and sports-specific rehab." },
      { title: "Pediatrics", slug: "pediatrics", description: "Child development, pediatric assessments and therapeutic interventions." },
      { title: "Geriatrics & Falls", slug: "geriatrics-falls", description: "Balance, falls prevention, and older-adult rehab strategies." },
      { title: "Orthopedics & Post-op", slug: "orthopedics-postop", description: "Post-operative care, joint replacements, and orthopaedic rehab." },
      { title: "Women's Health", slug: "womens-health", description: "Pelvic health, pregnancy-related pain, and women's wellness." },
      { title: "Electrotherapy & Modalities", slug: "electrotherapy", description: "TENS, ultrasound, and other physical agents — safe use and evidence." },
      { title: "Education & CPD", slug: "education-cpd", description: "Courses, CPD opportunities, and teaching resources." },
      { title: "Clinical Reasoning", slug: "clinical-reasoning", description: "Case discussions, assessment frameworks, and clinical decision-making." },
      { title: "Exercise Prescription", slug: "exercise-prescription", description: "Designing safe and effective exercise programs." },
      { title: "Community Health", slug: "community-health", description: "Outreach, public health physiotherapy and rural care." },
      { title: "Manual Therapy Techniques", slug: "manual-therapy", description: "Hands-on techniques, evidence and troubleshooting." },
    ];

    const forumSubs = [];
    for (const t of forumTopics) {
      const creator = randomItem(users);
      const f = await ForumSub.create({
        title: t.title,
        slug: t.slug,
        description: t.description,
        createdBy: creator._id,
        moderators: [creator._id],
        isPublic: true,
      });
      forumSubs.push(f);
    }
    console.log("Forum subs created.");

    // Create Posts
    console.log(`Creating ${NUM_POSTS} posts...`);
    const posts = [];
    for (let i = 0; i < NUM_POSTS; i++) {
      const author = randomItem(users);
      const sub = randomItem(forumSubs);
      const p = await Post.create({
        sub: sub._id,
        author: author._id,
        comments: [],
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(1),
        upvotes: [],
        downvotes: [],
      });
      posts.push(p);
    }
    console.log("Posts created.");

    // Create Comments
    console.log(`Creating ${NUM_COMMENTS} comments...`);
    const comments = [];
    for (let i = 0; i < NUM_COMMENTS; i++) {
      const author = randomItem(users);
      const post = randomItem(posts);
      const c = await Comment.create({
        post: post._id,
        author: author._id,
        content: faker.lorem.sentences(2),
        votes: faker.datatype.number({ min: 0, max: 20 }),
      });
      post.comments.push(c._id);
      await post.save();
      comments.push(c);
    }
    console.log("Comments created.");

    // Conversations & Messages
    console.log(`Creating ${NUM_CONVERSATIONS} conversations and ${NUM_MESSAGES} messages...`);
    const conversations = [];
    for (let i = 0; i < NUM_CONVERSATIONS; i++) {
      let a = randomItem(users);
      let b = randomItem(users);
      while (b._id.equals(a._id)) b = randomItem(users);
      const conv = await Conversation.create({
        participants: [a._id, b._id],
        lastMessage: null,
      });
      conversations.push(conv);
    }

    const messages = [];
    for (let i = 0; i < NUM_MESSAGES; i++) {
      const sender = randomItem(users);
      let receiver = randomItem(users);
      while (receiver._id.equals(sender._id)) receiver = randomItem(users);
      const message = await Message.create({
        sender: sender._id,
        receiver: receiver._id,
        content: faker.lorem.sentence(),
        read: faker.datatype.boolean(),
        attachments: [],
      });
      messages.push(message);

      // tie to a random conversation
      const conv = randomItem(conversations);
      conv.lastMessage = message._id;
      await conv.save();
    }
    console.log("Messages created.");

    // Promotions
    console.log(`Creating ${NUM_PROMOTIONS} promotions...`);
    for (let i = 0; i < NUM_PROMOTIONS; i++) {
      await Promotion.create({
        pt: randomItem(pts)._id,
        startAt: randomDate(new Date(2024, 0, 1), new Date()),
        endAt: randomDate(new Date(), new Date(2025, 11, 31)),
        status: randomItem(["pending", "active", "failed"]),
      });
    }
    console.log("Promotions created.");

    // Reviews
    console.log(`Creating ${NUM_REVIEWS} reviews...`);
    for (let i = 0; i < NUM_REVIEWS; i++) {
      await Review.create({
        reviewer: randomItem(members)._id,
        physiotherapist: randomItem(pts)._id,
        appointment: randomItem(appointments)?._id || null,
        rating: faker.datatype.number({ min: 1, max: 5 }),
        comment: faker.lorem.sentences(2),
      });
    }
    console.log("Reviews created.");

    console.log("Seeding complete. Exiting.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
