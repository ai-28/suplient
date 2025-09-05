import { userRepo } from "@/app/lib/db/userRepo";
import { getServerSession } from "next-auth";

export async function GET() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        return Response.json({ success: false, message: "User not found" });
    }
    try {
        const user = await userRepo.getUserByEmail(session?.user?.email);
        if (!user) {
            return Response.json({ success: false, message: "User not found" });
        }

        return Response.json({ success: true, user: user });
    } catch (error) {
        console.error(error);
        return Response.json({ success: false, message: "User fetch failed" });
    }
}
