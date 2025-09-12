import { sql } from './postgresql';

export const groupRepo = {
    createGroup,
    getGroupsByCoach,
    updateGroup,
    deleteGroup,
};

async function createGroup(groupData) {
    try {
        const {
            name,
            description,
            capacity,
            frequency,
            duration,
            location,
            focusArea,
            coachId,
            selectedMembers = [],
            stage = 'upcoming'
        } = groupData;

        // Create the group with selectedMembers array
        const result = await sql`
            INSERT INTO "Group" (
                name,
                description,
                capacity,
                frequency,
                duration,
                location,
                "focusArea",
                "coachId",
                "selectedMembers",
                "memberCount",
                stage,
                "createdAt",
                "updatedAt"
            )
            VALUES (
                ${name},
                ${description || null},
                ${capacity || null},
                ${frequency || null},
                ${duration || null},
                ${location || null},
                ${focusArea || null},
                ${coachId},
                ${selectedMembers.length > 0 ? selectedMembers : []},
                ${selectedMembers.length},
                ${stage},
                NOW(),
                NOW()
            )
            RETURNING *
        `;

        return result[0];
    } catch (error) {
        console.error("Create group error:", error);
        throw error;
    }
}

async function getGroupsByCoach(coachId) {
    try {
        const result = await sql`
            SELECT *
            FROM "Group"
            WHERE "coachId" = ${coachId}
            ORDER BY "createdAt" DESC
        `;
        return result;
    } catch (error) {
        console.error("Get groups by coach error:", error);
        throw error;
    }
}

async function updateGroup(groupId, updateData) {
    try {
        // Build dynamic SET clause based on provided fields
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        // Helper function to add a field to the SET clause
        const addField = (fieldName, value, dbFieldName = null) => {
            if (value !== undefined) {
                const dbField = dbFieldName || fieldName;
                setClauses.push(`"${dbField}" = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        };

        // Add fields that are provided in updateData
        addField('name', updateData.name);
        addField('description', updateData.description);
        addField('capacity', updateData.capacity);
        addField('frequency', updateData.frequency);
        addField('duration', updateData.duration);
        addField('location', updateData.location);
        addField('focusArea', updateData.focusArea, 'focusArea');
        addField('stage', updateData.stage);
        addField('selectedMembers', updateData.selectedMembers, 'selectedMembers');

        // Calculate member count if selectedMembers is being updated
        if (updateData.selectedMembers !== undefined) {
            addField('memberCount', updateData.selectedMembers.length, 'memberCount');
        }

        // Always update the updatedAt timestamp
        setClauses.push(`"updatedAt" = NOW()`);

        // Add the groupId as the last parameter
        values.push(groupId);

        if (setClauses.length === 1) { // Only updatedAt
            throw new Error('No fields provided for update');
        }

        // Build the dynamic query
        const query = `
            UPDATE "Group" 
            SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await sql.unsafe(query, values);

        return result[0];
    } catch (error) {
        console.error("Update group error:", error);
        throw error;
    }
}

async function deleteGroup(groupId) {
    try {
        const result = await sql`
            DELETE FROM "Group" 
            WHERE id = ${groupId}
            RETURNING *
        `;

        return result[0];
    } catch (error) {
        console.error("Delete group error:", error);
        throw error;
    }
}
