import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

type UpdatePermissionPayload = {
  userId: string;
  permissionLevel: number;
  updatedBy: string;
};

export const handler = async (event: any) => {
  try {
    const tableUsers = process.env.TABLE_USERS;
    if (!tableUsers) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing TABLE_USERS env" }),
      };
    }

    const body: UpdatePermissionPayload =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    if (!body?.userId || !Number.isFinite(Number(body?.permissionLevel))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "userId and permissionLevel are required" }),
      };
    }

    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    const now = new Date().toISOString();

    await ddb.send(
      new UpdateCommand({
        TableName: tableUsers,
        Key: { id: body.userId },
        UpdateExpression: "SET permission_level = :pl, updated_at = :ua",
        ExpressionAttributeValues: {
          ":pl": Number(body.permissionLevel),
          ":ua": now,
        },
        ConditionExpression: "attribute_exists(id)",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e: any) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "update failed", detail: e?.message ?? String(e) }),
    };
  }
};