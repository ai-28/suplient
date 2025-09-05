import { sql } from "@/app/lib/db/postgresql";

// Create a new program
export async function createProgram(programData) {
    try {
        const {
            name,
            description,
            duration,
            category = 'general',
            isTemplate = false,
            targetConditions = [],
            coachId,
            elements = []
        } = programData;

        // Start a transaction
        const result = await sql`
      INSERT INTO "Program" (name, description, duration, category, "isTemplate", "targetConditions", "coachId", "createdAt", "updatedAt")
      VALUES (${name}, ${description}, ${duration}, ${category}, ${isTemplate}, ${targetConditions}, ${coachId}, NOW(), NOW())
      RETURNING id, name, description, duration, category, "isTemplate", "targetConditions", "coachId", "createdAt"
    `;

        const program = result[0];

        // Insert program elements if provided
        if (elements.length > 0) {
            for (const element of elements) {
                await sql`
          INSERT INTO "ProgramElement" (
            "programId", type, title, description, week, day, duration, content, 
            "scheduledTime", "elementData", "createdAt", "updatedAt"
          )
          VALUES (
            ${program.id}, ${element.type}, ${element.title}, ${element.description}, 
            ${element.week}, ${element.day}, ${element.duration || 60}, ${element.content}, 
            ${element.scheduledTime || '09:00:00'}, ${JSON.stringify(element.data || {})}, NOW(), NOW()
          )
        `;
            }
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
        const { isTemplate, category, limit = 50, offset = 0 } = options;

        let query = sql`
      SELECT p.*, u.name as "coachName",
             (SELECT COUNT(*) FROM "ProgramElement" WHERE "programId" = p.id) as "elementCount"
      FROM "Program" p
      LEFT JOIN "User" u ON p."coachId" = u.id
      WHERE p."coachId" = ${coachId}
    `;

        if (isTemplate !== undefined) {
            query = sql`${query} AND p."isTemplate" = ${isTemplate}`;
        }

        if (category) {
            query = sql`${query} AND p.category = ${category}`;
        }

        query = sql`${query} ORDER BY p."createdAt" DESC LIMIT ${limit} OFFSET ${offset}`;

        const programs = await query;

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
            category,
            isTemplate,
            targetConditions,
            elements
        } = programData;

        // Update program
        const result = await sql`
      UPDATE "Program"
      SET name = ${name}, description = ${description}, duration = ${duration},
          category = ${category}, "isTemplate" = ${isTemplate}, 
          "targetConditions" = ${targetConditions}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        if (result.length === 0) {
            throw new Error('Program not found');
        }

        // If elements are provided, replace all elements
        if (elements) {
            // Delete existing elements
            await sql`DELETE FROM "ProgramElement" WHERE "programId" = ${id}`;

            // Insert new elements
            for (const element of elements) {
                await sql`
          INSERT INTO "ProgramElement" (
            "programId", type, title, description, week, day, duration, content, 
            "scheduledTime", "elementData", "createdAt", "updatedAt"
          )
          VALUES (
            ${id}, ${element.type}, ${element.title}, ${element.description}, 
            ${element.week}, ${element.day}, ${element.duration || 60}, ${element.content}, 
            ${element.scheduledTime || '09:00:00'}, ${JSON.stringify(element.data || {})}, NOW(), NOW()
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

        // Create new program with duplicated data
        const duplicatedProgram = await createProgram({
            name: newName,
            description: originalProgram.description,
            duration: originalProgram.duration,
            category: originalProgram.category,
            isTemplate: originalProgram.isTemplate,
            targetConditions: originalProgram.targetConditions,
            coachId,
            elements: originalProgram.elements
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
        COUNT(CASE WHEN "isTemplate" = true THEN 1 END) as "templatePrograms",
        COUNT(CASE WHEN "isTemplate" = false THEN 1 END) as "activePrograms",
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
