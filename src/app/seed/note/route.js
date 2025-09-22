import { sql } from '../../lib/db/postgresql';

// Create ProgramTemplate table if it doesn't exist
export async function createNoteTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Note" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "clientId" UUID REFERENCES "Client"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (("clientId" IS NOT NULL AND "groupId" IS NULL) OR ("clientId" IS NULL AND "groupId" IS NOT NULL))
      );
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_note_client_id ON "Note"("clientId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_note_group_id ON "Note"("groupId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_note_created_at ON "Note"("createdAt")`;

    console.log('Note tables created successfully');
  } catch (error) {
    console.error('Error creating Note tables:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('Starting database seeding...');
    await createNoteTable();
    console.log('Database seeded successfully');

    return new Response(JSON.stringify({
      message: 'Database seeded successfully',
      details: 'User, Group, Task, Client  , and Note tables created with sample data'
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
