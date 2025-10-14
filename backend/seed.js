import mongoose from "mongoose";
import faker from "faker";
import dotenv from "dotenv";


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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected"));

// Utility functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seed() {
  try {
    // Clear collections
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

    // 1. Create Users
    const users = [];

    // Admin
    users.push(
      await User.create({
        email: "admin@fiziomidia.com",
        passwordHash: "hashedpassword",
        role: "admin",
        fullName: "Admin User",
      })
    );

    // Physiotherapists
    for (let i = 0; i < 5; i++) {
      users.push(
        await User.create({
          email: `pt${i}@fiziomidia.com`,
          passwordHash: "hashedpassword",
          role: "physiotherapist",
          fullName: faker.name.findName(),
          phone: faker.phone.phoneNumber(),
          ptProfile: {
            institution: faker.company.companyName(),
            isPrivatePractice: faker.datatype.boolean(),
            bio: faker.lorem.sentences(2),
            specialties: faker.helpers.shuffle(["Orthopedics", "Neurology", "Sports", "Pediatrics"]).slice(0, 2),
            yearsOfExperience: faker.datatype.number({ min: 1, max: 20 }),
            workingHours: [
              { dayOfWeek: 1, from: "09:00", to: "17:00" },
              { dayOfWeek: 3, from: "10:00", to: "16:00" },
            ],
          },
        })
      );
    }

    // Members
    for (let i = 0; i < 10; i++) {
      users.push(
        await User.create({
          email: `member${i}@fiziomidia.com`,
          passwordHash: "hashedpassword",
          role: "member",
          fullName: faker.name.findName(),
          phone: faker.phone.phoneNumber(),
        })
      );
    }

    console.log("Users created.");

    // Separate users by role
    const admins = users.filter((u) => u.role === "admin");
    const pts = users.filter((u) => u.role === "physiotherapist");
    const members = users.filter((u) => u.role === "member");

    // 2. Create Clinics
    const clinics = [];
    for (let i = 0; i < 5; i++) {
      clinics.push(
        await Clinic.create({
          name: faker.company.companyName(),
          address: faker.address.streetAddress(),
          location: { type: "Point", coordinates: [faker.address.longitude(), faker.address.latitude()] },
          contactPhone: faker.phone.phoneNumber(),
          ownerUserId: randomItem(pts)._id,
        })
      );
    }

    console.log("Clinics created.");

    // 3. Create Appointments
    const appointments = [];
    for (let i = 0; i < 10; i++) {
      const pt = randomItem(pts);
      const member = randomItem(members);
      appointments.push(
        await Appointment.create({
          requester: member._id,
          pt: pt._id,
          clinic: randomItem(clinics)._id,
          requestedAt: randomDate(new Date(2025, 0, 1), new Date()),
          scheduledAt: randomDate(new Date(), new Date(2025, 11, 31)),
          durationMinutes: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
          status: randomItem(["pending", "accepted", "declined", "cancelled", "completed"]),
          notes: faker.lorem.sentence(),
          adminNotes: faker.lorem.sentence(),
        })
      );
    }

    console.log("Appointments created.");

    // 4. Create ForumSubs
    const forumSubs = [];
    for (let i = 0; i < 3; i++) {
      const createdBy = randomItem(users);
      forumSubs.push(
        await ForumSub.create({
          title: `Forum ${i + 1}`,
          slug: `forum-${i + 1}`,
          description: faker.lorem.sentence(),
          createdBy: createdBy._id,
          moderators: [createdBy._id],
          isPublic: true,
        })
      );
    }

    console.log("ForumSubs created.");

    // 5. Create Posts
    const posts = [];
    for (let i = 0; i < 10; i++) {
      const author = randomItem(users);
      posts.push(
        await Post.create({
          sub: randomItem(forumSubs)._id,
          author: author._id,
          title: faker.lorem.sentence(),
          body: faker.lorem.paragraph(),
          upvotes: [],
          downvotes: [],
        })
      );
    }

    console.log("Posts created.");

    // 6. Create Comments
    const comments = [];
    for (let i = 0; i < 20; i++) {
      const author = randomItem(users);
      comments.push(
        await Comment.create({
          post: randomItem(posts)._id,
          author: author._id,
          content: faker.lorem.sentences(2),
          votes: faker.datatype.number({ min: 0, max: 10 }),
        })
      );
    }

    console.log("Comments created.");

    // 7. Create Conversations
    const conversations = [];
    for (let i = 0; i < 5; i++) {
      const participant1 = randomItem(users);
      let participant2 = randomItem(users);
      while (participant2._id.equals(participant1._id)) participant2 = randomItem(users);

      conversations.push(
        await Conversation.create({
          participants: [participant1._id, participant2._id],
          lastMessage: null, // updated later
        })
      );
    }

    console.log("Conversations created.");

    // 8. Create Messages
    const messages = [];
    for (let i = 0; i < 15; i++) {
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

      // Optionally link to conversation
      const conv = randomItem(conversations);
      conv.lastMessage = message._id;
      await conv.save();
    }

    console.log("Messages created.");

    // 9. Create Promotions
    const promotions = [];
    for (let i = 0; i < 5; i++) {
      promotions.push(
        await Promotion.create({
          pt: randomItem(pts)._id,
          startAt: randomDate(new Date(2025, 0, 1), new Date()),
          endAt: randomDate(new Date(), new Date(2025, 11, 31)),
          status: randomItem(["pending", "active", "failed"]),
        })
      );
    }

    console.log("Promotions created.");

    // 10. Create Reviews
    const reviews = [];
    for (let i = 0; i < 10; i++) {
      const reviewer = randomItem(members);
      const physiotherapist = randomItem(pts);
      reviews.push(
        await Review.create({
          reviewer: reviewer._id,
          physiotherapist: physiotherapist._id,
          appointment: randomItem(appointments)._id,
          rating: faker.datatype.number({ min: 1, max: 5 }),
          comment: faker.lorem.sentences(2),
        })
      );
    }

    console.log("Reviews created.");

    console.log("Database seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();