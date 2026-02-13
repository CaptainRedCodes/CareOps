import { useState, useEffect } from 'react';
import api from '@/api/client';

interface StaffPermissions {
  inbox: boolean;
  bookings: boolean;
  forms: boolean;
  inventory: boolean;
}

interface UseHasPermissionReturn {
  hasPermission: (permission: keyof StaffPermissions) => boolean;
  permissions: StaffPermissions | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useHasPermission(workspaceId: string | undefined): UseHasPermissionReturn {
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const response = await api.get(`/workspaces/${workspaceId}/staff`);

        if (response.status === 200) {
          const staffList = response.data;
          // Get current user's assignment from the list
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const myAssignment = staffList.find(
              (s: any) => s.user_id === user.id
            );
            if (myAssignment) {
              setPermissions(myAssignment.permissions);
              setIsAdmin(false);
            } else {
              // If not in staff list, check if user is owner (handled separately in backend usually, or assume admin if can get staff list?)
              // Actually, if we can read staff list, we have some permission.
              // But let's stick to previous logic: if not in list, maybe admin?
              setIsAdmin(true);
            }
          }
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          setIsAdmin(true);
        } else {
          console.error('Failed to fetch permissions:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [workspaceId]);

  const hasPermission = (permission: keyof StaffPermissions): boolean => {
    if (isAdmin) return true;
    if (!permissions) return false;
    return permissions[permission] ?? false;
  };

  return { hasPermission, permissions, isAdmin, loading };
}
