import { sql } from "@/app/lib/db/postgresql";

// Create a new program
export async function createProgram(programData) {
    try {
        const {
            name,
            description,
            duration,
            coachId,
            elements = []
        } = programData;

        console.log('createProgram called with:', {
            name,
            description,
            duration,
            coachId,
            elementsCount: elements?.length || 0
        });

        // Validate required fields
        if (!name) {
            throw new Error('Program name is required');
        }
        if (!duration) {
            throw new Error('Program duration is required');
        }
        if (!coachId) {
            throw new Error('Coach ID is required');
        }

        // Start a transaction
        const result = await sql`
      INSERT INTO "Program" (name, description, duration, "coachId", "createdAt", "updatedAt")
      VALUES (${name}, ${description}, ${duration}, ${coachId}, NOW(), NOW())
      RETURNING id, name, description, duration, "coachId", "createdAt"
    `;

        const program = result[0];
        console.log("elements", elements)
        // Insert program elements if provided
        if (elements.length > 0) {
            // Use Promise.all for concurrent inserts (better than sequential)
            await Promise.all(
                elements.map(element =>
                    sql`
                        INSERT INTO "ProgramElement" (
                            "programId", type, title, week, day, 
                            "scheduledTime", "elementData", "createdAt", "updatedAt"
                        )
                        VALUES (
                            ${program.id}, 
                            ${element.type || 'exercise'}, 
                            ${element.title || 'Untitled Element'}, 
                            ${element.week || 1}, 
                            ${element.day || 1}, 
                            ${element.scheduledTime || '09:00:00'}, 
                            ${JSON.stringify(element.data || {})}, 
                            NOW(), 
                            NOW()
                        )
                    `
                )
            );
        }

        return program;
    } catch (error) {
        console.error('Error creating program:', error);
        throw error;
    }
}

// Get program by ID with elements
export async function getProgramById(id) {
    try {
        const programResult = await sql`
      SELECT p.*, u.name as "coachName"
      FROM "Program" p
      LEFT JOIN "User" u ON p."coachId" = u.id
      WHERE p.id = ${id}
    `;

        if (programResult.length === 0) {
            return null;
        }

        const program = programResult[0];

        // Get program elements
        const elementsResult = await sql`
      SELECT * FROM "ProgramElement"
      WHERE "programId" = ${id}
      ORDER BY week, day
    `;

        program.elements = elementsResult;

        return program;
    } catch (error) {
        console.error('Error getting program by ID:', error);
        throw error;
    }
}

// Get all programs for a coach
export async function getProgramsByCoach(coachId, options = {}) {
    try {
        const { limit = 50, offset = 0 } = options;

        const programs = await sql`
      SELECT p.*, u.name as "coachName",
             (SELECT COUNT(*) FROM "ProgramElement" WHERE "programId" = p.id) as "elementCount"
      FROM "Program" p
      LEFT JOIN "User" u ON p."coachId" = u.id
      WHERE p."coachId" = ${coachId}
      ORDER BY p."createdAt" DESC LIMIT ${limit} OFFSET ${offset}
    `;

        return programs;
    } catch (error) {
        console.error('Error getting programs by coach:', error);
        throw error;
    }
}

// Update program
export async function updateProgram(id, programData) {
    try {
        const {
            name,
            description,
            duration,
            elements
        } = programData;

        console.log('updateProgram called with:', {
            id,
            name,
            description,
            duration,
            elementsCount: elements?.length || 0
        });

        // Validate required fields
        if (!name) {
            throw new Error('Program name is required');
        }
        if (!duration) {
            throw new Error('Program duration is required');
        }

        // Update program
        const result = await sql`
      UPDATE "Program"
      SET name = ${name}, description = ${description || ''}, duration = ${duration}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        if (result.length === 0) {
            throw new Error('Program not found');
        }

        // If elements are provided, replace all elements
        if (elements && elements.length > 0) {
            console.log('Updating elements:', elements.length, 'elements');

            // Delete existing elements
            await sql`DELETE FROM "ProgramElement" WHERE "programId" = ${id}`;

            // Insert new elements
            for (const element of elements) {
                console.log('Inserting element:', {
                    type: element.type,
                    title: element.title,
                    week: element.week,
                    day: element.day
                });

                await sql`
          INSERT INTO "ProgramElement" (
            "programId", type, title, week, day, 
            "scheduledTime", "elementData", "createdAt", "updatedAt"
          )
          VALUES (
            ${id}, 
            ${element.type || 'exercise'}, 
            ${element.title || 'Untitled Element'}, 
            ${element.week || 1}, 
            ${element.day || 1}, 
            ${element.scheduledTime || '09:00:00'}, 
            ${JSON.stringify(element.data || {})}, 
            NOW(), 
            NOW()
          )
        `;
            }
        }

        return result[0];
    } catch (error) {
        console.error('Error updating program:', error);
        throw error;
    }
}

// Delete program
export async function deleteProgram(id) {
    try {
        const result = await sql`
      DELETE FROM "Program"
      WHERE id = ${id}
      RETURNING id
    `;

        return result.length > 0;
    } catch (error) {
        console.error('Error deleting program:', error);
        throw error;
    }
}

// Duplicate program
export async function duplicateProgram(originalId, newName, coachId) {
    try {
        const originalProgram = await getProgramById(originalId);
        if (!originalProgram) {
            throw new Error('Original program not found');
        }

        console.log('Original program data:', {
            name: originalProgram.name,
            description: originalProgram.description,
            duration: originalProgram.duration,
            elementsCount: originalProgram.elements?.length || 0
        });

        // Create new program with duplicated data
        const duplicatedProgram = await createProgram({
            name: newName,
            description: originalProgram.description || '',
            duration: originalProgram.duration,
            coachId,
            elements: originalProgram.elements || []
        });

        return duplicatedProgram;
    } catch (error) {
        console.error('Error duplicating program:', error);
        throw error;
    }
}

// Get program statistics
export async function getProgramStats(coachId) {
    try {
        const stats = await sql`
      SELECT 
        COUNT(*) as "totalPrograms",
        AVG(duration) as "averageDuration"
      FROM "Program"
      WHERE "coachId" = ${coachId}
    `;

        return stats[0];
    } catch (error) {
        console.error('Error getting program stats:', error);
        throw error;
    }
}
