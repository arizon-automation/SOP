/**
 * 图片提取工具
 * 从PDF和Word文档中提取图片
 */

import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { uploadFile, generateUniqueFilename } from '@/lib/storage';

/**
 * 从URL下载文件到buffer
 */
async function downloadFile(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), 'uploads', path.basename(fileUrl));
    return await fs.readFile(localPath);
  }
  
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface ExtractedImage {
  index: number;           // 图片在文档中的顺序索引（从0开始）
  filename: string;
  url: string;
  contentType: string;
}

/**
 * 从Word文档提取图片（并插入占位符）
 */
export async function extractImagesFromWord(fileUrl: string): Promise<{
  images: ExtractedImage[];
  textWithPlaceholders: string;
}> {
  console.log('🖼️ 开始提取Word文档中的图片...');
  
  try {
    const buffer = await downloadFile(fileUrl);
    const extractedImages: ExtractedImage[] = [];
    let imageIndex = 0;
    
    // 使用mammoth提取图片并转换为Markdown格式（包含占位符）
    const result = await mammoth.convertToMarkdown(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            // 读取图片数据
            const imageBuffer = await image.read();
            const contentType = image.contentType || 'image/png';
            
            // 生成文件名
            const ext = contentType.split('/')[1] || 'png';
            const filename = generateUniqueFilename(`image.${ext}`);
            
            // 创建File对象
            const file = new File([imageBuffer], filename, { type: contentType });
            
            // 上传图片
            const { url } = await uploadFile(file, filename);
            
            const currentIndex = imageIndex;
            extractedImages.push({
              index: currentIndex,
              filename,
              url,
              contentType,
            });
            
            console.log(`✅ 图片 ${currentIndex} 已提取: ${filename}`);
            
            imageIndex++;
            
            // 返回占位符文本（Markdown会保留这个）
            return { src: `[图片${currentIndex}]` };
          } catch (error) {
            console.error('图片提取失败:', error);
            return { src: '' };
          }
        })
      }
    );
    
    console.log(`✅ Word文档图片提取完成: ${extractedImages.length} 张`);
    
    // 返回Markdown文本（包含图片占位符）
    return {
      images: extractedImages,
      textWithPlaceholders: result.value,
    };
  } catch (error: any) {
    console.error('❌ Word图片提取失败:', error);
    return {
      images: [],
      textWithPlaceholders: '',
    };
  }
}

/**
 * 从PDF提取图片（使用pdf.js）
 */
export async function extractImagesFromPDF(fileUrl: string): Promise<ExtractedImage[]> {
  console.log('🖼️ 开始提取PDF文档中的图片...');
  
  try {
    // 注意：pdf-parse不支持图片提取
    // 需要使用pdf.js或pdf-lib
    // 这里我们先返回空数组，如果需要PDF图片提取，需要安装额外的库
    console.warn('⚠️ PDF图片提取需要额外的库，当前版本暂不支持');
    console.warn('⚠️ 建议：如果文档包含重要图片，请使用Word格式上传');
    
    return [];
    
    // TODO: 如果需要PDF图片提取，可以使用以下方案：
    // 1. 使用pdf.js: npm install pdfjs-dist
    // 2. 使用pdf-lib: npm install pdf-lib
    // 3. 或使用在线服务API
  } catch (error: any) {
    console.error('❌ PDF图片提取失败:', error);
    return [];
  }
}

/**
 * 根据文件类型自动提取图片
 */
export async function extractImages(fileUrl: string, fileType: string): Promise<{
  images: ExtractedImage[];
  textWithPlaceholders?: string;
}> {
  console.log(`🔍 检查文档中的图片: ${fileType}`);
  
  if (fileType === 'docx') {
    return await extractImagesFromWord(fileUrl);
  } else if (fileType === 'pdf') {
    const images = await extractImagesFromPDF(fileUrl);
    return { images, textWithPlaceholders: undefined };
  } else {
    return { images: [], textWithPlaceholders: undefined };
  }
}

export default {
  extractImages,
  extractImagesFromWord,
  extractImagesFromPDF,
};

