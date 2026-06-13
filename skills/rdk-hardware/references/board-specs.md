# RDK 板型规格对照

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

5 款 RDK 板型的硬件规格与探测标识,供选型、命令适配与设备识别参考。

## RDK X3 (`rdk-x3`)

- **SoC**:Sunrise 3 (X3J3)
- **算力**:5 TOPS (BPU)
- **CPU**:Quad-core Cortex-A53 @1.5GHz
- **内存**:2 GB
- **模型格式**:.bin (Bernoulli2)
- **诊断命令**:`hrut_smi`
- **运行时路径**:/opt/tros/humble
- **系统 Python**:/usr/bin/python3.8
- **推理库**:bpu_infer_lib_x3
- **GPIO**:40 针,28 路 GPIO,I2C×2/SPI×1/UART×3/PWM×2,3.3V
- **摄像头**:mipi×2(2-lane MIPI CSI-2)、usb×1(USB 3.0 Type-A host for USB camera; USB2 Host signals are exposed on 40PIN)
- **探测标识**:`x3`、`X3`、`sunrise3`、`j3`、`xj3`、`X3J3`
- **已知限制**:Max 5 TOPS — heavy models (YOLOv5x, large transformers) will be very slow;2 GB RAM — models larger than ~500 MB will OOM;Only one USB 3.0 host port on the development kit — multi-camera USB bandwidth is limited;Bernoulli2 BPU — limited operator support, no Transformer/Attention ops

## RDK X5 (`rdk-x5`)

- **SoC**:Sunrise 5
- **算力**:10 TOPS (BPU)
- **CPU**:Octa-core Cortex-A55 @1.5GHz
- **内存**:8 GB
- **模型格式**:.bin (Bayes)
- **诊断命令**:`hrut_bpuprofile -b 0`
- **运行时路径**:/opt/tros/humble
- **系统 Python**:/usr/bin/python3.10
- **推理库**:bpu_infer_lib_x5
- **GPIO**:40 针,28 路 GPIO,I2C×3/SPI×2/UART×5/PWM×8,3.3V
- **摄像头**:mipi×2(2 x 4-lane MIPI CSI-2)、usb×4(USB 3.0)
- **探测标识**:`x5`、`X5`、`sunrise5`、`Sunrise 5`
- **已知限制**:LLM limited to ≤2B parameter quantized models on-device;Bayes BPU — partial Attention op support, some Transformer models may fail conversion

## RDK Ultra (`rdk-ultra`)

- **SoC**:Sunrise 5 Ultra
- **算力**:96 TOPS (BPU)
- **CPU**:Octa-core Cortex-A55
- **内存**:8 GB
- **模型格式**:.bin (Bayes)
- **诊断命令**:`hrut_bpuprofile -b 0`
- **运行时路径**:/opt/tros/humble
- **系统 Python**:/usr/bin/python3.10
- **推理库**:bpu_infer_lib_x5
- **GPIO**:40 针,28 路 GPIO,I2C×3/SPI×2/UART×5/PWM×8,3.3V
- **摄像头**:mipi×4(4-lane MIPI CSI-2)、usb×4(USB 3.0)
- **探测标识**:`ultra`、`Ultra`、`RDK Ultra`
- **已知限制**:Higher power consumption — needs active cooling (12V/3A DC);Same Bayes architecture as X5 — model .bin compatible but performance scaled up

## RDK S100 (`rdk-s100`)

- **SoC**:S100 (Nash)
- **算力**:80 TOPS (BPU)
- **CPU**:Hexa-core Cortex-A78AE @1.5GHz + Quad-core Cortex-R52+ MCU @1.2GHz
- **内存**:12 GB
- **模型格式**:.bin (Nash)
- **诊断命令**:`hrut_bpuprofile`
- **运行时路径**:/opt/tros/humble
- **系统 Python**:/usr/bin/python3.10
- **推理库**:bpu_infer_lib_s100
- **GPIO**:40 针,20 路 GPIO,I2C×4/SPI×2/UART×6/PWM×8,3.3V
- **摄像头**:mipi×2(2 x 4-lane MIPI CSI-2 via the camera expansion board)、gmsl×4(Fakra-Mini 4-in-1 GMSL2 on the camera expansion board)、usb×4(USB 3.0)
- **探测标识**:`s100`、`S100`、`RDK S100`、`rdk_s100`
- **已知限制**:12-20V DC 供电，功耗高于 X5;Nash BPU 模型格式与 Bayes(X5) 不兼容，需重新编译;MIPI/GMSL 相机需配扩展板

## RDK S100P (`rdk-s100p`)

- **SoC**:S100P (Nash)
- **算力**:128 TOPS (BPU)
- **CPU**:Hexa-core Cortex-A78AE @2.0GHz + Quad-core Cortex-R52+ MCU @1.2GHz
- **内存**:24 GB
- **模型格式**:.bin (Nash)
- **诊断命令**:`hrut_bpuprofile`
- **运行时路径**:/opt/tros/humble
- **系统 Python**:/usr/bin/python3.10
- **推理库**:bpu_infer_lib_s100
- **GPIO**:40 针,20 路 GPIO,I2C×4/SPI×2/UART×6/PWM×8,3.3V
- **摄像头**:mipi×2(2 x 4-lane MIPI CSI-2 via the camera expansion board)、gmsl×4(Fakra-Mini 4-in-1 GMSL2 on the camera expansion board)、usb×4(USB 3.0)
- **探测标识**:`s100p`、`S100P`、`RDK S100P`、`rdk_s100p`
- **已知限制**:Nash BPU 模型格式与 Bernoulli2/Bayes 不兼容，需重新编译;高负载供电和散热要求高于 X 系列，长时间满载必须留足电源余量;MIPI/GMSL 相机需配扩展板
