/**
 * Permission IDs must match backend `config/permissions.js` (module:menu:action).
 */

export const PID = {
  dashboard: {
    main: {
      create: "dashboard:main_dashboard:create",
      read: "dashboard:main_dashboard:read",
      update: "dashboard:main_dashboard:update",
      delete: "dashboard:main_dashboard:delete",
    },
  },
  branch: {
    management: {
      create: "branch:branch_management:create",
      read: "branch:branch_management:read",
      update: "branch:branch_management:update",
      delete: "branch:branch_management:delete",
    },
  },
  inventory: {
    product: {
      create: "inventory:product_database:create",
      read: "inventory:product_database:read",
      update: "inventory:product_database:update",
      delete: "inventory:product_database:delete",
    },
    stock: {
      create: "inventory:stock_management:create",
      read: "inventory:stock_management:read",
      update: "inventory:stock_management:update",
      delete: "inventory:stock_management:delete",
    },
    vendor: {
      create: "inventory:vendor_management:create",
      read: "inventory:vendor_management:read",
      update: "inventory:vendor_management:update",
      delete: "inventory:vendor_management:delete",
    },
  },
  pos: {
    transaction: {
      create: "point_of_sale:transaction:create",
      read: "point_of_sale:transaction:read",
      update: "point_of_sale:transaction:update",
      delete: "point_of_sale:transaction:delete",
    },
    returns: {
      create: "point_of_sale:returns_exchanges:create",
      read: "point_of_sale:returns_exchanges:read",
      update: "point_of_sale:returns_exchanges:update",
      delete: "point_of_sale:returns_exchanges:delete",
    },
  },
  customer: {
    database: {
      create: "customer_management:customer_database:create",
      read: "customer_management:customer_database:read",
      update: "customer_management:customer_database:update",
      delete: "customer_management:customer_database:delete",
    },
  },
  reporting: {
    sales: {
      create: "reporting_analytics:sales_reports:create",
      read: "reporting_analytics:sales_reports:read",
      update: "reporting_analytics:sales_reports:update",
      delete: "reporting_analytics:sales_reports:delete",
    },
  },
  employee: {
    database: {
      create: "employee:employee_database:create",
      read: "employee:employee_database:read",
      update: "employee:employee_database:update",
      delete: "employee:employee_database:delete",
    },
    shift: {
      create: "employee:shift_management:create",
      read: "employee:shift_management:read",
      update: "employee:shift_management:update",
      delete: "employee:shift_management:delete",
    },
    performance: {
      create: "employee:performance_management:create",
      read: "employee:performance_management:read",
      update: "employee:performance_management:update",
      delete: "employee:performance_management:delete",
    },
  },
  settings: {
    security: {
      create: "settings:security_settings:create",
      read: "settings:security_settings:read",
      update: "settings:security_settings:update",
      delete: "settings:security_settings:delete",
    },
    users: {
      create: "settings:user_management:create",
      read: "settings:user_management:read",
      update: "settings:user_management:update",
      delete: "settings:user_management:delete",
    },
  },
} as const;
