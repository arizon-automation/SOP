/**
 * 创建管理员账号
 * 使用正确的密码哈希
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

async function createAdmin() {
  console.log('🚀 创建管理员账号...');
  
  // 检查DATABASE_URL
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

    // 生成密码哈希
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('🔐 密码哈希生成成功');

    // 删除旧的admin用户（如果存在）
    await client.query(`DELETE FROM sop_users WHERE email = 'admin@arizon.com.au'`);
    console.log('🗑️ 清理旧的admin账号');

    // 插入新的admin用户
    const result = await client.query(
      `INSERT INTO sop_users 
       (username, email, password_hash, role, department, language, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, role`,
      ['admin', 'admin@arizon.com.au', passwordHash, 'admin', 'IT', 'zh', true]
    );

    const user = result.rows[0];

    console.log('✅ 管理员账号创建成功！');
    console.log('\n📋 账号信息:');
    console.log(`   ID: ${user.id}`);
    console.log(`   用户名: ${user.username}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   角色: ${user.role}`);
    console.log('\n🔑 登录信息:');
    console.log(`   邮箱: admin@arizon.com.au`);
    console.log(`   密码: admin123`);
    console.log('\n🌐 现在可以登录了: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin();

