---
name: jetson-knowledge
description: 当用户询问 NVIDIA Jetson(Orin Nano/AGX Orin/Orin NX/Xavier NX/Nano)的生态、选型、JetPack/TensorRT 工具链,或与 RDK 跨平台对比时使用。
---

# NVIDIA Jetson 知识

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

Jetson 起步知识:生态、板型规格与官方资料入口。

## Jetson 生态（提要）
- JetPack bundles CUDA, TensorRT, and multimedia stacks for Jetson.
- Prefer NVIDIA samples and `nvcr.io` containers that list your JetPack major as supported.

## Jetson 设备上下文（知识模块）
- 板级 SDK 为 JetPack（L4T）；容器镜像需匹配 JetPack 版本。
- Orin 系列当前公开规格存在 Super/MAXN 等功耗模式差异：Orin Nano Dev Kit 可到 67 TOPS，Orin NX 最高 157 TOPS，AGX Orin 最高 275 TOPS；回答时用“最高/取决于 SKU 和功耗模式”。
- 推理优先查阅 TensorRT / CUDA 官方示例；勿套用 RDK BPU / TROS 路径。
- 诊断入口：`tegrastats`、`jtop`（若已装）、以及官方 Jetson 文档中的健康检查命令。

## 设备规格

- **Jetson Orin Nano** (`jetson-orin-nano`):Orin Nano / 67 TOPS / 8GB / tensorrt
- **Jetson AGX Orin** (`jetson-agx-orin`):Orin / 275 TOPS / 64GB / tensorrt
- **Jetson Orin NX** (`jetson-orin-nx`):Orin NX / 157 TOPS / 16GB / tensorrt
- **Jetson Xavier NX** (`jetson-xavier-nx`):Xavier NX / 21 TOPS / 8GB / tensorrt
- **Jetson Nano** (`jetson-nano`):Tegra X1 / 0.5 TOPS / 4GB / tensorrt

## 官方资料

- [Jetson Linux Developer Guide](https://docs.nvidia.com/jetson/)
- [NVIDIA Jetson Orin Series](https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/)
