/**
 * 启用pgvector扩展并创建向量索引
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function enablePgVector() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 正在启用pgvector扩展...\n');

    // 读取SQL文件
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '003_enable_pgvector.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行SQL
    await pool.query(sql);

    console.log('✅ pgvector扩展已启用');
    console.log('✅ 向量索引已创建');
    console.log('✅ embedding列已配置为1536维度\n');

    // 验证扩展
    const result = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );

    if (result.rows.length > 0) {
      console.log('✅ 验证成功：pgvector扩展已安装');
      console.log(`   版本: ${result.rows[0].extversion || '未知'}\n`);
    } else {
      console.log('⚠️  警告：pgvector扩展未找到');
      console.log('   请在Neon控制台中手动启用pgvector扩展\n');
      console.log('   步骤：');
      console.log('   1. 登录 https://console.neon.tech');
      console.log('   2. 选择你的项目');
      console.log('   3. 进入Extensions标签');
      console.log('   4. 启用pgvector扩展\n');
    }

    // 检查现有数据
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_blocks,
        COUNT(embedding) as blocks_with_embedding,
        COUNT(CASE WHEN embedding_generated THEN 1 END) as blocks_marked_generated
      FROM sop_content_blocks
    `);

    const stats = statsResult.rows[0];
    console.log('📊 当前数据统计：');
    console.log(`   总内容块: ${stats.total_blocks}`);
    console.log(`   已有嵌入: ${stats.blocks_with_embedding}`);
    console.log(`   标记已生成: ${stats.blocks_marked_generated}`);

    if (parseInt(stats.total_blocks) > 0 && parseInt(stats.blocks_with_embedding) === 0) {
      console.log('\n⚠️  需要为现有内容块生成嵌入');
      console.log('   运行: node scripts/generate-embeddings.js\n');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    if (error.message.includes('extension "vector" does not exist')) {
      console.log('\n💡 解决方案：');
      console.log('   pgvector扩展未在数据库中启用');
      console.log('   请访问Neon控制台启用pgvector扩展：');
      console.log('   https://console.neon.tech\n');
    }
  } finally {
    await pool.end();
  }
}

enablePgVector();

