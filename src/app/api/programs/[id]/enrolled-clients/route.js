import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/lib/authoption';
import { getEnrolledClientsForTemplate } from '@/app/lib/db/programRepo';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        console.log('Fetching enrolled clients for template:', { templateId: id, coachId: session.user.id });

        const enrolledClients = await getEnrolledClientsForTemplate(id, session.user.id);

        // Transform the data to match the expected format
        const transformedClients = enrolledClients.map(client => {
            const completedElementsCount = Array.isArray(client.completedElements)
                ? client.completedElements.length
                : 0;

            // Calculate current day based on start date
            let currentDay = 0;
            if (client.startDate) {
                const startDate = new Date(client.startDate);
                const today = new Date();
                const diffTime = Math.abs(today - startDate);
                currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // Use the actual database status
            const status = client.status;

            return {
                id: client.clientId,
                enrollmentId: client.enrollmentId,
                name: client.clientName,
                email: client.clientEmail,
                enrolledDate: new Date(client.enrolledDate),
                status: client.status,
                progress: {
                    completedElements: completedElementsCount,
                    totalElements: parseInt(client.totalElements) || 0,
                    currentDay: currentDay,
                    status: client.status,
                    completionRate: client.totalElements > 0
                        ? Math.round((completedElementsCount / client.totalElements) * 100)
                        : 0
                }
            };
        });

        return NextResponse.json({
            success: true,
            clients: transformedClients
        });

    } catch (error) {
        console.error('Error fetching enrolled clients:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch enrolled clients' },
            { status: 500 }
        );
    }
}
