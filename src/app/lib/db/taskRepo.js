import { sql } from './postgresql';

export const taskRepo = {
    createTask,
    getTasksByCoach,
    updateTask,
    deleteTask,
    getTaskById,
};

async function createTask(taskData) {
    try {
        const {
            title,
            description,
            dueDate,
            taskType,
            coachId,
            clientId,
            groupId,
            isRepetitive,
            repetitiveFrequency,
            repetitiveCount,
            status = 'pending'
        } = taskData;

        const result = await sql`
      INSERT INTO "Task" (
        title, 
        description, 
        "dueDate", 
        "taskType", 
        "coachId", 
        "clientId", 
        "groupId", 
        "isRepetitive", 
        "repetitiveFrequency", 
        "repetitiveCount", 
        status, 
        "createdAt", 
        "updatedAt"
      )
      VALUES (
        ${title}, 
        ${description || null}, 
        ${dueDate || null}, 
        ${taskType}, 
        ${coachId}, 
        ${clientId || null}, 
        ${groupId || null}, 
        ${isRepetitive || false}, 
        ${repetitiveFrequency || null}, 
        ${repetitiveCount || null}, 
        ${status}, 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;

        return result[0];
    } catch (error) {
        console.error("Create task error:", error);
        throw error;
    }
}

async function getTasksByCoach(coachId) {
    try {
        let query = sql`
      SELECT *
      FROM "Task"
      WHERE "coachId" = ${coachId}
    `;

        const result = await query;
        return result;
    } catch (error) {
        console.error("Get tasks by coach error:", error);
        throw error;
    }
}

async function updateTask(taskId, updateData) {
    try {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        const addField = (fieldName, value, dbFieldName = null) => {
            if (value !== undefined) {
                const dbField = dbFieldName || fieldName;
                setClauses.push(`"${dbField}" = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        };

        addField('title', updateData.title);
        addField('description', updateData.description);
        addField('dueDate', updateData.dueDate);
        addField('status', updateData.status);
        addField('isRepetitive', updateData.isRepetitive);
        addField('repetitiveFrequency', updateData.repetitiveFrequency);
        addField('repetitiveCount', updateData.repetitiveCount);

        setClauses.push(`"updatedAt" = NOW()`);
        values.push(taskId);

        if (setClauses.length === 1) { // Only updatedAt
            throw new Error('No fields provided for update');
        }

        const query = `UPDATE "Task" SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await sql.unsafe(query, values);
        return result[0];
    } catch (error) {
        console.error("Update task error:", error);
        throw error;
    }
}

async function deleteTask(taskId) {
    try {
        const result = await sql`
      DELETE FROM "Task" 
      WHERE id = ${taskId}
      RETURNING *
    `;

        return result[0];
    } catch (error) {
        console.error("Delete task error:", error);
        throw error;
    }
}

async function getTaskById(taskId) {
    try {
        const result = await sql`
      SELECT t.*, 
             u.name as "coachName",
             c.name as "clientName",
             g.name as "groupName",
             g."memberCount" as "groupMemberCount"
      FROM "Task" t
      LEFT JOIN "User" u ON t."coachId" = u.id
      LEFT JOIN "User" c ON t."clientId" = c.id
      LEFT JOIN "Group" g ON t."groupId" = g.id
      WHERE t.id = ${taskId}
    `;

        return result[0];
    } catch (error) {
        console.error("Get task by ID error:", error);
        throw error;
    }
}

