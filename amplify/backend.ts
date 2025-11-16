import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { inviteUser } from './functions/inviteUser/resource';
import { updateUserPermission } from './functions/updateUserPermission/resource';

defineBackend({
  auth,
  data,
  inviteUser,
  updateUserPermission,
});
