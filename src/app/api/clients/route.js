import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption";
import { clientRepo } from "@/app/lib/db/clientRepo";

export async function GET() {
    try {
        // Get the current session to verify the coach
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'coach') {
            return Response.json({
                success: false,
                error: 'Unauthorized. Only coaches can view clients.'
            }, { status: 401 });
        }

        const clients = await clientRepo.getClientsByCoach(session.user.id);

        return Response.json({
            success: true,
            clients: clients
        });

    } catch (error) {
        console.error('Error fetching clients:', error);
        return Response.json({
            success: false,
            error: 'Failed to fetch clients'
        }, { status: 500 });
    }
}
