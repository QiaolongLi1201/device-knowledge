---
name: rdk-board-delegate
description: 当需要向板端 agent(OpenClaw)交接/委派任务、用 board_openclaw_chat / board_openclaw_delegate 但不确定该传哪些信息(目标/背景/已做/分析/期望)、交接信息不全被打回、或理解 S100 "大小脑异构"(6×A78AE 大脑 CPU + Nash BPU + 4×R52+ 小脑 MCU 实时控制)分工与 MCU 固件烧录(JTAG/Type-C、Main/MCU 双 UART)时使用。
---

# RDK 板端委派与 S100 大小脑协同

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

## 何时用

- 要把任务交给板端 agent(OpenClaw),调 `board_openclaw_chat` / `board_openclaw_delegate` 前不确定该写哪些信息,或交接太简略被打回。
- 想搞清 S100 三块异构算力(CPU/BPU/MCU)谁负责什么、MCU 怎么烧固件、S100 还是 S100P。

板端委派/交接必须信息完整(目标/背景/已做/分析/期望);S100 的 MCU 与主控分工是具身智能关键。

**OpenClaw 工作交接**：`board_openclaw_chat` / `board_openclaw_delegate` 必须包含——
目标（一句话）、背景（为什么 + 设备状态）、已做的事（命令+关键输出）、分析（判断+方案理由）、期望（需要什么信息/操作）

## S100 "大小脑异构":三块算力的分工

S100 的设计哲学不是堆算力,而是 **CPU + BPU + MCU 三块异构**,"感知-决策-控制"在单 SoC 内闭环:

- **"大脑" CPU**(6× A78AE):Linux 应用、ROS2 节点、AI 任务编排——用户主要写代码的地方(Ubuntu 22.04)。
- **"决策" BPU**(Nash 80/128 TOPS):LLM/VLM/检测/分割/点云,模型转换后走 `hobot_dnn` / BPU runtime。
- **"小脑" MCU**(4× R52+ @1.2GHz):关节实时控制(ms/kHz 级)、IMU 预处理、电机回路。运行 RTOS/裸金属固件,**不是普通 Linux 程序**,通过 IPC(共享内存+通知)与 CPU 交互。

**委派/实操关键(用户常忽视)**:

- 关节控制从 Linux RT 线程卸载到 MCU 后,官方宣传 "CPU 占用率下降 80%";硬实时回路比 X5 的 Linux RT 线程稳。
- MCU 固件**不在 `apt`**,独立工具链经 JTAG 或 Type-C 调试口烧录;**Main Domain / MCU Domain 两个 UART 调试口别弄混**。
- 纯视觉应用可暂不碰 MCU,只当 BPU 算力板用;要上手先跑官方 MCU SDK 示例。相机走扩展板(MIPI 4-lane 或 GMSL),裸板无直接相机接口。
- 选型:S100(12GB/80 TOPS)→ 7B 量化 LLM、主流 VLM、双足/四足;S100P(24GB/128 TOPS)→ 更大模型/多路 GMSL/科研。

## 需要更细时查阅

[硬件与系统参考](references/hardware-notes.md) 的「S100 大小脑异构与 MCU 协同」一节,补充了正文未展开的细节:

- 三块算力分工对照表(硬件/典型任务/开发者接触面),含 A78AE 主频 S100 @1.5GHz vs S100P @2.0GHz
- MCU R52+ 锁步细节:1 对 DCLS 锁步核 + 2 核支持 Split-Lock(按安全需求选)
- X5(传统 Linux RT 线程电机回路)vs S100(IPC→MCU 硬实时)的机器人链路对比图

## 参考资料

- [硬件与系统参考(详细章节)](references/hardware-notes.md)
