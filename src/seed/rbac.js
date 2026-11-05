require('dotenv').config();
const { Role, Permission } = require('../models')
const { connectDb } = require('../config')
const permissions = [
  // Users
  {
    resource: "users",
    action: "read",
    key: "users:read",
    displayName: "View Users",
  },
  {
    resource: "users",
    action: "update",
    key: "users:update",
    displayName: "Update Users",
  },
  {
    resource: "users",
    action: "block",
    key: "users:block",
    displayName: "Block Users",
  },

  // Providers
  {
    resource: "providers",
    action: "read",
    key: "providers:read",
    displayName: "View Providers",
  },
  {
    resource: "providers",
    action: "update",
    key: "providers:update",
    displayName: "Update Providers",
  },
  {
    resource: "providers",
    action: "approve",
    key: "providers:approve",
    displayName: "Approve Providers",
  },
  {
    resource: "providers",
    action: "reject",
    key: "providers:reject",
    displayName: "Reject Providers",
  },
  {
    resource: "providers",
    action: "suspend",
    key: "providers:suspend",
    displayName: "Suspend Providers",
  },

  // Services
  {
    resource: "services",
    action: "read",
    key: "services:read",
    displayName: "View Services",
  },
  {
    resource: "services",
    action: "create",
    key: "services:create",
    displayName: "Create Services",
  },
  {
    resource: "services",
    action: "update",
    key: "services:update",
    displayName: "Update Services",
  },
  {
    resource: "services",
    action: "delete",
    key: "services:delete",
    displayName: "Delete Services",
  },

  // Bookings
  {
    resource: "bookings",
    action: "read",
    key: "bookings:read",
    displayName: "View Bookings",
  },
  {
    resource: "bookings",
    action: "create",
    key: "bookings:create",
    displayName: "Create Bookings",
  },
  {
    resource: "bookings",
    action: "update",
    key: "bookings:update",
    displayName: "Update Bookings",
  },
  {
    resource: "bookings",
    action: "cancel",
    key: "bookings:cancel",
    displayName: "Cancel Bookings",
  },

  // Reviews
  {
    resource: "reviews",
    action: "read",
    key: "reviews:read",
    displayName: "View Reviews",
  },
  {
    resource: "reviews",
    action: "create",
    key: "reviews:create",
    displayName: "Create Reviews",
  },
  {
    resource: "reviews",
    action: "update",
    key: "reviews:update",
    displayName: "Update Reviews",
  },
  {
    resource: "reviews",
    action: "delete",
    key: "reviews:delete",
    displayName: "Delete Reviews",
  },

  // Categories
  {
    resource: "categories",
    action: "read",
    key: "categories:read",
    displayName: "View Categories",
  },
  {
    resource: "categories",
    action: "create",
    key: "categories:create",
    displayName: "Create Categories",
  },
  {
    resource: "categories",
    action: "update",
    key: "categories:update",
    displayName: "Update Categories",
  },
  {
    resource: "categories",
    action: "delete",
    key: "categories:delete",
    displayName: "Delete Categories",
  },

  // Reports
  {
    resource: "reports",
    action: "read",
    key: "reports:read",
    displayName: "View Reports",
  },
  {
    resource: "reports",
    action: "export",
    key: "reports:export",
    displayName: "Export Reports",
  },
  {
    resource: "dashboard",
    action: "super_admin",
    key: "dashboard:super_admin",
    displayName: "Super Admin Dashboard",
  },
 {
    resource: "dashboard",
    action: "admin",
    key: "dashboard:admin",
    displayName: "Admin Dashboard",
  },
  {
    resource: "dashboard",
    action: "provider",
    key: "dashboard:provider",
    displayName: "Provider Dashboard",
  }
];
const roles = [
  {
    name: "user",
    displayName: "User",
    description: "Regular Locafy user",
    isSystemRole: true,
    isActive: true,
  },

  {
    name: "provider",
    displayName: "Service Provider",
    description: "User who provides services on Locafy",
    isSystemRole: true,
    isActive: true,
  },

  {
    name: "admin",
    displayName: "Administrator",
    description: "Locafy administrator",
    isSystemRole: true,
    isActive: true,
  },

  {
    name: "super_admin",
    displayName: "Super Administrator",
    description: "Full system administrator",
    isSystemRole: true,
    isActive: true,
  },
];
const rolePermissions = {
  user: [
    "providers:read",

    "services:read",

    "bookings:create",
    "bookings:read",
    "bookings:cancel",

    "reviews:create",
    "reviews:read",
  ],

  provider: [
    "providers:read",
    "providers:update",

    "services:read",
    "services:create",
    "services:update",
    "services:delete",

    "bookings:read",
    "bookings:update",

    "reviews:read",

    "dashboard:provider"
  ],

  admin: [
    "users:read",
    "users:update",
    "users:block",

    "providers:read",
    "providers:update",
    "providers:approve",
    "providers:reject",
    "providers:suspend",

    "services:read",
    "services:update",

    "bookings:read",

    "reviews:read",
    "reviews:delete",

    "categories:read",
    "categories:create",
    "categories:update",
    "categories:delete",

    "reports:read",
    "reports:export",

    "dashboard:admin"
  ],
};
const seedPermissions = async () => {
  const operations = permissions.map((permission) => ({
    updateOne: {
      filter: {
        key: permission.key,
      },

      update: {
        $set: {
          resource: permission.resource,
          action: permission.action,
          displayName: permission.displayName,
          isActive: true,
          isSystemPermission: true,
        },

        $setOnInsert: {
          key: permission.key,
          description: "",
        },
      },

      upsert: true,
    },
  }));

  const result = await Permission.bulkWrite(operations);

  console.log("Permission seed completed");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
  console.log("Inserted:", result.upsertedCount);
};

const seedRoles = async () => {
  const operations = roles.map((role) => ({
    updateOne: {
      filter: {
        name: role.name,
      },

      update: {
        $set: {
          displayName: role.displayName,
          description: role.description,
          isActive: role.isActive,
          isSystemRole: role.isSystemRole,
        },

        $setOnInsert: {
          name: role.name,
        },
      },

      upsert: true,
    },
  }));

  const result = await Role.bulkWrite(operations);

  console.log("Role seed completed");
  console.log("Matched:", result.matchedCount);
  console.log("Modified:", result.modifiedCount);
  console.log("Inserted:", result.upsertedCount);
};

const assignPermissionsToRoles = async () => {
  for (const [roleName, permissionKeys] of Object.entries(rolePermissions)) {
    const role = await Role.findOne({
      name: roleName,
    });

    if (!role) {
      throw new Error(`Role not found: ${roleName}`);
    }

    const permissions = await Permission.find({
      key: { $in: permissionKeys },
      isActive: true,
    }).select("_id key");

    const foundKeys = new Set(
      permissions.map((permission) => permission.key)
    );

    const missingPermissions = permissionKeys.filter(
      (key) => !foundKeys.has(key)
    );

    if (missingPermissions.length > 0) {
      throw new Error(
        `Missing permissions for ${roleName}: ${missingPermissions.join(", ")}`
      );
    }

    role.permissionsId = permissions.map(
      (permission) => permission._id
    );

    await role.save();

    console.log(
      `${roleName}: ${permissions.length} permissions assigned`
    );
  }
};
const assignSuperAdminPermissions = async () => {
  const role = await Role.findOne({
    name: "super_admin",
  });

  if (!role) {
    throw new Error("super_admin role not found");
  }

  const permissions = await Permission.find({
    isActive: true,
  }).select("_id");

  role.permissionsId = permissions.map(
    (permission) => permission._id
  );

  await role.save();

  console.log(
    `super_admin: ${permissions.length} permissions assigned`
  );
};
const runSeed = async () => {
  try {
    await connectDb();

    await seedPermissions();
    await seedRoles();
    await assignPermissionsToRoles();
    await assignSuperAdminPermissions();

    console.log("RBAC seed completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("RBAC seed failed:", error);

    process.exit(1);
  }
};

runSeed();