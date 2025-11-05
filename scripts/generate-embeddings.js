/**
 * 为所有现有SOP内容块生成向量嵌入
 * 这个脚本会：
 * 1. 读取所有没有嵌入的内容块
 * 2. 使用OpenAI API生成嵌入
 * 3. 保存到数据库
 */

const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 批量处理大小
const BATCH_SIZE = 10;

// 延迟函数（避免超过API速率限制）
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbeddings() {
  try {
    console.log('🚀 开始生成向量嵌入...\n');

    // 1. 获取所有没有嵌入的内容块
    const result = await pool.query(`
      SELECT id, content, sop_id
      FROM sop_content_blocks
      WHERE embedding IS NULL OR embedding_generated = FALSE
      ORDER BY id
    `);

    const blocks = result.rows;
    console.log(`📊 找到 ${blocks.length} 个需要生成嵌入的内容块\n`);

    if (blocks.length === 0) {
      console.log('✅ 所有内容块都已有嵌入！');
      return;
    }

    let processed = 0;
    let failed = 0;

    // 2. 批量处理
    for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
      const batch = blocks.slice(i, i + BATCH_SIZE);
      console.log(`📦 处理批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(blocks.length / BATCH_SIZE)} (${batch.length} 个内容块)`);

      for (const block of batch) {
        try {
          // 生成嵌入
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002', // 1536维度，最稳定
            input: block.content,
          });

          const embedding = embeddingResponse.data[0].embedding;

          // 保存到数据库
          await pool.query(
            `UPDATE sop_content_blocks 
             SET embedding = $1::vector,
                 embedding_generated = TRUE,
                 embedding_generated_at = NOW()
             WHERE id = $2`,
            [`[${embedding.join(',')}]`, block.id]
          );

          processed++;
          console.log(`   ✅ ID ${block.id}: 成功生成嵌入`);

        } catch (error) {
          failed++;
          console.error(`   ❌ ID ${block.id}: 失败 - ${error.message}`);
        }
      }

      // 延迟以避免超过速率限制
      if (i + BATCH_SIZE < blocks.length) {
        console.log(`   ⏳ 等待1秒...`);
        await delay(1000);
      }
    }

    console.log('\n🎉 完成！');
    console.log(`✅ 成功: ${processed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📊 总计: ${blocks.length}\n`);

    // 3. 验证结果
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(embedding) as with_embedding,
        COUNT(CASE WHEN embedding_generated THEN 1 END) as marked_generated
      FROM sop_content_blocks
    `);

    const stats = statsResult.rows[0];
    console.log('📊 最终统计：');
    console.log(`   总内容块: ${stats.total}`);
    console.log(`   已有嵌入: ${stats.with_embedding}`);
    console.log(`   完成率: ${Math.round((stats.with_embedding / stats.total) * 100)}%`);

    if (stats.with_embedding < stats.total) {
      console.log('\n⚠️  还有内容块没有嵌入，可以再次运行此脚本');
    } else {
      console.log('\n✅ 所有内容块都已生成嵌入！');
      console.log('   现在可以使用向量搜索了！');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await pool.end();
  }
}

// 运行
generateEmbeddings();

