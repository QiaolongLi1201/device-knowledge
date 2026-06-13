# 架构

本仓库是 **RDK 设备知识的纯 skill 集**。它只承载数据(知识),不含 agent 执行逻辑:
设备变更、SSH 执行、刷机、凭据、外部消息、宿主 UI 状态都留在 RDK Studio 或其他产品宿主。

此前 device-knowledge 是"TS 数据包 + 适配/构建程序"(core schema、dmoss-adapter、artifact builder、lint)。
现已整体改写为 [Claude 官方 skill 格式](https://github.com/anthropics/skills),消费方直接扫描 `skills/**` 加载,
不再需要中间的数据契约程序。

## 设计原则

- **Source-backed 且忠实**:所有内容由原 device-knowledge 知识数据**忠实转换**,未改写技术事实;逐条保留官方出处链接。
- **运行时中立**:仅 `name`+`description` 的极简 frontmatter 不绑定任何单一宿主;Moss 的 `mergeSkillFrontmatterDefaults`
  会按需补齐其运行时字段。
- **渐进披露**:`SKILL.md` 正文保持精简(操作要点 + 导航),详细查表、长章节、代码放 `references/`,加载更轻。
- **主题导向划分**:skill 按"用户任务/能力"切分,而非按数据类型;划分沿用原 `rdk-endorsed-skills` 规划的主题。

## 目录布局

```text
skills/<name>/
├── SKILL.md          # frontmatter(name + description) + 正文指令
└── references/*.md    # 详细内容:硬件章节、命令表、故障速查、设备规格、官方资料
```

## Skill 划分与 references 分层

11 个 skill 覆盖 RDK 核心(7)+ 设备族 starter(3)+ 桌面端开发(1):

- **RDK 核心**:`rdk-ecosystem` / `rdk-hardware` / `rdk-board-knowledge` / `rdk-device` / `rdk-ros`
  / `rdk-peripheral-cookbook` / `rdk-board-delegate`。
- **设备族**:`jetson-knowledge` / `rpi-knowledge` / `rk-knowledge`。
- **桌面端**:`host-software-dev`(RDK Studio 客户端本体工程)。

`references/` 按内容类型集中,作为单一事实源,供多个 skill 引用:

| reference | 内容 | 所在 skill |
| --- | --- | --- |
| `hardware-notes.md` | RDK 硬件/系统详细章节(按该 skill 归属) | 各 RDK skill |
| `failure-hints.md` | 55 条"现象→建议→文档"故障速查 | `rdk-board-knowledge` |
| `diagnostic-commands.md` | 诊断/系统/工具链命令表 | `rdk-board-knowledge` |
| `ros-commands.md` / `camera-commands.md` / `gpio-commands.md` | 分类命令表 | `rdk-ros` / `rdk-device` / `rdk-peripheral-cookbook` |
| `board-specs.md` | 5 款 RDK 板型规格对照(含探测标识) | `rdk-hardware` |
| `official-docs.md` | 官方资料导航(按主题分组) | `rdk-ecosystem` |

## 与 Moss / RDK Studio 的关系

宿主从 `<workspace>/skills/**` 扫描;skill 目录名即 id,与 frontmatter `name` 一致(小写比较)。
RDK Studio 与 Moss 都以 skill 形式内置消费;Moss 侧若需要 `risk`/`requires_board`/`approval_level` 等运行时字段,
由其 `mergeSkillFrontmatterDefaults` 在写入本机 workspace 时补齐,无需本仓库改动。

设备规格(原 device-profile 的 GPIO 路数、TOPS、探测标识等)以 markdown 规格表(`board-specs.md`)形式保留,
供选型、命令适配与设备识别参考;不再以可被代码按字段查表的 TS 数据形式存在。

## 内容来源与维护

- 内容转换自原 `@device-knowledge/*-knowledge` 的知识数据(prompt fragments、workflow guides、command patterns、
  failure hints、doc index、device profiles、ecosystem text、硬件 markdown),逐条保留出处。
- 优先官方 D-Robotics 文档、工具链、Model Zoo / NodeHub;社区/经验性内容如实标注。
- 校验:`node scripts/validate-skills.mjs` 检查 frontmatter 合规、name 与目录一致、references 链接存在。

## 不属于本仓库

- 设备变更、SSH 执行、刷机、凭据处理。
- 模型密钥、设备密码、账户信息。
- RDK Studio `server/**` 内部、原生壳代码、产品 UI 状态。
- agent 执行循环——本仓库只提供知识。
