---
name: jetson-knowledge
description: 当用户询问 NVIDIA Jetson(Orin Nano/AGX Orin/Orin NX/Xavier NX/Nano)的生态、选型、JetPack/TensorRT 工具链时使用;本 skill 只讲 Jetson 平台本身,涉及与 RDK 的选型对比参见 rdk-ecosystem。
---

# NVIDIA Jetson 知识

> 来源:整理自 NVIDIA Jetson 官方文档与社区实践,逐条保留出处链接;具体规格与版本以官方为准。

Jetson 起步知识:生态、板型规格与官方资料入口。

## Jetson 工具链与诊断要点

- 板级 SDK 是 JetPack(L4T);容器镜像用 `nvcr.io`,需匹配 JetPack major 版本。
- 模型经 **TensorRT** 转 engine 后推理;优先查阅 TensorRT / CUDA 官方示例。
- 诊断用 `tegrastats`、`jtop`(若已装),以及官方 Jetson 文档的健康检查命令。
- TOPS 随 SKU 与功耗模式(Super/MAXN/15W/7W)差异大,回答用"最高/取决于 SKU 和功耗模式,以官方 Jetson 选型页为准"。

## 设备规格

- **Jetson Orin Nano** (`jetson-orin-nano`):Orin Nano / 最高 67 TOPS(Super 模式,随功耗模式变) / 8GB / tensorrt
- **Jetson AGX Orin** (`jetson-agx-orin`):Orin / 275 TOPS / 64GB / tensorrt
- **Jetson Orin NX** (`jetson-orin-nx`):Orin NX / 157 TOPS / 16GB / tensorrt
- **Jetson Xavier NX** (`jetson-xavier-nx`):Xavier NX / 21 TOPS / 8GB / tensorrt
- **Jetson Nano** (`jetson-nano`):Tegra X1 / 472 GFLOPS(FP16，约 0.47 INT8 TOPS) / 4GB / tensorrt

## 官方资料

- [Jetson Linux Developer Guide](https://docs.nvidia.com/jetson/)
- [NVIDIA Jetson Orin Series](https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/)
