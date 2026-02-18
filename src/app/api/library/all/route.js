import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/lib/authoption.js";
import { getResourcesForDialog } from "../../../lib/db/resourceRepo.js";
import { userRepo } from "../../../lib/db/userRepo.js";
import { getFolderPath } from "../../../lib/db/folderRepo.js";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get the current user to filter by coach ID
        const email = session.user.email;
        const user = await userRepo.getUserByEmail(email);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Fetch only required fields for this specific coach - optimized query
        const resources = await getResourcesForDialog(user.id);

        // Transform to the format expected by frontend
        const allResources = await Promise.all(resources.map(async (item) => {
            // Determine type and category based on resourceType
            let type, category;
            switch (item.resourceType) {
                case 'video':
                    type = 'video';
                    category = 'videos';
                    break;
                case 'image':
                    type = 'image';
                    category = 'images';
                    break;
                case 'article':
                    type = 'pdf';
                    category = 'articles';
                    break;
                case 'sound':
                    type = 'audio';
                    category = 'sounds';
                    break;
                default:
                    type = 'pdf';
                    category = 'articles';
            }

            // Get folder path if folderId exists
            let folderPath = null;
            if (item.folderId) {
                try {
                    const path = await getFolderPath(item.folderId);
                    folderPath = path.map(f => f.name).join(' / ');
                } catch (error) {
                    console.error('Error getting folder path:', error);
                }
            }

            return {
                id: item.id,
                name: item.title,
                type: type,
                category: category,
                size: item.fileSize ? formatFileSize(item.fileSize) : 'Unknown',
                url: item.url || null,
                folderId: item.folderId || null,
                folderName: item.folderName || null,
                folderPath: folderPath || null
            };
        }));

        // Calculate counts by category
        const counts = {
            videos: resources.filter(item => item.resourceType === 'video').length,
            images: resources.filter(item => item.resourceType === 'image').length,
            articles: resources.filter(item => item.resourceType === 'article').length,
            sounds: resources.filter(item => item.resourceType === 'sound').length,
            total: allResources.length
        };

        return NextResponse.json({
            status: true,
            message: 'All resources fetched successfully',
            resources: allResources,
            counts: counts
        });

    } catch (error) {
        console.error('Error fetching all resources:', error);
        return NextResponse.json(
            {
                status: false,
                message: 'Failed to fetch resources',
                error: error.message
            },
            { status: 500 }
        );
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${sizes[i]}`;
}
