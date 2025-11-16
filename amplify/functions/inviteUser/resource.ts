import { defineFunction } from "@aws-amplify/backend";

export const inviteUser = defineFunction({
  name: "inviteUser",
  entry: "./handler.ts",
  environment: {
    USER_POOL_ID: "eu-north-1_qciiEZPzU",
    TABLE_USERS: "Users-ufkitgzacfechaxrnuuzsvjggu-NONE",
  },
});