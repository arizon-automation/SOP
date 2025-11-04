/**
 * 数据库迁移脚本
 * 执行SQL迁移文件，创建所有必需的表
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 开始数据库迁移...');
  
  // 检查DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    console.log('请先创建 .env.local 文件并设置 DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false  // Neon需要SSL
    }
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../db/migrations/001_create_sop_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 执行迁移
    console.log('📝 执行迁移文件: 001_create_sop_tables.sql');
    await client.query(sql);

    console.log('✅ 数据库迁移完成！');
    console.log('\n📊 已创建以下表:');
    console.log('  - sop_users (用户表)');
    console.log('  - sop_sessions (会话表)');
    console.log('  - sop_documents (文档表)');
    console.log('  - sops (SOP主表)');
    console.log('  - sop_content_blocks (内容块表)');
    console.log('  - sop_qa_history (问答历史表)');
    console.log('  - sop_approvals (审批表)');
    console.log('  - sop_analytics (分析统计表)');
    
    console.log('\n👤 默认管理员账号:');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('  邮箱: admin@arizon.com.au');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 提示: 表可能已经存在，这是正常的。');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

