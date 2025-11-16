import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { AuthUser } from "@aws-amplify/ui-react-core";

const client = generateClient<Schema>();

export async function getCurrentUserPermissionLevel(user: AuthUser | undefined): Promise<number> {
  if (!user?.signInDetails?.loginId) return 0;
  const email = String(user.signInDetails.loginId).toLowerCase();
  const { data: users } = await client.models.Users.list();
  const match = users.find(u => u.email.toLowerCase() === email);
  return match?.permission_level ?? 0;
}

export function isSuperAdmin(level: number): boolean {
  return level >= 5;
}


