/**
 * 国际化（i18n）配置和翻译
 */

export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // 通用
    common: {
      back: '返回',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      confirm: '确认',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      search: '搜索',
      filter: '筛选',
      export: '导出',
      import: '导入',
    },
    
    // 导航
    nav: {
      dashboard: '仪表板',
      documents: '文档管理',
      sops: 'SOP管理',
      upload: '上传文档',
      logout: '退出登录',
    },
    
    // 仪表板
    dashboard: {
      title: 'AI驱动的SOP管理系统',
      welcome: '欢迎回来',
      documentsTitle: '文档管理',
      documentsDesc: '上传和管理操作文档',
      sopsTitle: 'SOP管理',
      sopsDesc: '查看和管理标准操作流程',
    },
    
    // 文档管理
    documents: {
      title: '文档管理',
      uploadNew: '上传新文档',
      list: '文档列表',
      detail: '文档详情',
      uploaded: '已上传',
      parsing: '解析中',
      parsed: '已解析',
      failed: '失败',
      preview: '预览文档',
      download: '下载文档',
      analyze: '智能分析 & 生成SOP',
      analyzing: '智能分析中...',
      processed: '已处理',
      deleteConfirm: '确定要删除这个文档吗？此操作无法撤销。',
      deleting: '删除中...',
      fileType: '文件类型',
      fileSize: '文件大小',
      uploader: '上传者',
      uploadTime: '上传时间',
      status: '状态',
      basicInfo: '基本信息',
      errorMessage: '错误信息',
      parsedPreview: '解析结果（预览）',
      actions: '操作',
      relatedSOPs: '关联的SOP',
      noRelatedSOPs: '此文档还没有生成SOP',
    },
    
    // SOP管理
    sops: {
      title: 'SOP管理',
      list: 'SOP列表',
      detail: 'SOP详情',
      version: '版本',
      department: '部门',
      category: '分类',
      language: '语言',
      chinese: '中文',
      english: '英文',
      steps: '步骤',
      createdBy: '创建者',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      description: '描述',
      responsible: '负责人',
      conditions: '条件',
      notes: '备注',
      deleteConfirm: '确定要删除这个SOP吗？此操作无法撤销。',
      deleting: '删除中...',
      noDescription: '暂无描述',
      viewTranslation: '查看译文',
      backToList: '返回列表',
      imagesInSteps: '📷 图片已嵌入在对应步骤中',
      imageCount: '张指导图片',
    },
    
    // 文件上传
    upload: {
      title: '上传文档',
      dragDrop: '拖拽文件到这里，或点击选择文件',
      supported: '支持 PDF、Word (.docx) 文档',
      maxSize: '最大文件大小',
      uploading: '上传中...',
      success: '上传成功！',
      processing: '正在处理...',
      redirecting: '正在跳转到文档详情页...',
    },
    
    // 冲突分析
    conflicts: {
      title: '冲突分析结果',
      subtitle: '发现与现有SOP的重复或冲突信息',
      summary: '分析总结',
      hasConflicts: '⚠️ 发现与现有SOP存在冲突的信息',
      hasDuplicates: '📋 发现与现有SOP高度重复的内容',
      hasRelated: 'ℹ️ 发现相关但可共存的SOP',
      relatedCount: '个相关的现有SOP',
      relatedList: '相关SOP列表',
      suggestions: '建议操作',
      merge: '合并SOP',
      replace: '替换SOP',
      updateExisting: '更新现有SOP',
      keepBoth: '保留两个版本',
      execute: '执行',
      processing: '处理中...',
      ignoreCreate: '忽略冲突，创建新SOP',
      creating: '创建中...',
      conflictTypes: {
        duplicate: '重复',
        conflicting: '冲突',
        partial_overlap: '部分重叠',
        complementary: '互补',
      },
      similarity: '相似',
    },
    
    // 登录
    auth: {
      login: '登录',
      email: '邮箱',
      password: '密码',
      loginButton: '登录',
      loggingIn: '登录中...',
      logout: '退出登录',
      welcome: '欢迎使用 SOP 管理系统',
    },
  },
  
  en: {
    // Common
    common: {
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
    },
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      documents: 'Documents',
      sops: 'SOPs',
      upload: 'Upload',
      logout: 'Logout',
    },
    
    // Dashboard
    dashboard: {
      title: 'AI-Driven SOP Management System',
      welcome: 'Welcome Back',
      documentsTitle: 'Document Management',
      documentsDesc: 'Upload and manage operation documents',
      sopsTitle: 'SOP Management',
      sopsDesc: 'View and manage standard operating procedures',
    },
    
    // Documents
    documents: {
      title: 'Document Management',
      uploadNew: 'Upload New Document',
      list: 'Document List',
      detail: 'Document Details',
      uploaded: 'Uploaded',
      parsing: 'Parsing',
      parsed: 'Parsed',
      failed: 'Failed',
      preview: 'Preview Document',
      download: 'Download Document',
      analyze: '🤖 Analyze & Generate SOP',
      analyzing: 'Analyzing...',
      processed: 'Processed',
      deleteConfirm: 'Are you sure you want to delete this document? This action cannot be undone.',
      deleting: 'Deleting...',
      fileType: 'File Type',
      fileSize: 'File Size',
      uploader: 'Uploader',
      uploadTime: 'Upload Time',
      status: 'Status',
      basicInfo: 'Basic Information',
      errorMessage: 'Error Message',
      parsedPreview: 'Parsed Content (Preview)',
      actions: 'Actions',
      relatedSOPs: 'Related SOPs',
      noRelatedSOPs: 'No SOPs generated yet',
    },
    
    // SOPs
    sops: {
      title: 'SOP Management',
      list: 'SOP List',
      detail: 'SOP Details',
      version: 'Version',
      department: 'Department',
      category: 'Category',
      language: 'Language',
      chinese: 'Chinese',
      english: 'English',
      steps: 'Steps',
      createdBy: 'Created By',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      description: 'Description',
      responsible: 'Responsible',
      conditions: 'Conditions',
      notes: 'Notes',
      deleteConfirm: 'Are you sure you want to delete this SOP? This action cannot be undone.',
      deleting: 'Deleting...',
      noDescription: 'No description',
      viewTranslation: 'View Translation',
      backToList: 'Back to List',
      imagesInSteps: '📷 Images are embedded in respective steps',
      imageCount: 'instructional images',
    },
    
    // Upload
    upload: {
      title: 'Upload Document',
      dragDrop: 'Drag and drop files here, or click to select',
      supported: 'Supports PDF and Word (.docx) documents',
      maxSize: 'Maximum file size',
      uploading: 'Uploading...',
      success: 'Upload successful!',
      processing: 'Processing...',
      redirecting: 'Redirecting to document details...',
    },
    
    // Conflicts
    conflicts: {
      title: 'Conflict Analysis Results',
      subtitle: 'Found duplicate or conflicting information with existing SOPs',
      summary: 'Analysis Summary',
      hasConflicts: '⚠️ Conflicts detected with existing SOPs',
      hasDuplicates: '📋 Duplicates detected with existing SOPs',
      hasRelated: 'ℹ️ Related but compatible SOPs found',
      relatedCount: 'related existing SOPs',
      relatedList: 'Related SOPs',
      suggestions: 'Suggested Actions',
      merge: '🔀 Merge SOPs',
      replace: '♻️ Replace SOP',
      updateExisting: '📝 Update Existing SOP',
      keepBoth: '📚 Keep Both Versions',
      execute: 'Execute',
      processing: 'Processing...',
      ignoreCreate: 'Ignore Conflicts, Create New SOP',
      creating: 'Creating...',
      conflictTypes: {
        duplicate: 'Duplicate',
        conflicting: 'Conflicting',
        partial_overlap: 'Partial Overlap',
        complementary: 'Complementary',
      },
      similarity: 'similar',
    },
    
    // Auth
    auth: {
      login: 'Login',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      logout: 'Logout',
      welcome: 'Welcome to SOP Management System',
    },
  },
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

