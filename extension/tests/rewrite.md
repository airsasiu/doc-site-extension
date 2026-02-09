## 一、Demo 概述

本示例演示了如何在 SpreadJS 中导出筛选前的原始数据。当用户对工作表应用了筛选条件后,有时需要导出未经筛选的完整数据集,而不是筛选后的结果。该示例通过创建工作簿副本并重置筛选条件的方式,实现了导出原始数据的功能,适用于数据分析、报表导出等需要保留完整数据的场景。

## 二、解决的问题

在实际业务中,用户经常需要对表格数据进行筛选以查看特定内容,但在导出时却希望保留完整的原始数据。直接导出当前工作簿会包含筛选状态,导致导出文件只显示筛选后的部分数据。本示例解决了以下问题:

1. 如何在不影响当前工作簿筛选状态的情况下导出完整数据
2. 如何批量处理工作簿中所有工作表的筛选条件
3. 如何确保导出的文件包含所有原始数据行

## 三、实现思路

### 3.1 创建工作簿副本

为了不影响用户当前的操作界面,使用 `toJSON()` 和 `fromJSON()` 方法创建工作簿的深度副本:

```javascript
// 创建一个副本Workbook
let tempSpread = new GC.Spread.Sheets.Workbook();
tempSpread.fromJSON(spread.toJSON());
```

这种方式可以完整复制工作簿的所有配置、数据和状态,包括筛选条件、样式、公式等。

### 3.2 批量重置筛选条件

遍历工作簿中的所有工作表,检查并重置每个工作表的筛选条件:

```javascript
let count = tempSpread.getSheetCount()
// 循环去除工作表中的筛选条件
for (let i = 0; i < count; i++) {
    let tempSheet = tempSpread.getSheet(i);
    var rowFilter = tempSheet.rowFilter();
    if (rowFilter != null) {
        rowFilter.reset();
    }
}
```

`reset()` 方法会清除所有筛选条件,使所有被隐藏的行重新显示,从而恢复到筛选前的状态。

### 3.3 导出文件

使用 SpreadJS IO 模块的 `export()` 方法将副本工作簿导出为 Excel 文件:

```javascript
// 保存副本文件
tempSpread.export(function (blob) {
    saveAs(blob, "export.xlsx");
}, function (e) {
    // process error
    console.log(e);
});
```

结合 FileSaver.js 库的 `saveAs()` 方法,实现文件的下载保存功能。

### 3.4 技术栈

- @grapecity/spread-sheets: 16.2.0 - 核心表格组件
- @grapecity/spread-sheets-io: 16.2.0 - Excel 文件导入导出功能
- @grapecity/spread-sheets-resources-zh: 16.2.0 - 中文语言包
- FileSaver.js: 2.0.0 - 文件保存工具库
- SystemJS: 0.19.22 - 模块加载器

## 四、使用说明

### 4.1 运行方式

```bash
# 安装依赖
npm install

# 使用 HTTP 服务器打开 index.html
# 例如使用 Live Server 或其他本地服务器
```

### 4.2 操作步骤

1. 打开页面后,可以看到工作表中已经预设了数据(第1-7行的A列包含数值1-7)
2. 工作表已经应用了行筛选器,可以通过筛选按钮对数据进行筛选
3. 应用任意筛选条件后,部分数据行会被隐藏
4. 点击"导出筛选原文件"按钮
5. 系统会自动下载 export.xlsx 文件,该文件包含所有原始数据,不受当前筛选状态影响
6. 查看当前工作簿,筛选状态保持不变

## 五、功能特点

### 5.1 优点

1. **非侵入式操作**: 通过创建副本的方式,不影响用户当前的工作状态和筛选设置
2. **批量处理**: 自动处理工作簿中所有工作表的筛选条件,适用于多工作表场景
3. **简洁高效**: 代码实现简单,利用 JSON 序列化实现快速复制,性能良好

### 5.2 局限性与扩展建议

1. **内存占用**: 对于大型工作簿,创建完整副本会临时占用较多内存,可以考虑仅复制需要导出的工作表
2. **扩展建议**: 可以增加导出选项,允许用户选择是导出筛选前数据还是筛选后数据,提供更灵活的导出方式

## 六、关键代码片段

### 完整的导出处理逻辑

```javascript
document.getElementById("exportFile").onclick = function(){
    // 创建一个副本Workbook
    let tempSpread = new GC.Spread.Sheets.Workbook();
    tempSpread.fromJSON(spread.toJSON());
    let count = tempSpread.getSheetCount()
    // 循环去除工作表中的筛选条件
    for (let i = 0; i < count; i++) {
        let tempSheet = tempSpread.getSheet(i);
        var rowFilter = tempSheet.rowFilter();
        if (rowFilter != null) {
            rowFilter.reset();
        }
    }
    // 保存副本文件
    tempSpread.export(function (blob) {
        saveAs(blob, "export.xlsx");
    }, function (e) {
        // process error
        console.log(e);
    });
}
```

该代码片段展示了整个导出流程:创建副本 → 重置筛选 → 导出文件的完整逻辑。

## 七、总结

本示例提供了一个实用的解决方案,用于在保持当前界面筛选状态的同时导出完整的原始数据。通过学习本示例,开发者可以掌握以下知识点:

1. 使用 `toJSON()` 和 `fromJSON()` 方法实现工作簿的深度复制
2. 使用 `rowFilter()` 方法获取和操作筛选器对象
3. 使用 `reset()` 方法清除筛选条件
4. 使用 SpreadJS IO 模块的 `export()` 方法导出 Excel 文件
5. 批量处理多个工作表的通用模式

该方案适用于需要同时保留筛选视图和完整数据导出能力的场景,特别是在数据分析、报表管理等业务系统中具有较高的实用价值。代码实现简洁高效,易于集成到实际项目中。
