# 语言切换功能使用指南

## 功能概述
系统现在支持中英文无缝切换，用户可以在任何页面通过点击语言切换器在中文和英文之间切换。

## 核心特性

### 1. **全局语言状态管理**
- 使用 React Context 管理全局语言状态
- 语言选择自动保存到 `localStorage`
- 刷新页面后保持用户的语言偏好

### 2. **智能SOP显示**
- **SOP列表页** (`/sops`)：根据选择的语言自动过滤
  - 选择"中文"：只显示中文版SOP
  - 选择"English"：只显示英文版SOP
  - **不再同时显示两个版本的重复内容** ✅

- **SOP详情页** (`/sops/[id]`)：智能语言切换
  - 如果当前SOP有对应的翻译版本
  - 切换语言时会自动跳转到对应语言的SOP页面
  - 例如：查看中文版SOP时切换到English，会自动跳转到英文版

### 3. **完整的界面翻译**
所有界面文字都支持双语显示，包括：
- 导航栏和按钮
- 表单标签和提示
- 状态消息和错误提示
- 空状态页面文案

## 技术实现

### 文件结构
```
lib/
  i18n.ts                    # 翻译字典和工具函数

contexts/
  LanguageContext.tsx        # 语言状态管理Context

components/
  LanguageSwitcher.tsx       # 语言切换组件
```

### 使用方法

#### 在页面中使用翻译
```typescript
import { useTranslation } from '@/contexts/LanguageContext';

export default function MyPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('sops.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

#### 获取当前语言
```typescript
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyPage() {
  const { language } = useLanguage();
  
  return (
    <div>
      {language === 'zh' ? '中文内容' : 'English content'}
    </div>
  );
}
```

#### 添加语言切换器
```typescript
import LanguageSwitcher from '@/components/LanguageSwitcher';

<header>
  <LanguageSwitcher />
</header>
```

## 翻译键值对照

### 常用翻译键
```typescript
// 通用
t('common.back')      // 返回 / Back
t('common.save')      // 保存 / Save
t('common.loading')   // 加载中... / Loading...

// 导航
t('nav.dashboard')    // 仪表板 / Dashboard
t('nav.documents')    // 文档管理 / Documents
t('nav.sops')         // SOP管理 / SOPs

// SOP管理
t('sops.title')       // SOP管理 / SOP Management
t('sops.detail')      // SOP详情 / SOP Details
t('sops.chinese')     // 中文 / Chinese
t('sops.english')     // 英文 / English
```

完整的翻译键请查看 `lib/i18n.ts`

## 用户体验流程

### 场景1：浏览SOP列表
1. 用户进入 `/sops` 页面
2. 默认显示中文版SOP（如果之前没有设置过语言）
3. 点击右上角的 `English` 按钮
4. 页面自动刷新，只显示英文版SOP
5. 再次点击 `中文` 按钮，切换回中文版

### 场景2：查看SOP详情
1. 用户在中文SOP列表中点击某个SOP
2. 进入该SOP的详情页（中文版）
3. 点击 `English` 切换器
4. 系统自动跳转到该SOP的英文版本
5. 点击 `中文` 切换器，自动跳转回中文版

### 场景3：语言偏好持久化
1. 用户选择 English
2. 关闭浏览器
3. 重新打开网站
4. 系统自动记住用户偏好，显示英文界面

## API支持

### SOP列表API
```
GET /api/sops?language=zh   # 获取中文SOP
GET /api/sops?language=en   # 获取英文SOP
```

系统会根据 `language` 参数自动过滤返回对应语言的SOP，避免返回重复内容。

## 添加新翻译

如果需要添加新的翻译内容，请编辑 `lib/i18n.ts`：

```typescript
export const translations = {
  zh: {
    myFeature: {
      title: '我的功能',
      description: '这是一个新功能',
    },
  },
  en: {
    myFeature: {
      title: 'My Feature',
      description: 'This is a new feature',
    },
  },
};
```

然后在代码中使用：
```typescript
t('myFeature.title')
t('myFeature.description')
```

## 已更新的页面
✅ Dashboard - 仪表板
✅ SOP List - SOP列表（自动语言过滤）
✅ SOP Detail - SOP详情（智能语言切换）
✅ Loading states - 加载状态

## 待更新的页面
⏳ Document List - 文档列表
⏳ Document Detail - 文档详情
⏳ Login Page - 登录页面
⏳ Upload Page - 上传页面

## 注意事项

1. **SOP语言过滤**：SOP列表会根据选择的语言自动过滤，这意味着用户只会看到一个版本的SOP，而不是中英文两个版本都显示。

2. **翻译版本关联**：每个SOP的中文版和英文版通过 `translation_pair_id` 关联，切换语言时系统会自动查找对应的翻译版本。

3. **localStorage**：语言偏好存储在浏览器的 `localStorage` 中，清除浏览器数据会重置为默认语言（中文）。

4. **服务端渲染**：当前实现为客户端状态管理，如需支持SSR，需要额外配置。

## 测试步骤

1. 访问 http://localhost:3000/sops
2. 确认默认显示中文版SOP
3. 点击右上角的 "English" 按钮
4. 确认页面刷新后只显示英文版SOP
5. 点击某个SOP进入详情页
6. 点击 "中文" 按钮
7. 确认自动跳转到中文版SOP详情页
8. 刷新页面，确认语言设置保持为中文

## 技术亮点

- **零重复显示**：不会同时显示中英文两个版本
- **智能切换**：在SOP详情页切换语言会自动导航到对应版本
- **状态持久化**：语言选择自动保存，无需重复设置
- **全局一致性**：整个应用使用统一的语言状态
- **易于扩展**：添加新语言或新翻译非常简单

---

更新时间：2025-01-04

