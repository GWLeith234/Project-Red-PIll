import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, type Role, type Permission } from "@shared/schema";
import {
  Shield, UserPlus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp,
  Search, Users, Crown, Eye, KeyRound, Mail, User as UserIcon
} from "lucide-react";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
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

const AVATAR_COLORS: Record<string, string> = {
  admin: "from-primary to-primary/70 text-primary-foreground",
  editor: "from-blue-500 to-blue-600 text-white",
  viewer: "from-slate-500 to-slate-600 text-white",
};

const ROLE_CONFIG: Record<string, { icon: typeof Crown; label: string; color: string }> = {
  admin: { icon: Crown, label: "Admin", color: "bg-primary/15 text-primary border-primary/30" },
  editor: { icon: Pencil, label: "Editor", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  viewer: { icon: Eye, label: "Viewer", color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

function formatRelativeDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("/api/users"),
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u: UserData) => {
      const matchesSearch = !searchQuery ||
        (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: users.length, admin: 0, editor: 0, viewer: 0 };
    users.forEach((u: UserData) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteConfirm(null);
    },
  });

  return (
    <div data-testid="users-admin-page" className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary tracking-tight" data-testid="text-page-title">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team members, roles, and permissions</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingUser(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 w-full sm:w-auto justify-center"
          data-testid="button-add-user"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "All", icon: Users },
          { key: "admin", label: "Admins", icon: Crown },
          { key: "editor", label: "Editors", icon: Pencil },
          { key: "viewer", label: "Viewers", icon: Eye },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              roleFilter === tab.key
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-card/50 text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground"
            }`}
            data-testid={`filter-role-${tab.key}`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
              roleFilter === tab.key ? "bg-primary/20" : "bg-muted"
            }`}>
              {roleCounts[tab.key] || 0}
            </span>
          </button>
        ))}

        <div className="w-full sm:w-auto sm:ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-card/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 w-full sm:w-56 transition-all"
            data-testid="input-search-users"
          />
        </div>
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
        <div className="border border-border rounded-xl bg-card/30 backdrop-blur-sm">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted/50 rounded" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-border rounded-xl bg-card/30 backdrop-blur-sm text-center py-16">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {searchQuery || roleFilter !== "all" ? "No users match your filters" : "No users found"}
          </p>
          {(searchQuery || roleFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setRoleFilter("all"); }}
              className="text-primary text-sm mt-2 hover:underline"
              data-testid="button-clear-filters"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_90px_100px_70px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last Login</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredUsers.map((u: UserData) => {
            const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.viewer;
            const RoleIcon = roleConf.icon;
            const isExpanded = expandedUser === u.id;
            const isCurrentUser = u.id === currentUser?.id;

            return (
              <div
                key={u.id}
                className={`border-b border-border/60 last:border-b-0 transition-colors ${isExpanded ? "bg-muted/10" : "hover:bg-muted/5"}`}
                data-testid={`row-user-${u.id}`}
              >
                <div className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_100px_90px_100px_70px] gap-3 px-5 py-3 items-start sm:items-center">
                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[u.role] || AVATAR_COLORS.viewer} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
                      {(u.displayName || u.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate" data-testid={`text-username-${u.id}`}>
                          {u.displayName || u.username}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">You</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/60 truncate">@{u.username}</p>
                    </div>
                    <div className="flex items-center gap-0.5 sm:hidden ml-auto">
                      <button
                        onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                        className="p-1.5 hover:bg-muted/80 rounded-md transition-colors text-muted-foreground/60 hover:text-foreground"
                        title="View permissions"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => { setEditingUser(u); setShowForm(false); }}
                        className="p-1.5 hover:bg-muted/80 rounded-md transition-colors text-muted-foreground/60 hover:text-foreground"
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!isCurrentUser && (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground/60 hover:text-red-400"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:contents pl-12 sm:pl-0">
                    <span className="text-sm text-muted-foreground truncate sm:block hidden">{u.email || <span className="text-muted-foreground/30 italic">No email</span>}</span>
                    <span className="text-xs text-muted-foreground truncate block sm:hidden">{u.email || ""}</span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border w-fit ${roleConf.color}`}
                      data-testid={`text-role-${u.id}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {roleConf.label}
                    </span>

                    <span data-testid={`text-status-${u.id}`}>
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-400/70">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400/70" />
                          Inactive
                        </span>
                      )}
                    </span>

                    <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                      {formatRelativeDate(u.lastLoginAt)}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                      className="p-1.5 hover:bg-muted/80 rounded-md transition-colors text-muted-foreground/60 hover:text-foreground"
                      title="View permissions"
                      data-testid={`button-expand-${u.id}`}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditingUser(u); setShowForm(false); }}
                      className="p-1.5 hover:bg-muted/80 rounded-md transition-colors text-muted-foreground/60 hover:text-foreground"
                      title="Edit user"
                      data-testid={`button-edit-${u.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground/60 hover:text-red-400"
                        title="Delete user"
                        data-testid={`button-delete-${u.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {deleteConfirm === u.id && (
                  <div className="mx-5 mb-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="text-sm text-red-400">
                      Delete <span className="font-medium">{u.displayName || u.username}</span>? This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors"
                        data-testid={`button-cancel-delete-${u.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(u.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                        data-testid={`button-confirm-delete-${u.id}`}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="mx-5 mb-4 p-4 bg-muted/5 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</span>
                      {u.role === "admin" && (
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">Full Access</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
                      {PERMISSION_GROUPS.map(group => (
                        <div key={group.label}>
                          <p className="text-[11px] font-medium text-foreground/60 uppercase tracking-wider mb-1.5">{group.label}</p>
                          <div className="space-y-1">
                            {group.perms.map(perm => {
                              const has = u.role === "admin" || (u.permissions || []).includes(perm);
                              return (
                                <div key={perm} className="flex items-center gap-1.5 text-xs">
                                  {has ? (
                                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                                  ) : (
                                    <X className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                  )}
                                  <span className={has ? "text-foreground/80" : "text-muted-foreground/40"}>
                                    {PERMISSION_LABELS[perm] || perm}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
    <div className="border border-border rounded-xl bg-card/60 backdrop-blur-sm p-6 mb-5 shadow-sm" data-testid="user-form">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
          {user ? <Pencil className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-primary" />}
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {user ? "Edit User" : "Create New User"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {user ? `Updating ${user.displayName || user.username}` : "Add a new team member"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!user && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <UserIcon className="h-3 w-3" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                required
                minLength={3}
                placeholder="Enter username"
                data-testid="input-new-username"
              />
            </div>
          )}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <KeyRound className="h-3 w-3" />
              {user ? "New Password" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder={user ? "Leave blank to keep current" : "Min 6 characters"}
              {...(!user ? { required: true, minLength: 6 } : {})}
              data-testid="input-new-password"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <UserIcon className="h-3 w-3" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Full name"
              data-testid="input-new-displayname"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Mail className="h-3 w-3" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="user@company.com"
              data-testid="input-new-email"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Shield className="h-3 w-3" />
              Role
            </label>
            <div className="flex gap-2">
              {ROLES.map(r => {
                const conf = ROLE_CONFIG[r] || ROLE_CONFIG.viewer;
                const RIcon = conf.icon;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      role === r
                        ? `${conf.color} border-current`
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`button-role-${r}`}
                  >
                    <RIcon className="h-3.5 w-3.5" />
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {[
                { value: "active", label: "Active", dotColor: "bg-emerald-400" },
                { value: "inactive", label: "Inactive", dotColor: "bg-red-400/70" },
              ].map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    status === s.value
                      ? "bg-muted/50 border-foreground/20 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                  data-testid={`button-status-${s.value}`}
                >
                  <span className={`h-2 w-2 rounded-full ${s.dotColor}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowPerms(!showPerms)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-permissions"
          >
            <Shield className="h-3.5 w-3.5" />
            {showPerms ? "Hide" : "Customize"} Permissions
            {showPerms ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showPerms && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-border/50 bg-muted/5 rounded-lg">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="space-y-1.5">
                  <p className="text-[11px] font-medium text-foreground/60 uppercase tracking-wider">{group.label}</p>
                  {group.perms.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-xs cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={role === "admin" || permissions.includes(perm)}
                        disabled={role === "admin"}
                        onChange={() => togglePermission(perm)}
                        className="accent-primary rounded"
                        data-testid={`checkbox-perm-${perm}`}
                      />
                      <span className="text-foreground/70 group-hover:text-foreground transition-colors">{PERMISSION_LABELS[perm] || perm}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2" data-testid="text-form-error">
            <X className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50"
            data-testid="button-submit-user"
          >
            {isSubmitting ? "Saving..." : user ? "Update User" : "Create User"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-border text-muted-foreground font-medium text-sm rounded-lg hover:bg-muted/50 transition-colors"
            data-testid="button-cancel-user"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
