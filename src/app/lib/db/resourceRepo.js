import { sql } from './postgresql.js';

// Video operations
export async function saveVideo(title, coachId, resourceType, url, description = '', author = '', fileSize = null, fileType = null) {
    try {
        // Extract filename from URL for fileName field
        const fileName = url.split('/').pop() || title;

        const result = await sql`
      INSERT INTO "Resource" (title, description, "resourceType", url, "fileName", "fileSize", "fileType", "coachId", author)
      VALUES (${title}, ${description}, ${resourceType}, ${url}, ${fileName}, ${fileSize}, ${fileType}, ${coachId}, ${author})
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error('Error saving video:', error);
        throw error;
    }
}

export async function getAllVideos() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'video'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

export async function getAllVideosForCoach() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'video'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching videos for coach:', error);
        throw error;
    }
}

export async function getAllVideosForClinic() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'video'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching videos for clinic:', error);
        throw error;
    }
}

// Image operations
export async function saveImage(title, coachId, resourceType, url, description = '', author = '', fileSize = null, fileType = null) {
    try {
        // Extract filename from URL for fileName field
        const fileName = url.split('/').pop() || title;

        const result = await sql`
      INSERT INTO "Resource" (title, description, "resourceType", url, "fileName", "fileSize", "fileType", "coachId", author)
      VALUES (${title}, ${description}, ${resourceType}, ${url}, ${fileName}, ${fileSize}, ${fileType}, ${coachId}, ${author})
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error('Error saving image:', error);
        throw error;
    }
}

export async function getAllImages() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'image'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
}

export async function getAllImagesForCoach() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'image'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching images for coach:', error);
        throw error;
    }
}

// Article/PDF operations
export async function savePDF(title, coachId, resourceType, url, description = '', author = '', fileSize = null, fileType = null) {
    try {
        // Extract filename from URL for fileName field
        const fileName = url.split('/').pop() || title;

        const result = await sql`
      INSERT INTO "Resource" (title, description, "resourceType", url, "fileName", "fileSize", "fileType", "coachId", author)
      VALUES (${title}, ${description}, ${resourceType}, ${url}, ${fileName}, ${fileSize}, ${fileType}, ${coachId}, ${author})
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error('Error saving PDF:', error);
        throw error;
    }
}

export async function getAllPDFs() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'article'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching PDFs:', error);
        throw error;
    }
}

export async function getAllPDFsForCoach() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'article'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching PDFs for coach:', error);
        throw error;
    }
}

// Sound operations
export async function saveSound(title, coachId, resourceType, url, description = '', author = '', fileSize = null, fileType = null) {
    try {
        // Extract filename from URL for fileName field
        const fileName = url.split('/').pop() || title;

        const result = await sql`
      INSERT INTO "Resource" (title, description, "resourceType", url, "fileName", "fileSize", "fileType", "coachId", author)
      VALUES (${title}, ${description}, ${resourceType}, ${url}, ${fileName}, ${fileSize}, ${fileType}, ${coachId}, ${author})
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error('Error saving sound:', error);
        throw error;
    }
}

export async function getAllSounds() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'sound'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching sounds:', error);
        throw error;
    }
}

export async function getAllSoundsForCoach() {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r."resourceType" = 'sound'
      ORDER BY r."createdAt" DESC
    `;
        return result;
    } catch (error) {
        console.error('Error fetching sounds for coach:', error);
        throw error;
    }
}

// Optimized functions for AddElementDialog - only fetch required fields and filter by coachId
export async function getResourcesForDialog(coachId) {
    try {
        const result = await sql`
            SELECT 
                id,
                "fileName",
                title,
                "resourceType",
                "fileSize"
            FROM "Resource"
            WHERE "coachId" = ${coachId}
            ORDER BY "createdAt" DESC
        `;
        return result;
    } catch (error) {
        console.error('Error fetching resources for dialog:', error);
        throw error;
    }
}

// General resource operations
export async function getResourceById(id) {
    try {
        const result = await sql`
      SELECT r.*, u.name as "coachName"
      FROM "Resource" r
      LEFT JOIN "User" u ON r."coachId" = u.id
      WHERE r.id = ${id}
    `;
        return result[0];
    } catch (error) {
        console.error('Error fetching resource by ID:', error);
        throw error;
    }
}

export async function deleteResource(id) {
    try {
        const result = await sql`
      DELETE FROM "Resource" WHERE id = ${id}
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error('Error deleting resource:', error);
        throw error;
    }
}

export async function updateResource(id, updates) {
    try {
        const setClause = Object.keys(updates)
            .map(key => `"${key}" = $${key}`)
            .join(', ');

        const values = Object.values(updates);
        const query = `UPDATE "Resource" SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

        const result = await sql.unsafe(query, [id, ...values]);
        return result[0];
    } catch (error) {
        console.error('Error updating resource:', error);
        throw error;
    }
}
