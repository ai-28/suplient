import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users for debugging
    const users = await sql`
      SELECT id, name, email, role, "isActive" 
      FROM "User" 
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;

    return NextResponse.json({
      success: true,
      users,
      currentUser: session.user
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
