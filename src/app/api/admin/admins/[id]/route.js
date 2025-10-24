import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { sql } from '@/app/lib/db/postgresql';

// PUT - Update admin user
export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin
        if (!session?.user?.id || session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { name, email, phone, isActive, isSuperAdmin } = await request.json();

        // Get current admin's super admin status
        const currentAdmin = await sql`
      SELECT "isSuperAdmin" FROM "User" WHERE id = ${session.user.id}
    `;

        const isCurrentUserSuperAdmin = currentAdmin[0]?.isSuperAdmin;

        // Get target admin's super admin status
        const targetAdmin = await sql`
      SELECT "isSuperAdmin" FROM "User" WHERE id = ${id} AND role = 'admin'
    `;

        if (targetAdmin.length === 0) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        const isTargetSuperAdmin = targetAdmin[0]?.isSuperAdmin;

        // Regular admins cannot update super admins
        if (!isCurrentUserSuperAdmin && isTargetSuperAdmin) {
            return NextResponse.json(
                { error: 'You do not have permission to update super admins' },
                { status: 403 }
            );
        }

        // Regular admins cannot make someone a super admin
        if (!isCurrentUserSuperAdmin && isSuperAdmin) {
            return NextResponse.json(
                { error: 'You do not have permission to create super admins' },
                { status: 403 }
            );
        }

        // Update admin
        await sql`
      UPDATE "User"
      SET 
        name = ${name},
        email = ${email},
        phone = ${phone || null},
        "isActive" = ${isActive},
        "isSuperAdmin" = ${isSuperAdmin || false},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id} AND role = 'admin'
    `;

        return NextResponse.json({
            success: true,
            message: 'Admin updated successfully'
        });

    } catch (error) {
        console.error('Error updating admin:', error);
        return NextResponse.json(
            { error: 'Failed to update admin' },
            { status: 500 }
        );
    }
}

// DELETE - Delete admin user
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin
        if (!session?.user?.id || session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get current admin's super admin status
        const currentAdmin = await sql`
      SELECT "isSuperAdmin" FROM "User" WHERE id = ${session.user.id}
    `;

        const isCurrentUserSuperAdmin = currentAdmin[0]?.isSuperAdmin;

        // Get target admin's super admin status
        const targetAdmin = await sql`
      SELECT "isSuperAdmin" FROM "User" WHERE id = ${id} AND role = 'admin'
    `;

        if (targetAdmin.length === 0) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        const isTargetSuperAdmin = targetAdmin[0]?.isSuperAdmin;

        // Regular admins cannot delete super admins
        if (!isCurrentUserSuperAdmin && isTargetSuperAdmin) {
            return NextResponse.json(
                { error: 'You do not have permission to delete super admins' },
                { status: 403 }
            );
        }

        // Prevent deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { error: 'You cannot delete your own account' },
                { status: 400 }
            );
        }

        // Delete admin
        await sql`
      DELETE FROM "User"
      WHERE id = ${id} AND role = 'admin'
    `;

        return NextResponse.json({
            success: true,
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json(
            { error: 'Failed to delete admin' },
            { status: 500 }
        );
    }
}

