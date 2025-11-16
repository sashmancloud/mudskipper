import { defineFunction } from "@aws-amplify/backend";

export const updateUserPermission = defineFunction({
  name: "updateUserPermission",
  entry: "./handler.ts",
  environment: {
    // your sandbox Users table name
    TABLE_USERS: "Users-ufkitgzacfechaxrnuuzsvjggu-NONE"
  },
});