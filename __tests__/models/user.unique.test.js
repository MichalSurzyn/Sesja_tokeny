import mongoose from "mongoose";
import User from "../../Models/User.js";

beforeEach(async () => {
  await mongoose.connect(process.env.URI || "mongodb://localhost:27017/test");
  await User.deleteMany({});
});

afterEach(async () => {
  await mongoose.connection.close();
});

describe("User Model Unique Email Test", () => {
  it("should not allow two users with the same email", async () => {
    const user1 = new User({
      first_name: "Jan",
      last_name: "Kowalski",
      email: "jan.kowalski@example.com",
      password: "Password123!",
      role: "0x01",
    });
    await user1.save();

    const user2 = new User({
      first_name: "Janek",
      last_name: "Kowalski",
      email: "jan.kowalski@example.com", // ten sam email
      password: "Password123!",
      role: "0x01",
    });

    let err;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe("MongoServerError"); // poprawka
    expect(err.message).toMatch(/duplicate key/i);
  });
});
