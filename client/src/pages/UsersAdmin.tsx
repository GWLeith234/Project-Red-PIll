import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, type Role, type Permission } from "@shared/schema";
import { Shield, UserPlus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

interface UserData {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role: string;
  permissions: string[] | null;
  status: string;
  createdAt: string | null;
  lastLoginAt: string | null;
}

const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "View Dashboard",
  "content.view": "View Content",
  "content.edit": "Edit Content",
  "monetization.view": "View Monetization",
  "monetization.edit": "Edit Monetization",
  "network.view": "View Network",
  "network.edit": "Edit Network",
  "audience.view": "View Audience",
  "analytics.view": "View Analytics",
  "customize.view": "View Customize",
  "customize.edit": "Edit Customize",
  "settings.view": "View Settings",
  "settings.edit": "Edit Settings",
  "users.view": "View Users",
  "users.edit": "Manage Users",
};

const PERMISSION_GROUPS = [
  { label: "Dashboard", perms: ["dashboard.view"] },
  { label: "Content", perms: ["content.view", "content.edit"] },
  { label: "Monetization", perms: ["monetization.view", "monetization.edit"] },
  { label: "Network", perms: ["network.view", "network.edit"] },
  { label: "Audience", perms: ["audience.view"] },
  { label: "Analytics", perms: ["analytics.view"] },
  { label: "Customize", perms: ["customize.view", "customize.edit"] },
  { label: "Settings", perms: ["settings.view", "settings.edit"] },
  { label: "User Management", perms: ["users.view", "users.edit"] },
];

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin": return "bg-primary/20 text-primary border-primary/30";
    case "editor": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function statusBadgeClass(status: string) {
  return status === "active"
    ? "bg-accent/20 text-accent border-accent/30"
    : "bg-red-500/20 text-red-400 border-red-500/30";
}

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/users", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
  });

  return (
    <div data-testid="users-admin-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight" data-testid="text-page-title">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members, roles, and permissions</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingUser(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
          data-testid="button-add-user"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {(showForm || editingUser) && (
        <UserForm
          user={editingUser}
          onSubmit={(data) => {
            if (editingUser) {
              updateMutation.mutate({ id: editingUser.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => { setShowForm(false); setEditingUser(null); }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      ) : (
        <div className="border border-border bg-card/50 backdrop-blur-sm">
          <div className="grid grid-cols-[1fr_1fr_120px_100px_160px_80px] gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last Login</span>
            <span>Actions</span>
          </div>

          {users.map((u: UserData) => (
            <div key={u.id} className="border-b border-border last:border-b-0" data-testid={`row-user-${u.id}`}>
              <div className="grid grid-cols-[1fr_1fr_120px_100px_160px_80px] gap-4 px-4 py-3 items-center">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold text-xs">
                    {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`text-username-${u.id}`}>{u.displayName || u.username}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground truncate">{u.email || "—"}</span>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase border ${roleBadgeClass(u.role)} w-fit`} data-testid={`text-role-${u.id}`}>
                  {u.role}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase border ${statusBadgeClass(u.status)} w-fit`} data-testid={`text-status-${u.id}`}>
                  {u.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                    title="View permissions"
                    data-testid={`button-expand-${u.id}`}
                  >
                    {expandedUser === u.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingUser(u); setShowForm(false); }}
                    className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground"
                    title="Edit user"
                    data-testid={`button-edit-${u.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete user "${u.displayName || u.username}"?`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-sm transition-colors text-muted-foreground hover:text-red-400"
                      title="Delete user"
                      data-testid={`button-delete-${u.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {expandedUser === u.id && (
                <div className="px-4 pb-4 pt-1 bg-muted/10 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Permissions</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PERMISSION_GROUPS.map(group => (
                      <div key={group.label} className="space-y-1">
                        <p className="text-xs font-medium text-foreground/80">{group.label}</p>
                        {group.perms.map(perm => {
                          const has = u.role === "admin" || (u.permissions || []).includes(perm);
                          return (
                            <div key={perm} className="flex items-center gap-1.5 text-xs">
                              {has ? (
                                <Check className="h-3 w-3 text-accent" />
                              ) : (
                                <X className="h-3 w-3 text-red-400/60" />
                              )}
                              <span className={has ? "text-foreground" : "text-muted-foreground/60"}>
                                {PERMISSION_LABELS[perm] || perm}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

function UserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}: {
  user: UserData | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string;
}) {
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<Role>((user?.role as Role) || "viewer");
  const [status, setStatus] = useState(user?.status || "active");
  const [permissions, setPermissions] = useState<string[]>(
    user?.permissions || DEFAULT_ROLE_PERMISSIONS[role] || []
  );
  const [showPerms, setShowPerms] = useState(false);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
  };

  const togglePermission = (perm: string) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { displayName: displayName || username, email: email || null, role, permissions, status };
    if (!user) {
      data.username = username;
      data.password = password;
    }
    if (user && password) {
      data.password = password;
    }
    onSubmit(data);
  };

  return (
    <div className="border border-border bg-card/80 backdrop-blur-sm p-6 mb-6" data-testid="user-form">
      <h2 className="text-lg font-display font-bold text-primary mb-4">
        {user ? "Edit User" : "Create New User"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {!user && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                required
                minLength={3}
                data-testid="input-new-username"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              {user ? "New Password (leave blank to keep)" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              {...(!user ? { required: true, minLength: 6 } : {})}
              data-testid="input-new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              data-testid="input-new-displayname"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              data-testid="input-new-email"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              data-testid="select-role"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              data-testid="select-status"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowPerms(!showPerms)}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-permissions"
          >
            <Shield className="h-3.5 w-3.5" />
            {showPerms ? "Hide" : "Customize"} Permissions
            {showPerms ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showPerms && (
            <div className="mt-3 grid grid-cols-3 gap-4 p-4 border border-border bg-muted/10">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-medium text-foreground/80">{group.label}</p>
                  {group.perms.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role === "admin" || permissions.includes(perm)}
                        disabled={role === "admin"}
                        onChange={() => togglePermission(perm)}
                        className="accent-primary"
                        data-testid={`checkbox-perm-${perm}`}
                      />
                      <span className="text-foreground/80">{PERMISSION_LABELS[perm] || perm}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2" data-testid="text-form-error">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-submit-user"
          >
            {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-border text-muted-foreground font-mono text-sm uppercase tracking-wider hover:bg-muted transition-colors"
            data-testid="button-cancel-user"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
