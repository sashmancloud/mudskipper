import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

type InvitePayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  permissionLevel: number; // 1–5
  invitedBy: string;       // who initiated the invite
};

export const handler = async (event: any) => {
  try {
    const userPoolId = process.env.USER_POOL_ID;
    const tableUsers = process.env.TABLE_USERS;
    if (!userPoolId || !tableUsers) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing USER_POOL_ID or TABLE_USERS env" }),
      };
    }

    const body: InvitePayload =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    if (!body?.email || !body?.permissionLevel || !body?.invitedBy) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "email, permissionLevel, and invitedBy are required",
        }),
      };
    }

    // 1) Create user in Cognito (sandbox pool) if they don't already exist
const cognito = new CognitoIdentityProviderClient({});
try {
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: body.email,
      UserAttributes: [
        { Name: "email", Value: body.email },
        { Name: "email_verified", Value: "true" },
        ...(body.firstName ? [{ Name: "given_name", Value: body.firstName }] : []),
        ...(body.lastName ? [{ Name: "family_name", Value: body.lastName }] : []),
      ],
    })
  );
} catch (err: any) {
  // If the user already exists in Cognito, that's ok for this flow.
  // We still want to ensure they are present in our Users table.
  const code = err?.name ?? err?.__type;
  if (code !== "UsernameExistsException") {
    console.error("Cognito AdminCreateUser error", err);
    throw err; // only rethrow unexpected errors
  }
}

    // 2) Insert into Users table
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: tableUsers,
        Item: {
          id: uuid(),
          email: body.email.toLowerCase(),
          first_name: body.firstName ?? null,
          last_name: body.lastName ?? null,
          permission_level: body.permissionLevel,
          status: "active",
          invited_by: body.invitedBy,
          created_at: now,
          updated_at: now,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Invitation created", email: body.email }),
    };
  } catch (err) {
    console.error("inviteUser error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to invite user" }),
    };
  }
};