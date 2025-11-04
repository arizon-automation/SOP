/**
 * 运行002迁移：添加分类和语言支持
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 开始运行迁移 002...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    const sql = fs.readFileSync(
      path.join(__dirname, '../db/migrations/002_add_category_and_language.sql'),
      'utf8'
    );

    console.log('📝 执行迁移: 添加分类树和语言支持...');
    await client.query(sql);

    console.log('✅ 迁移 002 完成！');
    console.log('\n📊 已添加:');
    console.log('  - category_id 字段');
    console.log('  - supervisor_analysis 字段');
    console.log('  - approval_status 字段');
    console.log('  - approval_notes 字段');
    console.log('  - 相关索引和视图');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 提示: 字段可能已经存在，这是正常的。');
    }
  } finally {
    await client.end();
  }
}

runMigration();

