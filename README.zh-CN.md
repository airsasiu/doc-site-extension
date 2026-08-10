# Documentation Helper

[English](README.md)

一个面向 DocSite 类文档工作流的浏览器扩展，用来做内容搜索、链接处理、Markdown 复制、图片上传、页面维护和 Redirect 记录整理。

## 功能

- 内容搜索：按关键词搜索页面内容
- 页面链接查找：按标题或 URL 过滤页面并复制链接
- Markdown 处理：复制文档 Markdown、清理链接、格式化代码
- 图片处理：上传图片并转换为内链
- 页面维护：批量新增、批量删除页面
- 文档检查：常规检查与自定义检查规则
- 导出：导出 Markdown、TOC、Redirect 记录
- Redirect 记录：比对调整前后 TOC，生成并导出重定向数据

## 安装

### 方式一：下载发布包

1. 打开 [Releases](https://github.com/airsasiu/doc-site-extension/releases)
2. 下载 `documentation-helper-1.0.zip`
3. 解压后，在 Chrome 或 Edge 中开启开发者模式
4. 选择“加载已解压的扩展程序”，指向解压后的扩展目录

当前版本下载：
[documentation-helper-1.0.zip](https://github.com/airsasiu/doc-site-extension/releases/download/v1.0/documentation-helper-1.0.zip)

### 方式二：本地开发

1. 克隆仓库
2. 在浏览器扩展管理页开启开发者模式
3. 加载 `extension` 目录

## 配置

打开扩展的 `Options` 页面后，建议先配置这些项：

- `sourceBaseUrl`：源文档站基础地址
- `sourceProductId`：源文档集 ID
- `docApiUrl`：文档站 API 地址
- `linkRules`：API 链接处理规则
- `linkLocalizationRules`：跨站链接转换规则
- `customCheckRules`：自定义检查规则

## 快捷键

- `Alt+Shift+F`：格式化选中代码
- `Alt+Shift+U`：上传 Markdown 中的图片
- `Alt+Shift+D`：复制文档 Markdown
- `Alt+Shift+Y`：清理选中文本中的链接 URL

## 开发

扩展主体代码在 `extension/` 目录下。

- `background.js`：命令入口
- `sidebar/`：侧边栏 UI 和功能组件
- `options/`：配置页
- `scripts/`：页面注入脚本
- `help/`：帮助页

## 备注

这个项目最初是为内部 DocSite 工作流做的，后续已经尽量抽象成通用扩展。
