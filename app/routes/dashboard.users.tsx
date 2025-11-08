import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router";
import type { Route } from "./+types/dashboard.users";
import { useUsers } from "~/contexts/UserContext";
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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Management - Dashboard" },
    { name: "description", content: "Manage users in the system" },
  ];
}

export default function DashboardUsers() {
  const { user } = useOutletContext<DashboardContext>();
  const { users, isLoading, error, fetchUsers, unbanUser } = useUsers();
  const { logActivity } = useActivity();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, itemsPerPage]);

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
    fetchUsers();
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
    fetchUsers();
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
    fetchUsers();
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
      await unbanUser(targetUser.id);
      toast.success(`${targetUser.name} has been unbanned`);
      logActivity({
        action: "Unbanned user",
        user: user.name,
        target: targetUser.email,
        type: "unban",
      });
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
    fetchUsers();
  };

  const handleBanDialogChange = (open: boolean) => {
    setIsBanDialogOpen(open);
    if (!open) {
      setSelectedUser(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor all users
          </p>
        </div>
        <Button onClick={handleCreateUser} size="default">
          Create User
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/50 p-3 flex-shrink-0">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">
                Error loading users
              </h3>
              <p className="mt-1 text-sm text-destructive/90">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* User Table - Scrollable */}
      <div className="flex-1 overflow-auto">
        <UserTable
          users={paginatedUsers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBan={handleBan}
          onUnban={handleUnban}
          isLoading={isLoading}
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
