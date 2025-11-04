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
 * 从PDF提取图片（使用pdf-lib）
 */
export async function extractImagesFromPDF(fileUrl: string): Promise<ExtractedImage[]> {
  console.log('🖼️ 开始提取PDF文档中的图片...');
  
  try {
    const { PDFDocument, PDFName } = await import('pdf-lib');
    
    // 下载PDF文件
    const buffer = await downloadFile(fileUrl);
    const pdfDoc = await PDFDocument.load(buffer);
    
    const extractedImages: ExtractedImage[] = [];
    let imageIndex = 0;
    
    // 遍历每一页
    const pages = pdfDoc.getPages();
    console.log(`📄 PDF共 ${pages.length} 页`);
    
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      
      // 获取页面资源
      const resources = page.node.Resources();
      if (!resources) continue;
      
      const xObjects = resources.lookup(PDFName.of('XObject'));
      if (!xObjects) continue;
      
      // 遍历XObject（包含图片）
      const xObjectKeys = (xObjects as any).entries();
      
      for (const [key, xObject] of xObjectKeys) {
        try {
          const subtype = xObject.lookup(PDFName.of('Subtype'));
          
          // 检查是否是图片
          if (subtype && subtype.toString() === '/Image') {
            const imageData = xObject.lookup(PDFName.of('Filter'));
            
            // 提取图片数据
            let imageBytes: Uint8Array;
            const stream = xObject as any;
            
            if (stream.contents) {
              imageBytes = stream.contents;
            } else {
              continue;
            }
            
            // 判断图片格式
            let contentType = 'image/jpeg';
            let ext = 'jpg';
            
            if (imageData) {
              const filter = imageData.toString();
              if (filter.includes('DCTDecode')) {
                contentType = 'image/jpeg';
                ext = 'jpg';
              } else if (filter.includes('FlateDecode')) {
                contentType = 'image/png';
                ext = 'png';
              }
            }
            
            // 生成文件名并上传
            const filename = generateUniqueFilename(`pdf-image-p${pageIndex + 1}-${imageIndex}.${ext}`);
            const file = new File([imageBytes], filename, { type: contentType });
            
            const { url } = await uploadFile(file, filename);
            
            extractedImages.push({
              index: imageIndex,
              filename,
              url,
              contentType,
            });
            
            console.log(`✅ PDF图片 ${imageIndex} 已提取: ${filename} (第${pageIndex + 1}页)`);
            imageIndex++;
          }
        } catch (error) {
          console.error(`⚠️ 提取图片失败 (页${pageIndex + 1}):`, error);
          // 继续处理其他图片
        }
      }
    }
    
    if (extractedImages.length === 0) {
      console.warn('⚠️ PDF中未发现图片');
      console.warn('💡 提示: 如果PDF包含重要图片，请确保图片是嵌入式的，而非扫描件');
    } else {
      console.log(`✅ PDF图片提取完成: ${extractedImages.length} 张`);
    }
    
    return extractedImages;
  } catch (error: any) {
    console.error('❌ PDF图片提取失败:', error);
    console.warn('💡 如果需要保留图片，建议将PDF转换为Word格式后再上传');
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

