---
name: rpi-knowledge
description: 当用户询问树莓派(Raspberry Pi 5/4B/CM4)的生态、GPIO、libcamera、AI HAT+ 时使用;本 skill 只讲树莓派平台本身,涉及与 RDK 的选型对比参见 rdk-ecosystem。
---

# 树莓派知识

> 来源:整理自 Raspberry Pi 官方文档与社区实践,逐条保留出处链接;具体规格与版本以官方为准。

树莓派起步知识:生态、板型规格与官方资料入口。

## 树莓派要点

- AI 推理:有 AI HAT+ 时用 Hailo 的 **HEF** 格式(按 13 TOPS / 26 TOPS 的 Hailo-8L/Hailo-8 变体选);无 HAT+ 时 Pi 5/4B/CM4 本身无 NPU,走 CPU / ONNX Runtime / PyTorch aarch64 builds。
- 摄像头:Pi 5 与新镜像走 **libcamera/rpicam**(旧 `raspistill`/`raspivid` 已废弃);显示栈随 OS 代际变化大,以当前 `/boot/firmware` 与 libcamera 状态为准。
- GPIO:用 BCM 编号,库为 `RPi.GPIO` / `gpiozero` / `libgpiod`;对照当前主线 pinout 与官方 wiring 文档。
- 发行版多为 Raspberry Pi OS / Debian / Ubuntu;包管理与内核固件路径以当前镜像为准。官方文档见 raspberrypi.com/documentation。

## 设备规格

- **Raspberry Pi 5** (`rpi-5`):BCM2712 (Cortex-A76) / 0 TOPS / 8GB / onnx
- **Raspberry Pi 4 Model B** (`rpi-4b`):BCM2711 (Cortex-A72) / 0 TOPS / 4GB / onnx
- **Raspberry Pi Compute Module 4** (`rpi-cm4`):BCM2711 (Cortex-A72) / 0 TOPS / 4GB / onnx

## 官方资料

- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [Raspberry Pi 5 Product Page](https://www.raspberrypi.com/products/raspberry-pi-5/)
- [Raspberry Pi AI HAT+](https://www.raspberrypi.com/products/ai-hat/)
