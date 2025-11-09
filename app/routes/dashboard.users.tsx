import { useState } from "react";
import { useOutletContext, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard.users";
import { getAllUsers } from "~/lib/db.server";
import { requireAdmin } from "~/lib/auth.middleware";
import { useActivity } from "~/contexts/ActivityContext";
import { UserTable } from "~/components/users/UserTable";
import { UserCreateDialog } from "~/components/users/UserCreateDialog";
import { UserEditDialog } from "~/components/users/UserEditDialog";
import { UserDeleteDialog } from "~/components/users/UserDeleteDialog";
import { UserBanDialog } from "~/components/users/UserBanDialog";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { User } from "~/types";

interface DashboardContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "User Management - Dashboard" },
    { name: "description", content: "Manage users in the system" },
  ];
}

// Loader - fetch users on server
export async function loader() {
  const users = getAllUsers();
  // Sort by createdAt descending (newest first)
  const sortedUsers = users.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  return { users: sortedUsers };
}

// Action - handle user update and unban requests (admin only)
export async function action({ request }: Route.ActionArgs) {
  // Require admin role for all actions
  await requireAdmin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId") as string;

  if (intent === "update" && userId) {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;
    const emailVerified = formData.get("emailVerified") === "true";

    try {
      // Use Better Auth database operations for user management
      const { updateUser } = await import("~/lib/user-management.server");

      await updateUser(userId, {
        email,
        name,
        role: role as "user" | "admin",
        emailVerified,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Failed to update user:", error);
      return { success: false, error: error.message || "Failed to update user" };
    }
  }

  if (intent === "ban" && userId) {
    const banReason = formData.get("banReason") as string || "Banned by administrator";

    try {
      // Use Better Auth database operations to ban user
      const { banUser } = await import("~/lib/user-management.server");

      await banUser(userId, banReason);

      return { success: true };
    } catch (error: any) {
      console.error("Failed to ban user:", error);
      return { success: false, error: error.message || "Failed to ban user" };
    }
  }

  if (intent === "unban" && userId) {
    try {
      // Use Better Auth database operations to unban user
      const { unbanUser } = await import("~/lib/user-management.server");

      await unbanUser(userId);

      return { success: true };
    } catch (error: any) {
      console.error("Failed to unban user:", error);
      return { success: false, error: error.message || "Failed to unban user" };
    }
  }

  if (intent === "delete" && userId) {
    try {
      // Use Better Auth database operations to delete user
      const { deleteUser } = await import("~/lib/user-management.server");

      await deleteUser(userId);

      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      return { success: false, error: error.message || "Failed to delete user" };
    }
  }

  if (intent === "create") {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    try {
      // Use Better Auth database operations to create user
      const { createUser } = await import("~/lib/user-management.server");

      await createUser({
        email,
        password,
        name,
        role: role as "user" | "admin",
        emailVerified: true, // Auto-verify admin-created users
      });

      return { success: true };
    } catch (error: any) {
      console.error("Failed to create user:", error);
      return { success: false, error: error.message || "Failed to create user" };
    }
  }

  return { success: false };
}

// Main component
export default function DashboardUsers() {
  const { users } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<DashboardContext>();
  const { logActivity } = useActivity();
  const revalidator = useRevalidator();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Paginate users
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateUser = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSuccess = (email: string, name: string) => {
    toast.success("User created successfully");
    logActivity({
      action: "Created new user",
      user: user.name,
      target: email,
      type: "create",
    });
    revalidator.revalidate();
  };

  const handleEditSuccess = () => {
    toast.success("User updated successfully");
    if (selectedUser) {
      logActivity({
        action: "Updated user profile",
        user: user.name,
        target: selectedUser.email,
        type: "edit",
      });
    }
    revalidator.revalidate();
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  };

  const handleDeleteSuccess = () => {
    toast.success("User deleted successfully");
    if (selectedUser) {
      logActivity({
        action: "Deleted user",
        user: user.name,
        target: selectedUser.email,
        type: "delete",
      });
    }
    revalidator.revalidate();
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  };

  const handleBan = (user: User) => {
    setSelectedUser(user);
    setIsBanDialogOpen(true);
  };

  const handleUnban = async (targetUser: User) => {
    try {
      // Submit form to unban user via action
      const formData = new FormData();
      formData.append("intent", "unban");
      formData.append("userId", targetUser.id);

      await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      toast.success(`${targetUser.name} has been unbanned`);
      logActivity({
        action: "Unbanned user",
        user: user.name,
        target: targetUser.email,
        type: "unban",
      });
      revalidator.revalidate();
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const handleBanSuccess = () => {
    toast.success(`${selectedUser?.name} has been banned`);
    if (selectedUser) {
      logActivity({
        action: "Banned user",
        user: user.name,
        target: selectedUser.email,
        type: "ban",
      });
    }
    revalidator.revalidate();
  };

  const handleBanDialogChange = (open: boolean) => {
    setIsBanDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Manage and monitor all users" : "View all users (read-only)"}
          </p>
        </div>
        <Button onClick={handleCreateUser} size="default" disabled={!isAdmin}>
          Create User
        </Button>
      </div>

      {/* User Table - Scrollable */}
      <div className="flex-1 overflow-auto">
        <UserTable
          users={paginatedUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBan={handleBan}
          onUnban={handleUnban}
          isLoading={false}
          isAdmin={isAdmin}
        />
      </div>

      {/* Pagination */}
      {users.length > itemsPerPage && (
        <div className="mt-4 flex items-center justify-between border-t pt-4 flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <UserCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit User Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogChange}
        onSuccess={handleEditSuccess}
      />

      {/* Delete User Dialog */}
      <UserDeleteDialog
        user={selectedUser}
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        onSuccess={handleDeleteSuccess}
      />

      {/* Ban User Dialog */}
      <UserBanDialog
        user={selectedUser}
        open={isBanDialogOpen}
        onOpenChange={handleBanDialogChange}
        onSuccess={handleBanSuccess}
      />
    </div>
  );
}
