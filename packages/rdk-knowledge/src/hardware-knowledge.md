## RDK 硬件与系统参考（离线可用）

> 本文档提供 Agent 离线即可回答的 RDK 硬件/系统知识。
> 板型参数（TOPS、RAM、SoC）已在 device profiles 中，此处不重复。

---

### 1. 40PIN GPIO

- 40 Pin 排针物理兼容树莓派，但 **GPIO 编号与树莓派不同**，不能直接套用 RPi 编号
- 引脚电压：3.3V 逻辑电平；Pin 1/17 = 3.3V 电源，Pin 2/4 = 5V 电源
- 检查引脚复用状态：`cat /sys/kernel/debug/pinctrl/*/pinmux-pins`
- Python 控制：`Hobot.GPIO`（API 兼容 RPi.GPIO）；C 控制：`libwiringpi`
- **X5 vs X3 差异**：X5 有更多 UART(5路)/PWM(8路)/I2C(3路)；X3 的 I2C 仅 2 路
- **S100 差异**：MCU (R52+) 可承担实时 GPIO 控制，主 CPU 侧 GPIO 仅 20 路

### 2. 摄像头系统

**MIPI CSI**
- 支持官方模组：IMX219 (8MP)、GC4663 (4MP) 等
- X3 仅 2-lane；X5/Ultra 支持 4-lane；S100 需通过扩展板接入
- 节点：`hobot_mipi_cam`，launch 中需指定 `sensor` 型号和 `video_device` 路径

**USB UVC**
- 通过 `hobot_usb_cam` 节点接入 ROS2
- **关键**：默认 YUYV 格式在多数摄像头上不稳定，必须设为 **MJPEG**
- 排障三步：`v4l2-ctl --list-formats-ext` → 确认 MJPEG + 分辨率 → 修改 launch 参数
- 多路 `/dev/video*` 可能功能不同（一路出图一路出元数据），需逐个验证

**GMSL（仅 S100/S100P）**
- 车规级 GMSL2 模组，需配扩展板
- 适合多路高分辨率/长距离场景（自动驾驶/工业检测）

### 3. BPU 推理流水线

**架构差异**
| 架构 | 板型 | 特性 |
|------|------|------|
| Bernoulli2 | X3 | 仅 CNN，算子集小 |
| Bayes | X5, Ultra | CNN 优化，部分 Attention 算子 |
| Nash | S100/S100P | CNN + Transformer，160+ ONNX 算子 |

**推理方式**
- C/C++: `libdnn` / `bpu_infer_lib` 直接推理
- Python: `hobot_dnn` Python binding（需系统 Python，不支持 conda/venv 中使用）
- ROS2: TROS 推理节点（`hobot_dnn` ROS2 wrapper）自动订阅图像 topic 输出结果

**性能监控**（按板型选择，注意 `hrut_smi` / `bputop` **并非每个板型都装**）
- `cat /sys/devices/system/bpu/bpu0/ratio` — **所有板型通用**的 BPU 使用率（0–100），最稳的兜底方案
- `cat /sys/devices/system/bpu/bpu0/devfreq/*/cur_freq` — BPU 当前频率（所有板型通用）
- `hrut_somstatus` — SoC 温度/电压/频率（所有板型通用）
- `hrut_bpuprofile -b 0` — **X5 实际可用**的 BPU profiling 工具（X5 标配 1 个 BPU 核 = bpu0；同时输出温度、CPU/BPU/DDR/GPU 频率与 BPU ratio）
- `hrut_smi` — **X3 部分镜像**有；**X5 大多无此命令**，请勿默认调用
- `bputop` — **X3/Ultra 部分镜像**有；**X5 大多无此命令**，请勿默认调用
- `hrut_count` — 推理计数（所有板型通用）

> 推荐顺序：**先 sysfs 节点（最稳） → 再 `hrut_bpuprofile`（X5 / Ultra 综合视图） → 最后再考虑 `hrut_smi/bputop`（不要假设它们存在）**。
> 在 X5 上用 `hrut_smi && hrut_somstatus` 会得到 `command not found`；正确写法是 `hrut_bpuprofile -b 0 && hrut_somstatus`，或更通用的 `cat /sys/devices/system/bpu/bpu0/ratio && hrut_somstatus`。

### 4. 模型转换概要

```
训练框架 (PyTorch/TF) → 导出 ONNX → hb_mapper 量化转换 → .bin (BPU 可执行)
```

- `hb_mapper checker` — 检查 ONNX 是否可转换、哪些算子在 BPU 上运行
- `hb_mapper makertbin` — 实际转换（需校准数据集做 PTQ）
- `hb_eval_perf` — 评估编译后模型的推理延迟和吞吐
- 量化方式：PTQ（训练后量化，简单快速）、QAT（量化感知训练，精度更高）
- **注意**：编译后的 `.bin` 绑定 BPU 架构，跨板型不能直接使用

### 5. TROS (TogetheROS.Bot)

- 基于 ROS2 Humble，路径 `/opt/tros/humble/`
- 预装节点在 `/opt/tros/humble/lib/<pkg>/` 和 `/opt/tros/humble/share/<pkg>/`
- 模型文件通常在包内 `config/` 目录：`/opt/tros/humble/lib/<pkg>/config/*.hbm`
- 环境激活：`source /opt/tros/humble/setup.bash`
- **S100 特殊**：部分镜像仅 `sunrise` 用户的 `~/.bashrc` 配了 TROS source，root 需手动执行

**常用排障**
- `ros2 pkg list | grep <name>` — 确认包是否安装
- `ros2 pkg prefix <name>` — 查包安装路径
- `ros2 launch <pkg> <launch.py> --show-args` — 查看 launch 可用参数
- `ros2 node list` / `ros2 topic list` — 确认节点和话题状态

### 6. 系统路径与存储

| 路径 | 用途 | 可写性 |
|------|------|--------|
| `/opt/tros/humble/` | TROS 安装目录 | 只读（apt 管理） |
| `/userdata/` | 用户持久数据 | 可写（部分板型） |
| `/tmp/` | 临时文件 | 可写（重启清空） |
| `/app/` | 应用目录 | 部分镜像只读 |
| `/root/` 或 `$HOME` | 用户主目录 | 可写 |

- 系统镜像版本：`cat /etc/version`
- 板型识别：`cat /sys/class/socinfo/board_id`
- eMMC 扩展分区：`resize2fs /dev/mmcblk0p<N>`

### 7. 网络与连接

- **SSH**：默认 `root` / `root`，端口 22
- **Type-C 以太网**：部分板型支持 USB Type-C 共享网络（`usb0` 接口，IP 通常 192.168.1.10）
- **WiFi**：`nmcli dev wifi list` → `nmcli dev wifi connect <SSID> password <PWD>`
- **CAN**（X5/S100）：`ip link set can0 type can bitrate 500000` → `ip link set can0 up`
- **多机 ROS2 通信**：确保 `ROS_DOMAIN_ID` 一致，防火墙放行 UDP 7400+

### 8. 散热与功耗

- X3/X5：被动散热通常够用；满载 AI 推理建议加风扇壳
- Ultra：**必须**主动散热（12V/3A DC 供电）
- S100：12-20V DC 供电，长时间满载建议风扇 + 散热片
- 温度监控：`hrut_somstatus` 或 `cat /sys/devices/virtual/thermal/thermal_zone*/temp`
- CPU 降频策略：`cat /sys/devices/system/cpu/cpufreq/policy0/scaling_governor`（默认 schedutil）
- 过热保护：SoC 有硬件过温保护，但频繁触发说明散热方案不足

### 9. 常见开发陷阱

1. **USB 摄像头崩溃**：99% 是 YUYV 格式导致 → 改 MJPEG
2. **模型路径找不到**：launch 依赖工作目录 → 用 `find` 定位绝对路径
3. **pip install 板端失败**：无网或架构不匹配 → 在联网机器下载 aarch64 whl 再拷贝安装
4. **ros2 命令不存在**：未 source TROS → `source /opt/tros/humble/setup.bash`
5. **/app 目录只读**：放到 `/tmp`、`/userdata`、`$HOME`
6. **GPIO 编号错误**：不能用树莓派的编号 → 查当前板型的 pinout 文档
7. **Docker 镜像架构错**：必须用 arm64/aarch64 镜像
8. **hobot_dnn 在 venv 中找不到**：必须用系统 Python，不支持虚拟环境

### 10. 双目深度（hobot_stereonet）

- **仓库**：<https://github.com/D-Robotics/hobot_stereonet>
- **板型适配**：X5/Ultra/S100 均可（BPU 加速版本不同，bin 不通用）
- **标定**：必须先用棋盘格做双目内/外参标定，生成 `left.yaml`/`right.yaml`/`extrinsics.yaml`，路径在 launch 中指定
- **常见坑**：
  - 左右相机时间戳偏差 > 30ms 会显著影响视差精度，建议用硬件触发（trigger 线）或 PTP 时间同步
  - 输出深度图分辨率与输入分辨率成反比，1280x720 输入 → 640x360 深度图
  - 推理 fps：X5 ~15-25fps，Ultra/S100 实时

### 11. Livox 激光雷达（livox_ros_driver2）

- **仓库**：<https://github.com/D-Robotics/livox_ros_driver2>
- **支持型号**：Mid-360（车规小型化）、HAP（量产）、Avia（开发款）等
- **网络**：雷达走以太网 + UDP；默认网段 192.168.1.x
  - Mid-360 出厂 IP `192.168.1.12x`，板端网卡需配 `192.168.1.1xx/24`
  - HAP 出厂 IP `192.168.1.150`
  - 防火墙放行 UDP 56000-56010
- **启动**：`ros2 launch livox_ros_driver2 msg_HAP_launch.py`（按型号选 launch）
- **数据类型**：`livox_ros_driver2/msg/CustomMsg`（含强度+时间戳）和标准 `sensor_msgs/PointCloud2` 二选一
- **常见坑**：
  - 网卡 MTU < 1500 会丢包，全部点云稀疏 → `sudo ip link set dev eth0 mtu 1500`
  - Wi-Fi 桥接走雷达数据带宽不够，**必须**走有线
  - rosbag 录制点云体积巨大（HAP ~50MB/s），按需开关录制

### 12. X5 板端 IO 加速库（x5-hobot-io / x5-hobot-utils）

- **x5-hobot-io**：<https://github.com/D-Robotics/x5-hobot-io>，C 语言绑定 X5 的 GPIO/I2C/SPI/PWM/UART，比 Python `Hobot.GPIO` 延迟低 ~10x
  - 适用于实时控制（电机、舵机、传感器轮询）
  - 编译需 RDK X5 工具链；交叉编译看 README
- **x5-hobot-utils**：<https://github.com/D-Robotics/x5-hobot-utils>，X5 平台诊断/刷机辅助工具集

### 13. 镜像与 TROS 工程

- **镜像构建**：
  - X3 → <https://github.com/D-Robotics/rdk-gen>
  - X5 → <https://github.com/D-Robotics/x5-rdk-gen>
- **TROS 一键构建**：<https://github.com/D-Robotics/robot_dev_config> 是入口仓库，按 README 跑 `init.sh` 会拉取所有 hobot_* 仓库到 colcon workspace
- **下载清单**：<https://github.com/D-Robotics/system_download> 维护各版本镜像/资源的实际下载链接

---

### 14. 板型世代与定位（选型决策树）

| 代次 | 代表板 | 定位 | 采购口径 | 选它的理由 |
|------|--------|------|---------------------|------------|
| 一代 | **RDK X3** / X3 Module | 入门 / 教学 / 替代树莓派 + AI | 入门档，实时价格以官方渠道为准 | 只做轻量检测 / GPIO / ROS2 入门 |
| 二代 | **RDK X5** / X5 Module | 主力 / 机器人视觉 / 端侧 AI | 主力档，实时价格以官方渠道为准 | 性价比高；主推 TROS + DOSOD + 小 LLM |
| 二代+ | RDK Ultra | 高算力工业 | 项目/分销口径，以官方渠道为准 | 上量客户；个人开发者优先 X5/S100 |
| 三代 | **RDK S100 / S100P** | 具身智能 / 人形机器人 / 大模型 | 以官方渠道实时价格为准 | 算控一体；要 LLM/VLM/MCU 实时控制 |

**选型"一句话"决策**：
1. 学生 / 教学 / 预算敏感 → **X3**（但知道轻量模型上限）
2. 机器人 / SLAM / YOLO / 小 LLM / ROS2 主开发 → **X5**（8GB 版优先，实际 SKU/价格以官方渠道为准）
3. 要跑 LLM 对话 / VLM 多模态 / 端侧 7B 级量化模型 / 实时关节控制 → **S100**（12GB）
4. 想跑更大模型/VLM 或多路 GMSL 相机 → **S100P**（24GB，具体模型清单以官方 Model Zoo / hobot_llm 文档为准）
5. **不知道买哪个**：默认推 **X5 8GB 套餐**——覆盖 90% 个人开发者需求，报错踩坑最少（社区样本最多）。

**跨代**的硬约束（反复跟用户强调，不要心存侥幸）：
- 模型 `.bin` 跨代次**不通用**（Bernoulli2 / Bayes / Nash 工具链绑死架构）
- 40PIN 电气兼容，但 GPIO 编号 / I2C 总线数 / PWM 通道数都不同，驱动代码**须按板型适配**
- TROS 大版本（Foxy / Humble）与 RDK OS 主版本绑定，**不要指望同一个 apt 源能跨板型装完整栈**

### 15. BPU 架构演进与模型互通性

| 架构 | 工艺世代 | 板型 | 等效算力 (INT8) | ONNX 算子 | Transformer | LLM/VLM |
|------|--------|------|-----------------|-----------|-------------|---------|
| **Bernoulli2** | 旧一代 | X3 / X3 Module | 5 TOPS | 小集，仅 CNN 主干 | ❌ 基本不支持 | ❌（社区有 hobot_llm 小规模试跑） |
| **Bayes / Bayes-e** | 二代 | X5 / X5 Module / Ultra | 10 TOPS (X5) / 96 TOPS (Ultra) | CNN 全 + 部分 Attention | ⚠️ 部分算子要等价改写 | ⚠️ ≤2B 量化 LLM（如 Qwen2-0.5B）|
| **Nash / Nash-e** | 三代 | S100 / S100P | 80 / 128 TOPS | 160+ ONNX，CNN + Transformer 深度优化 | ✅ 原生支持 | ✅ 7B 级量化 LLM、VLM 起步；更大模型以官方清单为准 |

**模型 `.bin` 互通性矩阵**（重要！）：

| 源 → 目标 | X3 | X5 | Ultra | S100 |
|-----------|----|----|-------|------|
| X3 (.bin) | ✅ | ❌ 重编 | ❌ 重编 | ❌ 重编 |
| X5 (.bin) | ❌ 重编 | ✅ | ✅ 多数 | ❌ 重编 |
| Ultra (.bin) | ❌ 重编 | ⚠️ 性能降级可用 | ✅ | ❌ 重编 |
| S100 (.bin) | ❌ 重编 | ❌ 重编 | ❌ 重编 | ✅ |

**工具链对应关系**（主机上安装，不在板子里）：
- X3 → 地平线 Horizon OE SDK v1.x (Bernoulli2)，`hb_mapper` 命令族
- X5 / Ultra → 地平线 Horizon OE SDK v2.x (Bayes)，同 `hb_mapper`，但 march 参数不同
- S100 → D-Robotics **"天工开物（J6P/S100）"** 工具链，入口 <https://developer.d-robotics.cc/rdk_doc/rdk_s/FAQ/toolchain>，命令族变化更大（新算子约束页以官网 S100 工具链章节为准）
- **误区**：`hb_mapper` 不在板子上（板子只负责跑 `.bin`），不要叫用户在板上找转换器——他需要在 x86 主机（优先 Docker）跑工具链

### 16. RDK OS 版本线与用户系统差异

**官方版本主线**（`cat /etc/version` 或 `rdkos_info` 可查，2.1.0+ 起 `rdkos_info` 可用）：

| RDK OS 主版本 | 基础 | TROS | 典型板型支持 | 升级策略 |
|---------------|------|------|--------------|----------|
| **1.x** (历史) | Ubuntu 20.04 + 旭日 X3 派专用 | Foxy（闭源早期）| 只支持 X3 旧板 | 不可 `apt` 升级；必须**重刷镜像** |
| **2.x** | Ubuntu 20.04 | **Foxy** 为主 | X3 / X3 Module | 同主版本内可按官方流程升级；Studio 不自动跑整机 `apt upgrade` |
| **3.x** | Ubuntu 22.04 | **Humble** 为主 | X3 / X3 Module / X5 / X5 Module / Ultra / S100 | 同主版本内可按官方流程升级；Studio 不自动跑整机 `apt upgrade` |

**默认登录用户差异**（按板型 × 镜像版本）：

| 板型 | 默认用户 | 密码 | root 是否直连 | 备注 |
|------|---------|------|---------------|------|
| X3 / X3 Module | `sunrise` | `sunrise` | 一般可 `sudo su` 或 `ssh root@... (root/root)` | **Studio 默认 SSH 是 root/root**，板子重刷后请确认 |
| X5 / X5 Module / Ultra | `root` | `root` | ✅ 直接 root | `sunrise` 作为普通用户也可能存在 |
| S100 / S100P | **多数 root**，**少数镜像仅 sunrise** | `root` / `sunrise` | 视镜像 | 若 root 下 `source /opt/tros/humble/setup.bash` 也出不来 ros2，换 `su - sunrise` 再试；这不是 bug，是镜像设计 |

**版本判断命令**（优先级从稳到新）：
```bash
rdkos_info                   # 2.1.0+ 最完整（含 BPU/温度/包清单一键输出）
cat /etc/version             # 所有版本通用；输出形如 3.4.1 / x3_ubuntu_v1.1.6
cat /proc/device-tree/model  # 板型字面
cat /sys/class/socinfo/board_id  # 板型数字（X5=302 等）
```

**典型错配场景**：
- 旧 X3 用户拿 X5 的 TROS Humble 文档照搬，包名全不对（X3 是 `tros-foxy-*`，X5 是 `tros-humble-*`）
- 用户把 "重刷系统" 当成 "重启"——其实 RDK OS 1.x→2.x / 2.x→3.x 必须下载新镜像烧录

### 17. S100 "大小脑异构" 与 MCU 协同（具身智能关键）

S100 和 X 系列最大的**设计哲学差异**：不是算力堆得更高，而是 **CPU + BPU + MCU 三块异构**，"感知-决策-控制"在单 SoC 内闭环。

**三块的分工**：

| 计算单元 | 硬件 | 典型任务 | 开发者接触面 |
|----------|------|----------|--------------|
| **"大脑" CPU** | 6x A78AE @1.5GHz (S100) / 2.0GHz (S100P) | Linux 应用、ROS2 节点、AI 任务编排 | 用户主要写代码的地方，Ubuntu 22.04 |
| **"决策" BPU** | Nash 80 TOPS (S100) / 128 TOPS (S100P) | LLM / VLM / 目标检测 / 分割 / 点云 | 模型转换后部署，走 `hobot_dnn` / BPU runtime |
| **"小脑" MCU** | 4x R52+ @1.2GHz | 关节实时控制（ms 级）、IMU 预处理、电机回路 | 需要单独固件，走 IPC 与 CPU 通信；不是普通 Linux 程序 |

**MCU 的关键特性**（用户常忽视）：
- 4 核 R52+ = **1 对 DCLS 锁步核 + 2 核支持 Split-Lock**（可独立 / 可锁步，按安全需求选）
- 运行 RTOS / 裸金属固件，不运行 Linux
- 与 CPU 通过 IPC（shared memory + 通知）交互，可达 kHz 级回路
- 官方宣传："CPU 占用率下降 80%"——因为关节控制从 Linux 实时线程卸到了 MCU

**S100 与 X5 典型机器人链路对比**：

```
X5 机器人（传统）：
  CPU (Linux) → [ROS2 节点调用 BPU 推理] → [ROS2 节点发 velocity cmd]
                                          → [Linux RT 线程 PID 电机回路]  ← 抖动、抢占
                                          
S100 机器人（推荐）：
  CPU (Linux) → [ROS2 + BPU 推理 + 规划] → [IPC → MCU]
                                                  ↓
                                      MCU (RTOS) → [电机驱动器 PWM/CAN]  ← 硬实时
```

**开发者实操要点**：
- MCU 固件**不在 `apt`** 里，是独立工具链烧录（通过 JTAG 或 S100 的 Type-C 调试口）
- Main Domain / MCU Domain 两个独立 UART 调试口，别弄混
- 要上手 MCU 建议先跑官方 MCU SDK + 示例；纯视觉应用用户可以暂不碰 MCU，只当 BPU 算力板用
- 相机走扩展板（MIPI 2x 4-lane 或 GMSL 多路），裸板**没有**直接的相机接口

**S100 vs S100P 买哪个**：
- S100 (12GB, 80 TOPS, A78AE @1.5GHz) → 7B 级量化 LLM、主流 VLM、双足/四足本体
- S100P (24GB, 128 TOPS, A78AE @2.0GHz) → 更大模型/VLM 原型、多路 GMSL、严肃科研；具体模型上限以官方 Model Zoo / hobot_llm 文档为准

### 18. 用户高频误区与一句话纠正

> Moss 收到以下问法时，**先纠正误区再继续**；不要顺着错误前提回答。

| 误区表述 | 事实与纠正 |
|----------|-----------|
| "我在 X3 编译的 .bin 直接拷到 X5 跑" | 不行，BPU 架构不同（Bernoulli2 vs Bayes），必须用对应工具链重编 |
| "Ultra 就是 X5 超频版" | 不是。Ultra 是同 Bayes 架构但**算力×9.6**、8GB RAM、主动散热专设的工业/科研板；`.bin` 多数互通但 X5 上测试过不代表 Ultra 能跑满 |
| "`hb_mapper` 我在板子上 `apt install` 不到" | 对。工具链在**主机 Docker**里运行，不在板上；板上只装 runtime（`hobot-dnn`、`bpu_infer_lib_*`）|
| "S100 = Jetson Orin 国产替代" | 定位接近但架构差异大——Jetson 走 GPU + CUDA，S100 走 BPU + ONNX 工具链；代码**不能直接迁移**，需要重新走模型转换 |
| "RDK X5 的默认用户是 sunrise" | **X5 默认用户是 `root`/`root`**；`sunrise` 是 **X3** 的惯例 |
| "模型放 `/opt/hobot/model/rdkx5/` 吧" | 实际路径是 **`/opt/hobot/model/x5/`**（目录名不含 `rdk` 前缀）；X3 则在 `/opt/hobot/model/rdkx3/`（**有** `rdk` 前缀，历史原因，确实不对称）|
| "X5 也能用 `hrut_smi` / `bputop`" | **不能**。RDK OS 3.x 的 X5 镜像只装了 `hrut_bpuprofile` + `hrut_somstatus`；`hrut_smi` 主要在 X3，`bputop` 主要在 X3/Ultra。所有板通用的兜底是 `cat /sys/devices/system/bpu/bpu0/ratio` |
| "RDK OS 1.x 的机器 `apt upgrade` 到 3.x" | **不行**。1.x 到 2.x/3.x 必须**重刷镜像**；同主版本升级也要按官方流程评估与备份，Studio 不自动跑整机 `apt upgrade` |
| "hobot_dnn 我放 venv 里用" | 不行。`hobot_dnn` Python bindings 只认**系统 Python**（`/usr/bin/python3`），conda/venv 里找不到 |
| "rosdepc 是 pip 包" | 不是。`rosdepc` 是D-Robotics对 `rosdep` 的国内镜像加速封装，随 TROS apt 包一起来 |
| "RDK Studio = RDK 硬件" | **RDK Studio 是桌面 IDE 工作台**（本仓库即是），运行在 PC 上连 RDK 板；不是板子本身，也不预装在板上（但可以和板上 OpenClaw 协同） |
| "NodeHub 和 Model Zoo 是一回事" | 两个仓库：**NodeHub** 侧重 ROS2 节点级应用（developer.d-robotics.cc/en/nodehub，Studio 内也有 NodeHub 入口），**Model Zoo** (`rdk_model_zoo` / `rdk_model_zoo_s`) 侧重模型 + 推理样例 |
| "RDK 是地平线的" | 品牌称谓：现官方为 **D-Robotics**；历史上与地平线有渊源，外部旧资料里的 "Horizon / 地平线" 指的是同一条产品线，口径以D-Robotics为准 |
| "RDK S100 就是速腾聚创 RoboSense 的激光雷达吧" | **完全两回事**！RDK S100 是D-Robotics的**计算开发板**（SoC + BPU）；速腾聚创的 RS 系列是激光雷达传感器。CSDN 上确实有把两者混淆的文章，直接纠正即可。 |

---

### 19. 新手"从 0 到 1"标准路径（X5 为主，覆盖 90% 社区咨询）

> 用户第一次拿到板说 "我怎么开始"、"跑个 demo"、"入门"、"开箱" 时，按这个清单推进，不要一上来就讲 BPU 工具链。

**X5 开箱到第一个 YOLO 检测的最短路径**（实机验证，2026 年主流固件 3.4.x）：

```
[ 1 ] 烧录 SD 卡                  → RDK Studio 烧录 / Rufus，镜像从 developer.d-robotics.cc 资源入口或 GitHub `D-Robotics/system_download` 清单获取；3.x 镜像默认 Humble
[ 2 ] 供电 + 启动                 → **必须**官方 5V/5A Type-C；电脑 USB 口供电≈反复重启
[ 3 ] 指示灯判断                  → 绿灯=供电正常；橙灯=系统正常；15s 后橙灯不亮→烧录有问题
[ 4 ] 联网（WiFi / 网线）         → 桌面右上角 NetworkManager / `nmcli dev wifi connect "SSID" password "pwd"`
[ 5 ] 获取 IP                     → `ip addr`；或 RDK Studio 侧栏自动扫描
[ 6 ] SSH 登录                    → `ssh root@<ip>`，**默认密码 `root`**（X5/S100）；X3 则是 `sunrise@<ip>` + `sunrise`
[ 7 ] 第一个 YOLO 示例（预装）    → `cd /app/pydev_demo/07_yolov5_sample/ && sudo python3 ./test_yolov5.py`
[ 8 ] USB 摄像头实时检测          → `cd /app/pydev_demo/05_web_display_camera_sample/`，浏览器访问 `http://<ip>:8000`
```

**X5 `/app/pydev_demo/` 内置示例清单**（13 个，直接可跑，无需转模型）：

| 目录 | 功能 | 适合验证什么 |
|------|------|--------------|
| `01_basic_sample/` | BPU 推理基础 API | 理解 hobot_dnn 调用流程 |
| `02_usb_camera_sample/` | USB 摄像头采集 | 验证 USB 相机（必 MJPEG） |
| `03_mipi_camera_sample/` | MIPI 摄像头采集 | 验证 MIPI 模组 + sensor 型号 |
| `04_segment_sample/` | 语义分割 | FCN / DeepLab 类 |
| `05_web_display_camera_sample/` | Web 浏览器显示推理结果 | 8000 端口实时看效果，最适合演示 |
| `06_yolov3_sample/` | YOLOv3 | 经典检测 |
| `07_yolov5_sample/` | **YOLOv5 (推荐首选)** | 最经典，社区资料最多 |
| `08_decode_rtsp_stream/` | RTSP 流解码 | IP 摄像头、NVR 场景 |
| `09_body_kps_sample/` | 人体关键点 | 姿态估计 |
| `10_body_det_sample/` | 人体检测 | mono2d_body |
| `11_uvc_sample/` | UVC 相机 | USB 视频类通用 |
| `12_rtsp_stream_decode_resnet/` | RTSP + 分类 | 流水线样例 |
| `13_yolo_world_sample/` | YOLO-World 开放词汇 | 用文字 prompt 检测 |

**新手三个"标志性成就"路径**（由浅入深）：
1. **跑通预装 YOLOv5** → 5 分钟 → "确认板卡正常 + BPU 工作"
2. **用 Web 示例看实时检测** → 10 分钟 → "摄像头 + BPU + 网络" 三者联调
3. **跑一次自己训练的模型** → 半天到数天 → 进入"模型部署全流程"（下一节）

### 20. 模型部署全流程与高频踩坑（**最核心的用户痛点**）

> 社区数据：新手在这一步卡住的占比 **60%+**。看到用户说 ".pt 拷上去跑" / "推理巨慢" / "YOLO 转换失败" 等任一关键词 → **先警告再继续**，不要顺着他跑。

**第一铁律 — `.pt` / `.onnx` 不能直接在 BPU 上加速**：
- 原生 PyTorch / ONNX Runtime 在 RDK 板上只会走 **CPU**，BPU 完全不参与 → 通常只有 **1-2 FPS**
- 用户说"我模型跑上去只有 X FPS" / "直接部署的 .pt" → **立即**告诉他要走 `.pt → .onnx → .bin` 全流程，否则没意义
- 社区里大量博客都印证这点（CSDN "直接部署 .pt 推理速度慢，视频流很卡"）

**完整全流程（主机 + 板端）**：

```
[主机 x86 / Docker]                     [板端 aarch64]
────────────────                         ──────────
[1] PyTorch/TF 训练                      
[2] 导出 ONNX（用 vendor fork）     ──▶  
[3] hb_mapper checker 验证算子       
[4] 准备校准数据集（~100 张）            
[5] hb_mapper makertbin 量化转换     
[6] 得到 .bin                       ──▶  [7] scp 到板上 /userdata/models/
                                         [8] hobot_dnn / ROS2 节点加载推理
                                         [9] hb_eval_perf 评估 fps/latency
```

**步骤级踩坑（都是社区真实反复出现的）**：

| 坑 | 症状 | 解决 |
|----|------|------|
| 用了 ultralytics 官方 yolov5 仓导出 ONNX | `hb_mapper checker` 报算子不支持 / 转换成功但上板检测框全乱 | **必须**用 D-Robotics fork：<https://github.com/D-Robotics/rdk_model_zoo/tree/main/demos/detect/YOLOv5>（参考 README_cn.md）；yolov5 本体**必须** checkout 到 `v2.0` tag（v6+ 的 Focus 层改动会让转换失败） |
| Docker 拉不下来 / 启动不了 | 用户在 Win 上装 WSL2 + Docker，config 出错起不来 | 优先用**D-Robotics官方 Docker 镜像**（Horizon OE / 天工开物）；WSL2 要 `wsl --update`；内存分配 ≥ 8GB；镜像大所以国内优先拉 CPU 版 |
| ONNX opset 版本不对 | `hb_mapper checker` 报不支持的算子 | export 时固定 `--opset 11`（Bayes）/ 以工具链文档为准；X3 Bernoulli2 更严格，S100 Nash 最宽松 |
| 校准数据集缺失 / 量化精度暴跌 30%+ | 转换成功但上板 mAP 暴跌 | 必须准备 **50-100 张**与训练集分布一致的图片做 PTQ；RKNN 社区经验（同理适用）：`do_quantization=True` 时校准集决定精度 |
| 转换时 OOM | 大模型 `hb_mapper makertbin` 进程被杀 | 主机 RAM ≥ 16GB，或用 ZRAM；先试 YOLOv5s 不要直接 YOLOv5x |
| 工具链 `march` 参数填错 | `hb_mapper checker --march bayes-e` 的 `bayes-e` 不能用在 X3 | X3 → `bernoulli2` / X5/Ultra → `bayes-e` / S100 → `nash-e`（以工具链文档最新写法为准） |
| 板上 runtime 版本与 .bin 不匹配 | `libdnn` / `hobot_dnn` 初始化失败 | `dpkg -l \| grep hobot-dnn` 看板上版本；必要时按官方发布说明升级 `hobot-dnn` / BPU runtime |
| 在虚拟环境里 import hobot_dnn | `ModuleNotFoundError` | `hobot_dnn` Python bindings 只认系统 Python `/usr/bin/python3`；conda/venv 全部失败，社区反复踩 |

**Moss 应对脚本（遇到模型部署问题时）**：
1. 先确认**模型当前状态**（`.pt` / `.onnx` / `.bin`？在主机还是板上？）
2. **看到 `.pt` / `.onnx` 上板跑**：立刻打断，解释三步流程
3. 明确**板型 → 对应工具链**（X3 用 OE v1，X5/Ultra 用 OE v2，S100 用天工开物）
4. 转换报错时**不要乱猜**，让用户粘 `hb_mapper` 的错误日志前 30 行
5. 成功转换后才谈部署路径（`/userdata/models/` 或 TROS 包 `config/`）

### 21. 跨平台对比：树莓派 / Jetson / RK 与 RDK 的横向定位

> 用户问 "RDK 和 X 比哪个好" 时非常高频，**不要**回避 —— 但也**不要**抬高 RDK。每个板都有适合的场景。

| 维度 | **RDK X5** | Jetson Nano / Orin Nano | 树莓派 5 + AI HAT+ | Orange Pi 5 Plus (RK3588) |
|------|-----------------------|-------------------------|---------------------|----------------------------|
| AI 算力 | 10 TOPS (BPU) | Nano: 472 GFLOPS / Orin Nano: 67 TOPS (Sparse) | Hailo-8L: 13 TOPS / Hailo-8: 26 TOPS | 6 TOPS (NPU RK3588) |
| CPU | 8x A55 @1.5GHz | A57×4 / A78AE×6 | BCM2712 A76×4 @2.4GHz | A76×4 + A55×4 |
| 模型后端 | `.bin` (Bayes) | TensorRT / ONNX | Hailo `.hef` / IMX500 `.rpk` | RKNN `.rknn` |
| 工具链成熟度 | 中（Horizon OE 稳定，文档中文齐全）| **高**（TensorRT 生态最成熟，英文文档首选）| 中（Hailo Model Zoo 英文为主）| 中（rknn-toolkit2 开源，但版本跳跃频繁）|
| ROS2 原生支持 | **预装 TROS (Humble)** | 手动装 ROS2 | 手动装 ROS2 | 手动装 ROS2 |
| 中文社区 / 文档 | **强**（D-Robotics论坛 + CSDN 博客多）| 中（NVIDIA 官方中文翻译 + 博客）| 中 | 弱（Orange Pi 文档较少） |
| 典型踩坑 | 默认 YUYV 相机、v2.0 tag 卡版本 | Jetpack 版本绑定、Docker ARM 镜像 | 模型+标签没配套、H8/H10 HEF 不通 | 内核 5.10 锁死、vendor fork、librknnrt 版本 |
| 采购口径 | 以官方渠道实时价格为准 | 以 NVIDIA 官方/渠道实时价格为准 | 以 Raspberry Pi 与 Hailo/IMX500 渠道实时价格为准 | 以厂商/渠道实时价格为准 |
| 选它的理由 | **中文开发者 + ROS2 机器人 + 性价比** | 大 LLM / CUDA 生态迁移 / 全英文工作流 | 想要"完整 Pi 生态 + 加 AI 做课题" | 纯算力堆 + 极客折腾 / 走 Android 生态 |
| 不适合 | 纯 CUDA 代码迁移 / PyTorch 直跑 | 中文学生 + 预算紧 | ROS2 密集项目（生态弱）| 想要开箱即用 |

**回答框架**（Moss 给用户做对比时）：
1. **不要简单说"RDK 更好"**，先问用户**用途 + 预算 + 英文/中文文档偏好**
2. **承认短板**：RDK 在**纯 CUDA 迁移** / **大 LLM 本地跑** / **英文资料深度**上不如 Jetson
3. **突出强项**：RDK 在**中文生态 + TROS 预装 + 接口丰富（40pin + CAN + MIPI）+ 性价比**上很有竞争力
4. **承认类比**：RDK X5 ≈ 中文文档/ROS2 机器人场景下的 **"Jetson 入门替代"** 或 **"Raspberry Pi 5 + AI HAT+ 的一体化版本"**；S100 ≈ 类 Orin NX 的**国产具身智能平台**

### 22. LLM / VLM 在 RDK 上的期待校准（避免过度承诺）

> 2025-2026 "DeepSeek / Ollama 热"之后，大量用户直接问"RDK X5 能跑 DeepSeek 吗"。真实答案需要**校准期待**，不能一句"能跑"忽悠用户。

**分档现实**：

| 板型 | 能跑什么级别的模型 | 实际体验 | 推荐使用方式 |
|------|---------------------|----------|--------------|
| **X3** | ❌ LLM 基本不可用 | 2GB 内存就放不下 | 放弃在板上跑，用云 API 即可 |
| **X5 (4GB)** | ≤1B 量化（Qwen2-0.5B / TinyLlama）| token/s 个位数，只能当"玩具" | 体验 / 教学用，别上生产 |
| **X5 (8GB)** | ≤2B 量化（Qwen2-1.5B / Phi-3-mini-4bit）| 5-15 token/s 量级 | 离线对话、语音小助手（配 hobot_tts/audio）|
| **S100 (12GB)** | 7B 量化（DeepSeek-R1-Distill-7B / Qwen2.5-7B-Int4）| 可用对话速度 | 端侧大模型真正起点 |
| **S100P (24GB)** | 更大参数量量化 LLM、VLM（以官方 Model Zoo / hobot_llm 清单为准）| 本地可用 | 严肃科研 / 产品原型 |

**RDK 上跑 LLM 的三条路线**（社区里真有人用过，给用户讲清差别）：

| 路线 | 适合 | 优缺点 |
|------|------|--------|
| `tros-humble-hobot-llm` | 最省心，官方 ROS2 节点 | ✅ 预装 / 直接 `apt install`；❌ 模型选择受限 |
| `tros-humble-hobot-llamacpp` | llama.cpp 封装，支持更多 GGUF | ✅ 模型生态大；❌ 要自己调参 |
| **原生 Ollama / llama.cpp**（用户自己装）| 追新模型（DeepSeek R1 等） | ✅ 跑 GGUF 什么都能试；❌ **不走 BPU**，只走 CPU，速度慢很多 |

**遇到"X5 跑 DeepSeek" 类问题的应对**（结合社区博客 "只能当玩具测试着玩，不太能解决大问题"）：
1. 先问**哪个 DeepSeek**（1.5B / 7B / 14B+ 差别巨大）
2. 跑 1.5B 量化在 X5 8GB 上**能跑但慢**，可以演示；7B 以上建议 S100
3. 明确告诉用户：**X5 上的 Ollama/llama.cpp 不走 BPU，BPU 算力没用上**，要用 BPU 要走 `hobot_llm` 或 `hobot_llamacpp` 的 ROS2 节点
4. 如果用户只是想要"AI 对话"功能，**推荐走云 API（OpenAI 兼容）** + 板上做感知层；端侧只做**轻量 TTS/STT + 关键词唤醒**更实用

**VLM（视觉语言）现实**：X5 基本跑不动 VLM（需要同时装模型 + 视觉编码器，内存不够）；**S100 起步才有 VLM 实用价值**，官方 NodeHub 里的 VLM demo 几乎都基于 S100。

### 23. 40PIN 跨平台引脚与接口深度对照（外设驱动第一步）

> 用户问"怎么接 XX"时，先问清**板型**再回答；各板 40PIN 物理位置虽然一致，但电源能力 / GPIO 编号 / I2C 总线号 / PWM 路径**全都不一样**。

**40PIN 物理布局四家一致**（抄自 RPi 3B+）：`Pin 1 = 3.3V`，`Pin 2/4 = 5V`，`Pin 6/9/14/20/25/30/34/39 = GND`。物理**没差异**，差异在电气与编号。

**电源承载能力对照（驱舵机/灯带必看）**：

| 平台 | 40PIN 5V 上限 | 舵机/灯带取电建议 |
|------|----------------|------------------|
| RPi 5 | ~600mA 共享 | **必须外接 5V 电源**，共 GND 回板 |
| Jetson Orin Nano | ~1A | 单舵机勉强可，多舵机必外接 |
| RK3588（Orange Pi 5）| ~800mA | 同 Jetson |
| **RDK X5 / S100** | X5 官方 40PIN 标注为 1A @ 3.3V / 1A @ 5V；S100 需按扩展板电源预算核对 | **舵机/电机/灯带一律外接 5V/6V 电源，共 GND** |

> Moss 看到 "从 Pin 2 取 5V 驱动一个 SG90 舵机" → 可接；"驱动 4 个舵机 / WS2812 灯带 30 颗以上" → **必须警告外接电源**，否则掉电重启。

**GPIO 编号方案对照（同一物理 Pin 11，名字四家不一样）**：

| 平台 | 编号方案 | Pin 11 叫什么 | 用户态主 API |
|------|---------|---------------|--------------|
| RPi | BCM | `GPIO17` | `RPi.GPIO` / `gpiozero` / **`libgpiod`** |
| Jetson Orin Nano | tegra-gpio | `PQ.05`（chip0 line 144） | `Jetson.GPIO` / **`libgpiod`** |
| RK3588 | `GPIOx_yZ`（bank_group_pin） | `GPIO3_C6`（= 3×32 + 2×8 + 6 = 118） | `OPi.GPIO` / **`libgpiod`** |
| **RDK X3** | Hobot 自定义编号 | 查 X3 pinout 表 | `Hobot.GPIO` / `libwiringpi` / **`libgpiod`** |
| **RDK X5** | Hobot 自定义编号 | 查 X5 pinout 表 | `Hobot.GPIO` / `x5-hobot-io` / **`libgpiod`** |

> **唯一跨四家通用的底层 API = `libgpiod`**（见下一节）；Moss 写跨板脚本**优先推 libgpiod**，不要去猜 BCM 号。

**I2C 总线号对照（做传感器 / PCA9685 必查）**：

| 平台 | 40PIN 对外可用 I2C | 设备节点 | 激活方式 |
|------|-------------------|----------|----------|
| RPi | I2C1（Pin3/5） | `/dev/i2c-1` | `raspi-config` → Interface → I2C |
| Jetson Orin Nano | I2C1（Pin3/5）、I2C8（Pin27/28） | `/dev/i2c-7`（Orin 实际编号）| 默认开 |
| RK3588 | I2C3/7/8 对外 | `/dev/i2c-3` 等 | 需 `overlay` 使能 |
| **RDK X3** | 2 路 | `/dev/i2c-0`, `/dev/i2c-1` | 引脚复用，用 `/app/40pin_samples/config_40pin_pinmux.py` 切 |
| **RDK X5** | 3 路 | `/dev/i2c-0/1/2` | 同上 |
| **RDK S100** | 4 路 | `/dev/i2c-0..3` | 同上 |

> **RDK 特有坑**：同一 40PIN 位置的引脚可能被默认配成 GPIO，需先用 Hobot pinmux 脚本切到 I2C 模式，`/dev/i2c-X` 才会出现。排查顺序：`ls /dev/i2c-*` → 不见想要的总线 → 跑 pinmux 脚本 → 再看。

**PWM 路数与 `pwmchip` 路径对照（舵机 / 电机调速命门）**：

| 平台 | 硬件 PWM 路数 | 控制路径 | 激活动作 |
|------|--------------|----------|----------|
| RPi | 2（PWM0 / PWM1） | `/sys/class/pwm/pwmchip0/pwm{0,1}/` | `dtoverlay=pwm-2chan` |
| Jetson Orin Nano | 3 | `/sys/class/pwm/pwmchip*/` | **必须先 `sudo /opt/nvidia/jetson-io/jetson-io.py`** 改 Pinmux |
| RK3588 | 多路（PWM14/15 常用） | `/sys/class/pwm/pwmchipN/` | 需 overlay |
| **RDK X3** | 2 | `/sys/class/pwm/pwmchipN/pwmM/` | 切 Pinmux |
| **RDK X5** | **8（四家里最多）** | 同上 | 切 Pinmux |
| **RDK S100** | 8 + MCU 侧实时 PWM | MCU 侧走固件 | MCU 侧需烧固件，非 Linux 程序 |

> **多舵机（≥3 路）结论**：**四家都推 PCA9685 + I2C**，理由是省板子 PWM / 跨板可移植 / Python 库成熟（见第 25 节）。

**UART / 串口对照**：

| 平台 | 40PIN 对外 UART | 节点 | 坑 |
|------|-----------------|------|----|
| RPi | Pin 8/10 | `/dev/ttyS0`（mini UART）/ `/dev/ttyAMA0` | 要 `dtoverlay=disable-bt` 让主 UART 出来 |
| Jetson Orin Nano | Pin 8/10 | `/dev/ttyTHS1` | 默认 root 占用，要 `systemctl disable nvgetty` |
| RK3588 | Pin 8/10 | `/dev/ttyS0/3` | 需 overlay |
| **RDK X5** | 5 路 | `/dev/ttyS0..4` 或 `/dev/ttyHS*` | **`ttyS` 普通串口 / `ttyHS` 高速串口**，接线时需确认 |
| **RDK S100** | 6 路 + **独立 MCU Domain UART 调试口** | 同上 | Main / MCU 两个调试口**别弄混**（见第 17 节）|

> **万能兜底**：USB 转 TTL（`/dev/ttyUSB0`）跨所有平台**一样用**；Dynamixel / Feetech 总线舵机、GPS、LoRa 模块几乎都直接 USB 接入，不用纠结板载 UART。

**SPI / CAN / 音频 / CSI 要点**：

| 能力 | 说明 |
|------|------|
| SPI | RDK X3 仅 1 路 / X5 两路；路径 `/dev/spidev0.0`；**WS2812 灯带靠 SPI MOSI 模拟时序**（见第 27 节）|
| **CAN**（RDK 强项）| RPi 无板载（需 MCP2515 HAT）；**X5 / S100 直接板载 CAN FD**，用 `ip link set can0 type can bitrate 500000` 起来 |
| 音频 | **Jetson 无板载音频**（这是 Jetson 名梗）；RPi 4 有 3.5mm，RPi 5 砍掉；RDK 多数型号通过 40PIN I2S 接 HAT 或走 USB 声卡（见第 28 节） |
| CSI 相机 | RPi / Jetson 走 22Pin 排线；RDK X5 4-lane、X3 仅 2-lane；**S100 独占 GMSL2 车规相机**，需扩展板 |

### 24. libgpiod：跨平台通用 GPIO 统一 API（强烈推荐）

> 四家板子（RPi / Jetson / RK / RDK）**都支持** `libgpiod`，这是 Linux 4.8+ 内核推荐的 GPIO 用户态 API，取代已废弃的 `/sys/class/gpio`。Moss 写跨板脚本或不确定编号时，**首选这套**。

**安装**（所有平台一致）：
```bash
sudo apt install gpiod python3-libgpiod   # 命令行工具 + Python 绑定
```

**4 个核心命令**：
```bash
gpiodetect                    # 列出所有 gpiochip（如 gpiochip0, gpiochip1...）
gpioinfo gpiochip0            # 看每条 line 的名字（有名字的可直接按名操作）
gpioset gpiochip0 17=1        # 置高（line 17）
gpioget gpiochip0 17          # 读电平
```

**用名字操作**（最优写法，跨板最稳）：
```bash
gpiofind "GPIO17"                          # 反查所在 chip 与 line
gpioset $(gpiofind "GPIO17")=1             # 置高，一行搞定
```

**Python 最小示例**（RPi / Jetson / RK / RDK 都能跑）：
```python
import gpiod, time
chip = gpiod.Chip('gpiochip0')
line = chip.get_line(17)
line.request(consumer='blink', type=gpiod.LINE_REQ_DIR_OUT)
for _ in range(10):
    line.set_value(1); time.sleep(0.5)
    line.set_value(0); time.sleep(0.5)
line.release()
```

**libgpiod vs 其他 API 选择矩阵**：

| 场景 | 推荐 |
|------|------|
| 要和树莓派现有教学代码兼容 | `Hobot.GPIO`（RDK）/ `Jetson.GPIO`（Jetson）——API 都抄 `RPi.GPIO` |
| 写一份脚本跑多个平台 | **`libgpiod`** |
| 实时 / 低延迟（< 1ms 抖动敏感）| C 直接调 `libgpiod` 或 `x5-hobot-io`（X5 专用，见第 12 节）|
| 简单闪灯 / 按键读取 | `gpioset` / `gpioget` 命令一行搞定 |

> **Moss 遇到"GPIO 不工作"类问题**：先 `gpiodetect` → `gpioinfo <chip>`，直接用**名字**定位，不要让用户翻 BCM 表；这是对四平台都通用的方法。

### 25. 舵机控制：单舵机到多路 PCA9685 标准方案

**单舵机（1–2 路）走板载硬件 PWM**：

舵机信号本质 = **50Hz（周期 20ms）+ 1.0ms(0°) ~ 2.0ms(180°) 正脉宽**（SG90 等标准）。RDK / RPi / Jetson / RK 通用 sysfs 控制代码（先切 Pinmux，得到 `/sys/class/pwm/pwmchipN/`）：

```bash
cd /sys/class/pwm/pwmchip0              # 板型不同 N 不同，用 ls 确认
echo 0 > export
echo 20000000 > pwm0/period             # 20ms = 50Hz
echo 1500000  > pwm0/duty_cycle         # 1.5ms = 90°（中位）
echo 1        > pwm0/enable
```

角度 → duty_cycle 公式（ns 单位）：
```
duty_cycle = 1_000_000 + (angle / 180) * 1_000_000   # 1ms ~ 2ms
```

> **安全铁律**：舵机**绝不能从 40PIN Pin 2/4 取 5V 供电**，哪怕只有 1 个 SG90 —— 瞬时堵转电流可达 1A，会拉低板子 5V 导致重启。**始终用外部 5V/6V 电源，信号线和板子共 GND**。

**多舵机（≥3 路）一律用 PCA9685 + I2C**（四平台事实标准）：

| 参数 | 值 |
|------|----|
| 硬件 | PCA9685 16 通道 PWM 扩展板（常见低成本模块，通常内置 5V LDO） |
| 接线 | I2C SDA/SCL/VCC/GND + 独立电源 V+ 给舵机 |
| I2C 默认地址 | **`0x40`**（A0–A5 可跳线改地址，多片级联最多 62 个） |
| 频率 | `set_pwm_freq(50)` 标准舵机；LED 调光用 1000 |
| 分辨率 | 12 位（0–4095） |

**Python 最小脚本**（RDK / RPi / Jetson / RK 同一份代码，只改总线号）：

```bash
sudo apt install python3-smbus2
pip3 install adafruit-circuitpython-servokit   # 或裸 Adafruit_PCA9685
```

```python
import board, busio
from adafruit_pca9685 import PCA9685
from adafruit_motor import servo

i2c = busio.I2C(board.SCL, board.SDA)          # 默认 i2c-1；RDK X5 按实际总线号换
pca = PCA9685(i2c); pca.frequency = 50
ch0 = servo.Servo(pca.channels[0], min_pulse=500, max_pulse=2500)
ch0.angle = 90                                  # 90 度
```

**PCA9685 排障三步**：
1. `i2cdetect -y <bus>` → 确认 `0x40` 出现；不出现 = 接线 / I2C 总线未使能
2. 舵机抖动严重 = 供电不够（PCA9685 的 V+ 只带信号电平不带功率，**舵机电源必须走 PCA9685 的 V+ 螺丝端子，不从 40PIN 取**）
3. 多舵机同时动卡顿 = 外部电源 5V/3A 不够，升到 5V/5A 或用航模 BEC

**总线舵机另一条路**（Dynamixel / Feetech STS / LX-16A）：
- 走 **TTL 串口或 RS-485**，`/dev/ttyUSB0`（USB 转 TTL 最稳）
- Python：`dynamixel-sdk` / `feetech-servo-sdk`
- 优势：**一条线接几十个舵机**，每个有 ID，可读当前角度/电流/温度
- 劣势：相对更贵，采购成本需按实时渠道确认
- **RDK 场景**：双足/四足 / 机械臂用这种，SG90 等 PWM 舵机只适合玩具级

### 26. 电机驱动三大范式

遇到"电机怎么转"时，**先问是哪种电机 + 用什么驱动器**，再落到板级：

**范式 1：直流电机（DC） = H 桥驱动器 + PWM 调速 + GPIO 控方向**

| 驱动器 | 适用 | 接线摘要 |
|--------|------|----------|
| **TB6612FNG** | 小车两轮，单路 ~1.2A | PWMA/PWMB 给 PWM，AIN1/AIN2/BIN1/BIN2 给方向（4 个 GPIO），STBY 置高 |
| **DRV8833** | 更小电流（~1.5A 峰值）| 类似 TB6612 |
| **BTS7960** | 大电流（43A）| R_EN/L_EN + RPWM/LPWM |

最小跑车代码（伪码，跨平台适用）：
```python
# 一个轮子：GPIO17/18 定方向 + pwmchip0/pwm0 给速度
gpio.set(17, 1); gpio.set(18, 0)    # 正转
set_pwm_duty("pwmchip0/pwm0", 50)   # 50% 占空比
```

**范式 2：步进电机 = 专用驱动器 + STEP/DIR 两根线**

| 驱动器 | 特点 |
|--------|------|
| A4988 | 最便宜，1.5A，噪声大 |
| DRV8825 | 2.2A，32 细分 |
| **TMC2209** | 静音（重要！），UART 可配参数，3D 打印机主流 |

接线仅需 2 个 GPIO（STEP + DIR）+ 3.3V EN，**不需要 PWM**（STEP 用软件打脉冲即可）：

```python
for _ in range(200):                  # 200 步 = 一圈（1.8°/步步进电机）
    gpio.set(STEP, 1); time.sleep(0.001)
    gpio.set(STEP, 0); time.sleep(0.001)
```

**范式 3：无刷（BLDC）= ESC 或智能驱动器**

| 方式 | 说明 |
|------|------|
| 航模 ESC | 跟舵机一样 50Hz PWM（1.0ms 停 ~ 2.0ms 全速），可直接复用 PCA9685 |
| **ODrive / VESC** | 带编码器闭环、通过 UART/USB/CAN 下发命令，Python 有 `odrive` / `pyvesc` 库 |
| D-Robotics S100 特殊路径 | MCU (R52+) 直接驱动，走 IPC；kHz 级回路，比 Linux RT 线程稳（见第 17 节）|

> **Moss 对"机器人关节电机"类问题**：
> - 玩具 / 教学 → 直流 + TB6612 或 PWM 舵机
> - 桌面机械臂 / 四足 → **总线舵机（Feetech STS3215 / Dynamixel XL）**
> - 双足 / 工业关节 → BLDC + ODrive/VESC 或厂商一体化关节模组
> - 这不是 RDK 特殊性的问题，是**电机类别决定的行业标准**。

### 27. LED：从单色到 WS2812 灯带

**分三种，做法完全不同**：

| 类型 | 接法 | 控制方式 |
|------|------|----------|
| 单色 LED | 330Ω 限流电阻 + GPIO | GPIO 高低电平，`gpioset`；PWM 调亮度同舵机章节 |
| **WS2812 / WS2815 RGB 灯带** | 5V + GND + DIN | **严格 800kHz 时序**，GPIO bitbang 不稳，**走 SPI MOSI 模拟** |
| I2C LED 矩阵（HT16K33 / MAX7219）| I2C 4 线 | `luma.led_matrix` 跨平台 Python 库 |

**WS2812 跨平台通用方案 —— SPI 模拟时序**（RDK / RPi / Jetson / RK 都用这招）：

核心技巧：**用 4 个 SPI bit 编码 1 个 WS2812 bit**
- WS2812 的 "1" = 高电平 ~0.8µs + 低电平 ~0.45µs → SPI 输出 `1110`
- WS2812 的 "0" = 高电平 ~0.4µs + 低电平 ~0.85µs → SPI 输出 `1000`
- SPI 速率设 **2.4 MHz**（= 800kHz × 3；实验上 3.2MHz 也行）

跨平台 Python 包：
```bash
pip3 install Adafruit-CircuitPython-NeoPixel-SPI
```

```python
import board, neopixel_spi
pixels = neopixel_spi.NeoPixel_SPI(board.SPI(), 30, pixel_order=neopixel_spi.GRB)
pixels[0] = (255, 0, 0)    # 第 0 颗红色
pixels.show()
```

> **供电坑**：30 颗 WS2812 满亮白光 ≈ 1.8A，**绝对不能从 40PIN Pin 2/4 取 5V**，必须外接 5V 电源 + 共 GND；数据线 DIN 从 40PIN 的 MOSI 引脚出来即可（信号电流很小）。

**RPi 原生 `rpi_ws281x` 方案**：需要 root + PWM0 引脚（物理 Pin 12 / GPIO18），**该方案只适用于 RPi**，RDK / Jetson / RK **不适用**，一律走 SPI 模拟法。

### 28. 音频：ALSA 兜底链路（没装 TROS 时怎么播音 / 录音）

> RDK 的 `hobot_audio` 只有装了 TROS 且插了官方麦克风阵列板时才可用。**当这些条件不具备**时，Moss 应该走标准 Linux ALSA 链路——这在 RPi / Jetson / RK / RDK 上**完全通用**。

**音频硬件在不在 —— 3 步通用探测**：

```bash
# 1. 看声卡列表（输出设备 / 输入设备）
aplay -l       # 列出所有输出设备：card X, device Y
arecord -l     # 列出所有输入设备
# 2. 一个都没有 = 内核根本没识别到
lsusb          # 看 USB 声卡 / USB 麦克风有没有
dmesg | grep -i "audio\|sound\|snd"
# 3. 有声卡但播不响 = 音量被静音 / 选错 channel
alsamixer      # 图形化调音量，按 M 解静音（MM 标红 = 静音）
```

**播放 WAV / MP3**：

```bash
aplay test.wav                              # 播 WAV，用默认声卡
aplay -D plughw:1,0 test.wav                # 指定 card 1 device 0
aplay -D plughw:CARD=UAC1,DEV=0 test.wav    # 按 USB 声卡名字指定

# MP3 / Opus 要先解码
sudo apt install mpg123 sox
mpg123 song.mp3
sox song.mp3 -d                             # 自动播放任意格式
```

**录音**：

```bash
arecord -D plughw:1,0 -f S16_LE -r 16000 -c 1 -d 5 test.wav   # 5 秒 16kHz 单声道
# 验证麦克风工作（实时看电平）
arecord -vv -f S16_LE -r 16000 -c 1 /dev/null
```

**PulseAudio / PipeWire 场景**：
```bash
pactl list short sinks                      # 列出播放设备
pactl list short sources                    # 列出录音设备
paplay test.wav                             # 通过 PulseAudio 播放
parecord -d 5 test.wav                      # 录音
```

**USB 声卡 = 万能兜底**：不管哪块板，插 **USB 声卡（带 3.5mm）或 USB 麦克风**，内核自动加载 `snd-usb-audio`，`aplay -l` 立刻可见。**Jetson 无板载音频，这是唯一推荐路径**；RDK 没有 I2S HAT 时也推这条。

**典型错误 → 判断**：

| 报错 / 现象 | 判断 |
|-------------|------|
| `aplay -l` 返回 "no soundcards found" | 硬件未识别，先看 USB 声卡是否插好 / I2S 是否 overlay |
| `ALSA lib pcm.c ... unable to open slave` | 设备被占用，`sudo fuser /dev/snd/*` 看是谁，或 `systemctl stop pulseaudio` 临时释放 |
| 播放有声但极小 / 失真 | `alsamixer` 加音量；或 `amixer sset Master 80%` |
| 麦克风录音全是噪声 | `arecord -l` 确认选对设备，避开板载底噪；USB 麦克风质量更稳 |
| `aplay: Dac failed: Device or resource busy` | 其他进程（PulseAudio / TROS）持有 → `pactl suspend-sink 0` 或切用 PulseAudio API |

### 29. 零驱动诊断 SOP（9 步通用外设探测流程）

> 用户说 "我插了个 XXX 但不知道怎么用 / 板子不识别 / 没驱动"——**不要猜，按下面 9 步走**。这套流程在 RDK / RPi / Jetson / RK 上 **100% 通用**，不依赖厂商工具。

```
┌─ Step 1. dmesg | tail -50                  内核最近识别了什么（插拔时看这里）
├─ Step 2. lsusb                              USB 设备枚举（USB 声卡/麦/摄像头/转 TTL）
├─ Step 3. ls /dev/                           设备节点全览：
│          /dev/tty*       串口类（ttyUSB0 / ttyACM0 / ttyS* / ttyHS*）
│          /dev/video*     V4L2 摄像头
│          /dev/i2c-*      I2C 总线
│          /dev/spidev*    SPI
│          /dev/snd/       音频（card0 / pcmC0D0p 等）
│          /dev/input/     输入（按键 / 游戏手柄）
├─ Step 4. i2cdetect -l 列所有 I2C 总线，再 i2cdetect -y <bus> 扫地址
├─ Step 5. v4l2-ctl --list-devices            摄像头
├─ Step 6. aplay -l / arecord -l              音频
├─ Step 7. lsmod | grep <keyword>             内核模块是否加载
├─ Step 8. modinfo <mod> / modprobe <mod>     查模块信息 / 手动加载
└─ Step 9. cat /proc/device-tree/…            设备树节点（RPi/RK/RDK 都有）
```

**按"症状 → 诊断"对表**：

| 症状 | 优先查 | 常见原因 |
|------|-------|----------|
| 设备插上板子不识别 | Step 1 (dmesg) + Step 2 (lsusb) | 供电不够 / USB 口坏 / USB 3.0 兼容性 |
| "No such device" 打开 /dev/i2c-X | Step 3 + Step 4 | I2C 总线未使能 / Pinmux 未切（RDK 特有）|
| `permission denied: /dev/ttyUSB0` | `ls -l /dev/ttyUSB0` | 用户没在 `dialout` 组 → `sudo usermod -aG dialout $USER` |
| `ALSA lib ... unable to open slave` | Step 6 + `fuser` | 设备被其他进程占用 |
| PWM 没反应 | `ls /sys/class/pwm/` | Pinmux 未切 / 板子 PWM 路数超了 |
| Python 导入 `Hobot.GPIO` 报错 | `which python3` | 用了 conda/venv，`Hobot.GPIO` 只认系统 Python |

**修复的三条正交路径**（按风险从低到高）：

1. **用户态装包**（最安全）：`apt install` / `pip install` / `git clone + colcon build`
2. **临时加载内核模块**（中等）：`modprobe <mod>` / `insmod ./xxx.ko` / `rmmod <mod>`，只做当前会话验证，随后看 `dmesg`
3. **持久化内核/启动链**（最高风险，破坏性）：`/etc/modules-load.d/*.conf` 开机加载、`/boot` 设备树、`/lib/modules` 安装、initramfs / miniboot / bootloader / MCU 固件——**RDK 上不到万不得已不建议用户碰**，保留给官方流程和人工恢复方案

**Moss 的应答模板**（遇到外设问题时）：
1. 先问清 **板型 + 接口（USB / 40PIN I2C / 40PIN UART / MIPI）+ 设备型号**
2. 跑 Step 1–3 的三条命令，让用户贴回输出
3. 根据输出走"症状 → 诊断"表，定位到具体一条
4. 给出**最小可验证命令**（`i2cdetect -y 1` 看到 0x40 / `aplay -l` 看到 card 1 / `gpioinfo gpiochip0`）
5. 成功验证后再谈"写成 ROS2 节点 / 封装 Python 脚本 / 开机自启"
