import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the service role key for admin operations
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { action, performedBy, ...payload } = JSON.parse(event.body || '{}');

    if (!performedBy || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing action or performedBy' }),
      };
    }

    switch (action) {
      case 'createUser': {
        const { email, password, role } = payload;
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (error) throw error;

        const uid = data.user?.id;

        if (uid) {
          await supabase
            .from('users')
            .insert({
              uid,
              email,
              role,
              displayName: email.split('@')[0],
              favorites: [],
              disabled: false,
            });
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ uid }),
        };
      }

      case 'deleteUser': {
        const { userId } = payload;
        await supabase.auth.admin.deleteUser(userId);
        await supabase.from('users').delete().eq('uid', userId);
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'User deleted' }),
        };
      }

      case 'resetPassword': {
        const { email } = payload;
        // Supabase doesn't support sending password reset emails via service role directly
        // Workaround: use the public client on the frontend or send via your own email logic
        return {
          statusCode: 501,
          body: JSON.stringify({
            error: 'Password reset not supported server-side with Supabase',
          }),
        };
      }

      case 'toggleUserStatus': {
        const { userId, disabled } = payload;
        await supabase
          .from('users')
          .update({ disabled })
          .eq('uid', userId);

        await supabase.auth.admin.updateUserById(userId, {
          banned: disabled,
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'User status updated' }),
        };
      }

      case 'changeUserRole': {
        const { userId, newRole } = payload;
        await supabase
          .from('users')
          .update({ role: newRole })
          .eq('uid', userId);

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'User role updated' }),
        };
      }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }
  } catch (err: any) {
    console.error('Admin function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
