---
name: rk-knowledge
description: 当用户询问 Rockchip RK3588 平台(Rock 5B/5 ITX、OrangePi 5 Plus、Firefly)的 NPU、RKNN 工具链部署,或与 RDK 跨平台对比时使用。
---

# Rockchip RK3588 知识

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

RK3588/RKNN 起步知识:RKNN 工具链与 RDK BPU 工作流差异较大,单独成篇。

## Rockchip RK 生态（提要）
- 常见开发板包括 Radxa ROCK 5 系列、Orange Pi 5 系列、Firefly ROC-RK3588S-PC 等。
- RK3588/RK3588S NPU 标称 6 TOPS；模型部署通常使用 RKNN Toolkit 2 转换为 `.rknn`，板端使用 `librknnrt` / `rknn_toolkit_lite2` 推理。
- 不要套用 RDK BPU/TROS、Jetson CUDA/TensorRT 或 Raspberry Pi HAT 的路径；先确认系统镜像、内核、NPU runtime 和 rknn-toolkit2 版本是否匹配。

## Rockchip RK 设备上下文（知识模块）
- 典型 RK3588/RK3588S 板卡是通用 Linux SBC；AI 推理优先走 RKNN `.rknn`，不是 RDK `.bin`、Jetson TensorRT engine 或 Raspberry Pi Hailo HEF。
- 诊断先用通用只读命令：`uname -a`、`cat /etc/os-release`、`cat /proc/device-tree/model`、`lscpu`、`lsusb`、`dmesg | grep -i rknpu`。
- NPU 可用性取决于镜像内核驱动、`librknnrt` 与模型转换工具版本；遇到 RKNN 报错先核对 runtime/toolkit 版本，不要默认是模型本身错误。

## 常用命令

| 命令模式 | 说明 | 风险 | 适用板型 |
| --- | --- | --- | --- |
| `dmesg\s*\\|\s*grep\s+(-i\s+)?rknpu` | Inspect Rockchip NPU driver/runtime messages | safe | radxa-rock-5b/radxa-rock-5-itx/orange-pi-5-plus/firefly-roc-rk3588s-pc |
| `pip\s+install\s+.*rknn\|rknn[-_]toolkit` | RKNN Toolkit installation or runtime package setup | moderate | radxa-rock-5b/radxa-rock-5-itx/orange-pi-5-plus/firefly-roc-rk3588s-pc |

## 常见故障

- 匹配 `RKNN.*(version|mismatch|init runtime|load model|invalid model)|librknnrt` → RKNN runtime/toolkit mismatch is common. Check board-side `librknnrt` / `rknn_toolkit_lite2` version, then rebuild the `.rknn` model with the matching RKNN Toolkit 2 release. (<https://github.com/airockchip/rknn-toolkit2>)

## 设备规格

- **Radxa ROCK 5B** (`rock-5b`):Rockchip RK3588 / 6 TOPS / 8GB / rknn
- **Radxa ROCK 5 ITX** (`rock-5-itx`):Rockchip RK3588 / 6 TOPS / 16GB / rknn
- **Orange Pi 5 Plus** (`orange-pi-5-plus`):Rockchip RK3588 / 6 TOPS / 16GB / rknn
- **Firefly ROC-RK3588S-PC** (`firefly-roc-rk3588s-pc`):Rockchip RK3588S / 6 TOPS / 8GB / rknn

## 官方资料

- [Radxa ROCK 5B Documentation](https://docs.radxa.com/en/rock5/rock5b/getting-started/introduction)
- [Radxa ROCK 5 ITX Documentation](https://docs.radxa.com/en/rock5/rock5itx/getting-started/introduction)
- [Rockchip RKNN Toolkit 2](https://github.com/airockchip/rknn-toolkit2)
- [Orange Pi 5 Plus Product Page](http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-5-plus.html)
- [Firefly ROC-RK3588S-PC Wiki](https://wiki.t-firefly.com/en/ROC-RK3588S-PC/)
