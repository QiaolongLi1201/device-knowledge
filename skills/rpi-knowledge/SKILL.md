---
name: rpi-knowledge
description: 当用户询问树莓派(Raspberry Pi 5/4B/CM4)的生态、GPIO、libcamera、AI HAT+,或与 RDK 跨平台对比时使用。
---

# 树莓派知识

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

树莓派起步知识:生态、板型规格与官方资料入口。

## 树莓派生态（提要）
- 官方文档与镜像说明见 raspberrypi.com/documentation。
- 摄像头与显示栈随 OS 代际变化较大；以当前 `/boot/firmware` 与 libcamera 状态为准。

## 树莓派设备上下文（知识模块）
- 发行版多为 Raspberry Pi OS / Debian / Ubuntu；包管理与内核固件路径以**当前镜像**为准。
- 推理常用 ONNX Runtime / PyTorch aarch64 builds；若使用 AI HAT+，按 13 TOPS / 26 TOPS Hailo-8L/Hailo-8 变体选择 HEF，不能套用 RDK BPU / Jetson TensorRT / RKNN。
- GPIO / 外设请对照当前主线的 pinout 与官方 wiring 文档。

## 设备规格

- **Raspberry Pi 5** (`rpi-5`):BCM2712 (Cortex-A76) / 0 TOPS / 8GB / onnx
- **Raspberry Pi 4 Model B** (`rpi-4b`):BCM2711 (Cortex-A72) / 0 TOPS / 4GB / onnx
- **Raspberry Pi Compute Module 4** (`rpi-cm4`):BCM2711 (Cortex-A72) / 0 TOPS / 4GB / onnx

## 官方资料

- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [Raspberry Pi 5 Product Page](https://www.raspberrypi.com/products/raspberry-pi-5/)
- [Raspberry Pi AI HAT+](https://www.raspberrypi.com/products/ai-hat/)
