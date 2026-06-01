# wutong

wutong 是“无痛胃肠镜全流程智能导诊微信小程序”的第一版 MVP 项目整理目录。它面向单个内镜科室试点，目标是用最少功能跑通患者从预约准备、到院导诊、检查完成到离院宣教的完整流程。

## 先说结论

当前版本可以用于科室内部演示和试点前流程验证：患者端、医护后台、内容配置、提醒计划、手动提醒模拟、统计导出都能本地跑通。

当前版本还不是正式微信小程序上线包。真实微信订阅消息、Coze 发布、云数据库、服务器端加密、审计和备份需要在后续正式上线阶段接入。

## 目录结构

| 路径 | 内容 |
|---|---|
| `app/` | 可运行的静态 MVP 应用 |
| `app/core.js` | 时间线、提醒、筛选、统计、导出等核心业务逻辑 |
| `app/app.js` | 患者端和医护后台界面交互 |
| `app/tests/core.test.js` | 核心规则测试 |
| `docs/requirements.md` | 原始需求和 MVP 边界 |
| `docs/handoff.md` | 已完成内容、验证结果、当前限制 |
| `docs/cost-estimate.md` | 微信小程序上线服务器体量和费用表 |
| `docs/improvement-plan.md` | 十个后续改进方案 |
| `docs/operations.md` | 管理员、后台配置、测试流程操作步骤 |
| `AGENTS.md` | 给后续 AI/开发者看的项目规则 |

## 本地运行

1. 打开终端。
2. 进入应用目录：
   ```powershell
   cd C:\Users\Administrator\Documents\Codex\2026-06-01\mvp-coze-codex-1-66-60\wutong\app
   ```
3. 启动本地服务：
   ```powershell
   node server.mjs
   ```
4. 看到 `wutong running at http://localhost:4173` 说明启动成功。
5. 在浏览器打开：
   ```text
   http://localhost:4173/
   ```

## 测试

在工作区根目录执行：

```powershell
node --test wutong/app/tests/core.test.js
node --check wutong/app/app.js
node --check wutong/app/core.js
node --check wutong/app/server.mjs
```

## 默认后台账号

| 项目 | 值 |
|---|---|
| 账号 | `admin` |
| 密码 | `123456` |

首次演示后应在后台“账号设置”里修改密码。当前密码只保存在浏览器本地存储中，不能作为正式医疗系统安全方案。

## 关键限制

- 微信订阅消息在当前版本中是“提醒计划 + 手动模拟发送”，不是真实发送。
- 患者数据存储在浏览器 localStorage 中，只用于原型演示。
- 成本估算是规划口径，正式采购价格以云厂商控制台为准。
- 第一版严禁加入 AI 答疑、清肠效果自评、家属同步、短信/电话提醒、支付、挂号、在线问诊、报告查询、多级权限、长期随访等非 MVP 功能。

## 推荐阅读顺序

1. `docs/handoff.md`
2. `docs/requirements.md`
3. `docs/operations.md`
4. `docs/cost-estimate.md`
5. `docs/improvement-plan.md`
