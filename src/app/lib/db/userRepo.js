import { sql } from './postgresql';
const crypto = require('crypto');

const HASH_ITERATIONS = 10000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

function generateSalt() {
  return crypto.randomBytes(16).toString('base64');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('base64');
}

export const userRepo = {
  authenticate,
  register,
  checkEmailExists,
  getUserByEmail
};

async function authenticate(email, inputPassword) {
  try {
    // Fetch user by email
    const result = await sql`SELECT * FROM "User" WHERE email = ${email}`;
    const user = result[0];

    if (!user) {
      throw new Error("Invalid email");
    }

    // Hash input password with stored salt
    const inputHash = hashPassword(inputPassword, user.salt);

    if (inputHash !== user.password) {
      throw new Error("Invalid password");
    }

    if (!user.isActive) {
      throw new Error("User is not active");
    }

    // Return user object without sensitive fields
    const { password, salt, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

async function register(userData) {
  try {
    const { name, email, password, phone, role = 'coach' } = userData;

    // Check if email already exists
    const existingUser = await sql`SELECT id FROM "User" WHERE email = ${email}`;
    if (existingUser.length > 0) {
      throw new Error("Email already exists");
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    // Insert new user
    const result = await sql`
      INSERT INTO "User" (name, email, password, salt, phone, role, "isActive", "createdAt", "updatedAt")
      VALUES (${name}, ${email}, ${hashedPassword}, ${salt}, ${phone}, ${role}, true, NOW(), NOW())
      RETURNING id, name, email, phone, role, "isActive", "createdAt"
    `;

    const newUser = result[0];
    return newUser;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

async function checkEmailExists(email) {
  try {
    const result = await sql`SELECT id FROM "User" WHERE email = ${email}`;
    return result.length > 0;
  } catch (error) {
    console.error("Email check error:", error);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const result = await sql`SELECT * FROM "User" WHERE email = ${email}`;
    return result[0];
  } catch (error) {
    console.error("User fetch error:", error);
    throw error;
  }
}
