# AGENTS.md

## 项目定位

wutong 是“无痛胃肠镜全流程智能导诊微信小程序”的第一版 MVP。当前实现是静态 Web 原型，用来验证流程、配置和后台操作，不是正式微信小程序发布包。

## 工作规则

- 回答和文档默认使用中文。
- 先分析可行性和风险，再给结论。
- 面向小白的操作说明必须写清楚点哪里、输入什么、看到什么算成功、失败怎么办。
- 保留原 `outputs/endoscopy-mvp/`，不要删除或覆盖历史交付物。
- 正式项目目录是 `wutong/`，应用代码在 `wutong/app/`。

## MVP 边界

第一版只做患者流程提醒与院内导诊、医护轻量后台、内容配置、统计导出。禁止加入：

- AI 智能答疑
- 清肠效果自评
- 家属同步提醒
- 短信/电话提醒
- 医院 HIS/预约/报告系统对接
- 第三方平台对接
- 多级权限
- 复杂质控报表
- 长期随访
- 支付、挂号、在线问诊、报告查询

## 运行与验证

```powershell
cd C:\Users\Administrator\Documents\Codex\2026-06-01\mvp-coze-codex-1-66-60\wutong\app
node server.mjs
```

验证命令：

```powershell
node --test wutong/app/tests/core.test.js
node --check wutong/app/app.js
node --check wutong/app/core.js
node --check wutong/app/server.mjs
```

## 技术事实

- `core.js` 是核心业务逻辑：时间线、提醒队列、筛选、统计、CSV 导出、本地存储。
- `app.js` 是界面和交互：患者端、节点详情、术后页、后台登录、配置、统计。
- `server.mjs` 是本地静态文件服务器。
- 当前“加密存储”只是本地演示封装，不满足正式医疗数据安全要求。

## 正式上线注意

上线微信小程序前必须补齐：

- 微信小程序 AppID 和主体认证。
- 订阅消息模板 ID、用户授权流程、真实发送接口。
- 云端数据库、服务端加密、HTTPS、访问审计、备份恢复。
- 医院信息科需要的安全评估和数据保留策略。
