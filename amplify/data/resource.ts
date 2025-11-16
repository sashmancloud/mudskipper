import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Amplify Data Schema
 * 
 * Defines DynamoDB models for the Mudskipper QMS application.
 * All models use owner-based authorization by default.
 */
const schema = a.schema({
  Users: a
    .model({
      email: a.string().required(),
      first_name: a.string(),
      last_name: a.string(),
      permission_level: a.integer().required(), // 1-5
      status: a.string().required(), // "active" | "suspended" | "deleted"
      invited_by: a.string(), // user id
      created_at: a.datetime().required(),
      updated_at: a.datetime().required(),
    })
    // Access to this model will primarily be through backend functions.
    // Keep general read/write restricted to owners to avoid broad client mutations.
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
