/**
 * SOP分类树系统
 * 智能组织和管理SOP的层级结构
 */

export interface CategoryNode {
  id: string;
  name: string;
  nameEn: string;
  nameCn: string;
  description?: string;
  descriptionEn?: string;
  descriptionCn?: string;
  icon?: string;
  parent?: string | null;
  children: CategoryNode[];
  sopCount?: number;
  order?: number;
}

/**
 * 默认分类树结构
 */
export const DEFAULT_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'accounts',
    name: 'Accounts',
    nameEn: 'Accounts',
    nameCn: '财务部',
    description: 'Financial and accounting procedures',
    descriptionEn: 'Financial and accounting procedures',
    descriptionCn: '财务和会计相关流程',
    icon: '💰',
    parent: null,
    order: 1,
    children: [
      {
        id: 'accounts-invoice',
        name: 'Invoice Management',
        nameEn: 'Invoice Management',
        nameCn: '发票管理',
        icon: '📄',
        parent: 'accounts',
        order: 1,
        children: [],
      },
      {
        id: 'accounts-payment',
        name: 'Payment Processing',
        nameEn: 'Payment Processing',
        nameCn: '付款处理',
        icon: '💳',
        parent: 'accounts',
        order: 2,
        children: [],
      },
      {
        id: 'accounts-reconciliation',
        name: 'Account Reconciliation',
        nameEn: 'Account Reconciliation',
        nameCn: '账目核对',
        icon: '🔍',
        parent: 'accounts',
        order: 3,
        children: [],
      },
    ],
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    nameEn: 'Warehouse',
    nameCn: '仓库部',
    description: 'Warehouse and inventory management',
    descriptionEn: 'Warehouse and inventory management',
    descriptionCn: '仓储和库存管理流程',
    icon: '📦',
    parent: null,
    order: 2,
    children: [
      {
        id: 'warehouse-receiving',
        name: 'Goods Receiving',
        nameEn: 'Goods Receiving',
        nameCn: '收货入库',
        icon: '📥',
        parent: 'warehouse',
        order: 1,
        children: [],
      },
      {
        id: 'warehouse-picking',
        name: 'Order Picking',
        nameEn: 'Order Picking',
        nameCn: '拣货出库',
        icon: '📤',
        parent: 'warehouse',
        order: 2,
        children: [],
      },
      {
        id: 'warehouse-inventory',
        name: 'Inventory Management',
        nameEn: 'Inventory Management',
        nameCn: '库存管理',
        icon: '📊',
        parent: 'warehouse',
        order: 3,
        children: [],
      },
      {
        id: 'warehouse-quality',
        name: 'Quality Control',
        nameEn: 'Quality Control',
        nameCn: '质量检验',
        icon: '✓',
        parent: 'warehouse',
        order: 4,
        children: [],
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    nameEn: 'Sales',
    nameCn: '销售部',
    description: 'Sales and customer management',
    descriptionEn: 'Sales and customer management',
    descriptionCn: '销售和客户管理流程',
    icon: '💼',
    parent: null,
    order: 3,
    children: [
      {
        id: 'sales-inquiry',
        name: 'Customer Inquiry',
        nameEn: 'Customer Inquiry',
        nameCn: '客户咨询',
        icon: '💬',
        parent: 'sales',
        order: 1,
        children: [],
      },
      {
        id: 'sales-quotation',
        name: 'Quotation',
        nameEn: 'Quotation',
        nameCn: '报价流程',
        icon: '💵',
        parent: 'sales',
        order: 2,
        children: [],
      },
      {
        id: 'sales-order',
        name: 'Order Processing',
        nameEn: 'Order Processing',
        nameCn: '订单处理',
        icon: '📋',
        parent: 'sales',
        order: 3,
        children: [],
      },
    ],
  },
  {
    id: 'customer-service',
    name: 'Customer Service',
    nameEn: 'Customer Service',
    nameCn: '客服部',
    description: 'Customer service and support',
    descriptionEn: 'Customer service and support',
    descriptionCn: '客户服务和支持流程',
    icon: '🎧',
    parent: null,
    order: 4,
    children: [
      {
        id: 'cs-complaint',
        name: 'Complaint Handling',
        nameEn: 'Complaint Handling',
        nameCn: '投诉处理',
        icon: '⚠️',
        parent: 'customer-service',
        order: 1,
        children: [],
      },
      {
        id: 'cs-return',
        name: 'Return & Refund',
        nameEn: 'Return & Refund',
        nameCn: '退货退款',
        icon: '↩️',
        parent: 'customer-service',
        order: 2,
        children: [],
      },
      {
        id: 'cs-after-sales',
        name: 'After-sales Service',
        nameEn: 'After-sales Service',
        nameCn: '售后服务',
        icon: '🛠️',
        parent: 'customer-service',
        order: 3,
        children: [],
      },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    nameEn: 'Operations',
    nameCn: '运营部',
    description: 'General operations and administration',
    descriptionEn: 'General operations and administration',
    descriptionCn: '日常运营和行政管理',
    icon: '⚙️',
    parent: null,
    order: 5,
    children: [
      {
        id: 'ops-hr',
        name: 'Human Resources',
        nameEn: 'Human Resources',
        nameCn: '人力资源',
        icon: '👥',
        parent: 'operations',
        order: 1,
        children: [],
      },
      {
        id: 'ops-admin',
        name: 'Administration',
        nameEn: 'Administration',
        nameCn: '行政管理',
        icon: '📁',
        parent: 'operations',
        order: 2,
        children: [],
      },
      {
        id: 'ops-it',
        name: 'IT Support',
        nameEn: 'IT Support',
        nameCn: 'IT支持',
        icon: '💻',
        parent: 'operations',
        order: 3,
        children: [],
      },
    ],
  },
];

/**
 * 获取分类的完整路径
 */
export function getCategoryPath(categoryId: string, tree: CategoryNode[]): string[] {
  const path: string[] = [];
  
  function findPath(nodes: CategoryNode[], targetId: string, currentPath: string[]): boolean {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      
      if (node.id === targetId) {
        path.push(...newPath);
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        if (findPath(node.children, targetId, newPath)) {
          return true;
        }
      }
    }
    return false;
  }
  
  findPath(tree, categoryId, []);
  return path;
}

/**
 * 获取分类的显示名称（带完整路径）
 */
export function getCategoryDisplayName(
  categoryId: string,
  tree: CategoryNode[],
  language: 'en' | 'cn' = 'cn'
): string {
  const path = getCategoryPath(categoryId, tree);
  const names: string[] = [];
  
  function getNodeName(nodes: CategoryNode[], id: string): string | null {
    for (const node of nodes) {
      if (node.id === id) {
        return language === 'cn' ? node.nameCn : node.nameEn;
      }
      if (node.children && node.children.length > 0) {
        const childName = getNodeName(node.children, id);
        if (childName) return childName;
      }
    }
    return null;
  }
  
  for (const id of path) {
    const name = getNodeName(tree, id);
    if (name) names.push(name);
  }
  
  return names.join(' / ');
}

/**
 * 查找分类节点
 */
export function findCategory(categoryId: string, tree: CategoryNode[]): CategoryNode | null {
  for (const node of tree) {
    if (node.id === categoryId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findCategory(categoryId, node.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 获取所有叶子节点（用于SOP分类选择）
 */
export function getLeafCategories(tree: CategoryNode[]): CategoryNode[] {
  const leaves: CategoryNode[] = [];
  
  function traverse(nodes: CategoryNode[]) {
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return leaves;
}

export default {
  DEFAULT_CATEGORY_TREE,
  getCategoryPath,
  getCategoryDisplayName,
  findCategory,
  getLeafCategories,
};

