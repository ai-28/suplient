import { sql } from '../lib/db/postgresql';

const crypto = require('crypto');

function generateSalt() {
  return crypto.randomBytes(16).toString('base64');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');
}



async function seedUser() {
  // Create the enhanced User table for multi-role support
  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'coach', 'client')),
        "isActive" BOOLEAN DEFAULT true,
        "dateofBirth" DATE,
        "address" VARCHAR(255),
        "coachId" UUID REFERENCES "User"("id"),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_isActive ON "User"("isActive")`;

  // Insert a default admin user if it doesn't exist
  const existingAdmin = await sql`SELECT id FROM "User" WHERE email = 'admin@mentalcoach.com'`;

  if (existingAdmin.length === 0) {
    const salt = generateSalt();
    const hashedPassword = hashPassword("admin123", salt);

    await sql`
      INSERT INTO "User" (name, email, password, salt, role, phone, "isActive", "dateofBirth", "address", "coachId")
      VALUES ('Admin User', 'admin@mentalcoach.com', ${hashedPassword}, ${salt}, 'admin', '+1234567890', true, NULL, NULL, NULL)
    `;
    console.log('Default admin user created');
  } else {
    console.log('Admin user already exists');
  }

}
// Create Program table if it doesn't exist
export async function createProgramTable() {
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS "Program" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL DEFAULT 4,
      "coachId" UUID NOT NULL REFERENCES "User"(id),
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    // Create ProgramElement table for program elements
    await sql`
    CREATE TABLE IF NOT EXISTS "ProgramElement" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "programId" UUID NOT NULL REFERENCES "Program"(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('session', 'exercise', 'assessment', 'homework', 'content', 'task', 'message')),
      title VARCHAR(255) NOT NULL,
      week INTEGER NOT NULL,
      day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
      "scheduledTime" TIME DEFAULT '09:00:00',
      "elementData" JSONB, -- For additional element-specific data
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_programs_coachId ON "Program"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_elements_programId ON "ProgramElement"("programId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_program_elements_type ON "ProgramElement"(type)`;

    console.log('Program tables created successfully');
  } catch (error) {
    console.error('Error creating program tables:', error);
    throw error;
  }
}

export async function seedTask() {
  try {
    // Create Group table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "Group" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "memberCount" INTEGER DEFAULT 0,
        capacity INTEGER,
        frequency VARCHAR(50),
        duration VARCHAR(50),
        location VARCHAR(255),
        "focusArea" VARCHAR(255),
        "selectedMembers" UUID[] DEFAULT '{}',
        stage VARCHAR(20) DEFAULT 'upcoming' CHECK (stage IN ('upcoming', 'ongoing', 'completed', 'inactive')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;


    // Create Task table
    await sql`
      CREATE TABLE IF NOT EXISTS "Task" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "dueDate" TIMESTAMP,
        "taskType" VARCHAR(20) NOT NULL CHECK ("taskType" IN ('personal', 'client', 'group')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "clientId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "isRepetitive" BOOLEAN DEFAULT FALSE,
        "repetitiveFrequency" VARCHAR(20) CHECK ("repetitiveFrequency" IN ('daily', 'weekly', 'monthly')),
        "repetitiveCount" INTEGER CHECK ("repetitiveCount" > 0 AND "repetitiveCount" <= 50),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Session table
    await sql`
      CREATE TABLE IF NOT EXISTS "Session" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "sessionDate" TIMESTAMP NOT NULL,
        "sessionTime" TIME NOT NULL,
        duration INTEGER DEFAULT 60 CHECK (duration > 0 AND duration <= 480),
        "sessionType" VARCHAR(20) NOT NULL CHECK ("sessionType" IN ('individual', 'group')),
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "clientId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        location VARCHAR(255),
        "meetingLink" VARCHAR(500),
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
        mood VARCHAR(20) DEFAULT 'neutral' CHECK (mood IN ('excellent', 'good', 'neutral', 'poor', 'terrible')),
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_group_coach_id ON "Group"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_coach_id ON "Task"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_client_id ON "Task"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_group_id ON "Task"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_coach_id ON "Session"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_client_id ON "Session"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_group_id ON "Session"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_date ON "Session"("sessionDate")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_type ON "Task"("taskType")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_status ON "Task"(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_due_date ON "Task"("dueDate")`;

    // Add constraints to ensure data integrity (only if they don't exist)
    try {
      await sql`
        ALTER TABLE "Task" ADD CONSTRAINT chk_task_type_client 
        CHECK (
          ("taskType" = 'personal' AND "clientId" IS NULL AND "groupId" IS NULL) OR
          ("taskType" = 'client' AND "clientId" IS NOT NULL AND "groupId" IS NULL) OR
          ("taskType" = 'group' AND "clientId" IS NULL AND "groupId" IS NOT NULL)
        );
      `;
    } catch (error) {
      // Constraint might already exist, ignore the error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    try {
      await sql`
        ALTER TABLE "Task" ADD CONSTRAINT chk_repetitive_task 
        CHECK (
          ("isRepetitive" = FALSE AND "repetitiveFrequency" IS NULL AND "repetitiveCount" IS NULL) OR
          ("isRepetitive" = TRUE AND "repetitiveFrequency" IS NOT NULL AND "repetitiveCount" IS NOT NULL)
        );
      `;
    } catch (error) {
      // Constraint might already exist, ignore the error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    console.log('Task and Group tables created successfully');
  } catch (error) {
    console.error('Error creating task tables:', error);
    throw error;
  }
}

export async function seedClient() {
  try {
    // Create Client table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "Client" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "coachId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "referralSource" VARCHAR(255),
        "primaryConcerns" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_client_user_id ON "Client"("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_coach_id ON "Client"("coachId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_group_id ON "Client"("groupId")`;
  } catch (error) {
    console.error('Error creating client table:', error);
    throw error;
  }
}


export async function GET() {
  try {
    console.log('Starting database seeding...');

    await seedUser();
    await createProgramTable();
    await seedTask(); // Create Group table first
    await seedClient(); // Then create Client table that references Group

    console.log('Database seeded successfully');

    return new Response(JSON.stringify({
      message: 'Database seeded successfully',
      details: 'User, Program, Group, Task, and Client tables created with sample data'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Database seeding failed',
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Also support POST method for manual seeding
export async function POST() {
  return GET();
}
