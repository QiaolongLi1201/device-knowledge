/**
 * RDK Failure Hints — error pattern → recovery suggestion mappings.
 *
 * When the Agent sees a command output matching `errorPattern`,
 * the corresponding `suggestion` is surfaced to guide recovery.
 */

interface FailureHint {
  errorPattern: RegExp;
  suggestion: string;
  docUrl?: string;
}

const DOC_BASE = 'https://developer.d-robotics.cc/rdk_doc';

export const RDK_FAILURE_HINTS: FailureHint[] = [
  // ── Camera / Vision ──────────────────────────────────────────────
  {
    errorPattern: /terminate called after throwing|exit code -6|SIGABRT/i,
    suggestion: '摄像头节点崩溃 — 用 `v4l2-ctl -d /dev/video0 --list-formats-ext` 确认格式；USB 摄像头需设为 MJPEG（非默认 YUYV），分辨率用 640x480 先验证',
    docUrl: `${DOC_BASE}/Basic_Application/vision/usb_camera`,
  },
  {
    errorPattern: /did not receive image data|No image data|timeout.*image/i,
    suggestion: '无图像数据 — 确认 pixel_format=MJPEG、分辨率与 v4l2 能力一致、/dev/videoN 正确；换 /dev/video1 试试',
    docUrl: `${DOC_BASE}/Basic_Application/vision/usb_camera`,
  },
  {
    errorPattern: /VIDIOC_S_FMT.*Invalid argument|VIDIOC_REQBUFS.*Invalid/i,
    suggestion: '摄像头格式不支持 — `v4l2-ctl --list-formats-ext` 查支持列表，宽高/fps 必须精确匹配列表中的一档',
  },
  {
    errorPattern: /select timeout|camera.*timeout|v4l2.*timeout/i,
    suggestion: '摄像头超时 — 可能 USB 带宽不足或驱动冲突；尝试降低分辨率/帧率，或拔插 USB 重试',
  },

  // ── Model / BPU ──────────────────────────────────────────────────
  {
    errorPattern: /No such file.*\.(hbm|bin)|model.*not found|cannot open.*model/i,
    suggestion: '模型文件未找到 — `find /opt/tros -name "*.hbm" -o -name "*.bin"` 定位真实路径，不要依赖相对路径',
  },
  {
    errorPattern: /out of memory|OOM|Cannot allocate memory|MemoryError|std::bad_alloc/i,
    suggestion: 'BPU/RAM OOM — `cat /sys/devices/system/bpu/bpu0/ratio && free -h` 查占用（X5 也可用 `hrut_bpuprofile -b 0`）；减小 batch_size、用更小模型、或 kill 占用 BPU 的进程',
  },
  {
    errorPattern: /hbm.*version.*mismatch|model.*incompatible|invalid model|model format error/i,
    suggestion: '模型格式不兼容 — X3=Bernoulli2, X5/Ultra=Bayes, S100=Nash，hbm/bin 跨架构不通用，需用对应工具链重新编译',
  },
  {
    errorPattern: /hb_mapper.*failed|convert.*error|calibration.*fail|compile.*failed/i,
    suggestion: '模型转换失败 — 检查 ONNX opset 版本、不支持的算子、校准数据格式；用 `hb_mapper checker` 先验证 ONNX',
    docUrl: `${DOC_BASE}/Advanced_development/toolchain_development/overview`,
  },
  {
    errorPattern: /unsupported op|not support.*operator|op.*not implemented/i,
    suggestion: '算子不支持 — 查官方算子列表；Transformer/Attention 算子仅 S100 (Nash) 部分支持，X3/X5 需替换为等效 CNN 结构',
    docUrl: `${DOC_BASE}/Advanced_development/toolchain_development/expert/api_reference`,
  },

  // ── TROS / ROS2 ─────────────────────────────────────────────────
  {
    errorPattern: /source.*setup\.bash.*No such file|\/opt\/tros.*not found/i,
    suggestion: 'TROS 未安装或路径错误 — `ls /opt/tros/humble/setup.bash` 确认；S100 部分镜像需 `su - sunrise` 后再 source',
  },
  {
    errorPattern: /Package.*not found|package.*does not exist|not a ros2 package/i,
    suggestion: 'ROS2 包未找到 — `ros2 pkg list | grep <name>` 确认；可能需 `apt install ros-humble-<pkg>` 或从源码 colcon build',
  },
  {
    errorPattern: /no executable found|No such file or directory.*ros2|ros2:.*command not found/i,
    suggestion: 'ROS2/TROS 不在 PATH — `source /opt/tros/humble/setup.bash`；S100 试 `su - sunrise`（部分镜像仅该用户配了 TROS）',
  },
  {
    errorPattern: /topic.*not available|waiting for.*publisher|no publishers/i,
    suggestion: '话题无发布者 — `ros2 node list` + `ros2 topic list` 确认上游节点是否运行；检查 QoS 是否匹配',
  },
  {
    errorPattern: /Failed to load entry point|plugin.*not found|pluginlib/i,
    suggestion: 'ROS2 插件加载失败 — 确认包已安装且 setup.bash 已 source；`colcon build` 后需 `source install/setup.bash`',
  },
  {
    errorPattern: /DDS.*error|rmw.*error|RTPS/i,
    suggestion: 'DDS 通信错误 — 检查网络配置；多机通信需 `ROS_DOMAIN_ID` 一致，防火墙放行 UDP 7400-7500+',
  },

  // ── Permissions / Access ─────────────────────────────────────────
  {
    errorPattern: /Permission denied|Operation not permitted|EACCES/i,
    suggestion: '权限不足 — GPIO/I2C/SPI 需 root 或 sudo；`/dev/video*` 权限问题尝试 `chmod 666`',
  },
  {
    errorPattern: /Device or resource busy|EBUSY/i,
    suggestion: '设备被占用 — `lsof /dev/<device>` 或 `fuser -v /dev/<device>` 找到占用进程并 kill',
  },
  {
    errorPattern: /Read-only file system|EROFS/i,
    suggestion: '只读文件系统 — `/app` 等目录可能只读；写入 `/tmp`、`/userdata`、`$HOME` 等可写路径',
  },

  // ── Network ──────────────────────────────────────────────────────
  {
    errorPattern: /Connection refused|Network is unreachable|Could not resolve host|ENETUNREACH/i,
    suggestion: '网络不通 — `ip addr` 看 IP、`ping 8.8.8.8` 测外网、`ping <gateway>` 测网关；可能需配 WiFi/有线',
  },
  {
    errorPattern: /Connection timed out|ssh.*timeout|ETIMEDOUT/i,
    suggestion: 'SSH/连接超时 — 确认设备 IP、检查防火墙、确保设备已上电且网线/WiFi 已连',
  },
  {
    errorPattern: /Host key verification failed|REMOTE HOST IDENTIFICATION/i,
    suggestion: 'SSH 主机密钥变更 — 设备重刷系统后密钥会变；`ssh-keygen -R <ip>` 清除旧密钥后重连',
  },

  // ── Storage ──────────────────────────────────────────────────────
  {
    errorPattern: /No space left on device|ENOSPC/i,
    suggestion: '磁盘已满 — `df -h` 查各分区；清理 `/tmp`、apt 缓存（`apt clean`）、旧日志；SD 卡可 `resize2fs` 扩展',
  },

  // ── Python ───────────────────────────────────────────────────────
  {
    errorPattern: /ModuleNotFoundError|ImportError.*No module named/i,
    suggestion: 'Python 模块缺失 — `pip3 install <module>`；板端无网络时需离线安装 whl（注意匹配 Python 版本和 aarch64 架构）',
  },
  {
    errorPattern: /hobot_dnn.*import|hobot_vio.*import|from hobot/i,
    suggestion: 'hobot Python SDK 导入失败 — 确认使用系统 Python（不是 conda/venv），且 `/usr/lib/python3/dist-packages/hobot*` 存在',
  },

  // ── Docker ───────────────────────────────────────────────────────
  {
    errorPattern: /docker.*not found|Cannot connect to the Docker daemon/i,
    suggestion: 'Docker 未安装或未启动 — `systemctl start docker`；板端安装: `apt install docker.io`',
  },
  {
    errorPattern: /exec format error|standard_init_linux|Exec format error/i,
    suggestion: '容器架构不匹配 — RDK 是 aarch64，需拉取 arm64 镜像，不能用 x86 镜像',
  },

  // ── Sensors / Stereo / LiDAR ────────────────────────────────────
  {
    errorPattern: /stereo.*calibration|calib.*not found|no calibration file/i,
    suggestion: 'StereoNet 缺标定文件 — 先按 hobot_stereonet 仓库 README 完成双目内/外参标定，把 yaml 放到 launch 指定目录',
    docUrl: 'https://github.com/D-Robotics/hobot_stereonet',
  },
  {
    errorPattern: /livox.*not.*connect|lidar.*offline|pcap.*not exist|MID-?360|HAP/i,
    suggestion: 'Livox 雷达连接失败 — 用 `ip addr` 确认网卡 IP 与雷达 IP 同网段（默认 192.168.1.1xx），检查防火墙放行 UDP 56000-56010；Mid-360 出厂 IP 与 HAP 不同',
    docUrl: 'https://github.com/D-Robotics/livox_ros_driver2',
  },

  // ── Audio / ALSA ─────────────────────────────────────────────────
  {
    errorPattern: /ALSA lib.*unable to open slave|snd_pcm_open.*failed|cannot open audio device/i,
    suggestion: '音频设备打开失败 — 先 `aplay -l` 确认有声卡；被占用用 `fuser -v /dev/snd/*` 找占用；如 PulseAudio 占着 `pactl suspend-sink 0` 或 `systemctl stop pulseaudio` 临时释放',
  },
  {
    errorPattern: /no soundcards found|Device or resource busy.*snd|no such audio device/i,
    suggestion: '无声卡识别 — `lsusb` 看 USB 声卡/麦在不在，`dmesg | grep -i "audio\\|snd"` 看加载情况；RDK 板多数型号无板载 3.5mm，**最稳方案是插 USB 声卡**，内核自动加载 snd-usb-audio',
  },
  {
    errorPattern: /aplay:.*Dac failed|audio underrun|xrun|buffer underrun/i,
    suggestion: '音频 xrun/underrun — CPU 占用高或 PulseAudio 抢占；用 `aplay -D plughw:<card>,<dev>` 直连 ALSA 避开 PA；或降采样率（16kHz 够语音用）',
  },
  {
    errorPattern: /arecord:.*main.*Invalid argument|arecord.*Channels count non available/i,
    suggestion: 'arecord 参数错 — `arecord -l` 确认设备，`arecord -D plughw:<card>,<dev> --dump-hw-params` 看支持的采样率/通道/格式；USB 麦常见 16000 Hz / 单声道 / S16_LE',
  },

  // ── I2C / PCA9685 ────────────────────────────────────────────────
  {
    errorPattern: /Could not open file.*\/dev\/i2c|No such file.*i2c-\d+|i2c.*not found/i,
    suggestion: 'I2C 总线节点不存在 — `ls /dev/i2c-*` 看有哪些；RDK 若缺目标总线，引脚可能被默认配成 GPIO，需要先用 `/app/40pin_samples/config_40pin_pinmux.py` 切到 I2C 模式',
  },
  {
    errorPattern: /i2cdetect.*could not set address|Remote I\/O error|I\/O error.*i2c|EREMOTEIO/i,
    suggestion: 'I2C 读写失败 — `i2cdetect -y <bus>` 先扫地址确认设备在；地址冲突时检查跳线；供电不足（PCA9685/OLED 无 V+ 独立电源）也会出现该错',
  },
  {
    errorPattern: /PCA9685.*not found|adafruit.*PCA9685.*ValueError|No I2C device at address 0x40/i,
    suggestion: 'PCA9685 未识别 — `i2cdetect -y <bus>` 应看到 `0x40`；看不到的常见原因：接线反、VCC 未接 3.3V/5V、I2C 总线号填错（Python 里 busio.I2C 默认 1，RDK 按实际总线改）',
  },

  // ── PWM / sysfs ──────────────────────────────────────────────────
  {
    errorPattern: /pwm.*export.*failed|pwmchip.*not found|No such file.*\/sys\/class\/pwm/i,
    suggestion: 'PWM 通道不可用 — `ls /sys/class/pwm/` 看有哪些 chip；RDK 上若缺目标 pwmchip，引脚未切到 PWM 复用 → 先跑 Pinmux 脚本；超过板子硬件 PWM 路数（X3=2, X5=8）时建议改 PCA9685',
  },
  {
    errorPattern: /Invalid argument.*duty_cycle|duty_cycle.*greater than period/i,
    suggestion: 'PWM duty_cycle 越界 — duty_cycle 必须 ≤ period；舵机 50Hz 场景：period=20000000（ns），duty_cycle 在 1000000~2000000 之间（1ms ~ 2ms）',
  },

  // ── GPIO / libgpiod / Hobot.GPIO ─────────────────────────────────
  {
    errorPattern: /gpiod\.LineBulk.*Busy|gpioset.*EBUSY|line.*already requested/i,
    suggestion: 'GPIO line 被占用 — 另一进程或前一次脚本没释放；`sudo lsof | grep gpio` 查；脚本里用 `with` 或 `try/finally + line.release()` 保证释放',
  },
  {
    errorPattern: /No such device or address.*gpio|gpiochip\d+.*not found/i,
    suggestion: 'gpiochip 不存在 — `gpiodetect` 看实际 chip 编号；RDK 各板 chip 编号不同，不要照抄 RPi 的 `gpiochip0`；优先用 `gpiofind "<line name>"` 自动定位',
  },
  {
    errorPattern: /import Hobot\.GPIO.*No module|ModuleNotFoundError.*Hobot/i,
    suggestion: 'Hobot.GPIO 只认系统 Python — `which python3` 确认不是 conda/venv；正确路径一般 `/usr/bin/python3`；若缺包 `sudo apt install python3-hobot-gpio`（或跨平台兜底用 `libgpiod`）',
  },

  // ── Serial / tty ─────────────────────────────────────────────────
  {
    errorPattern: /Permission denied.*\/dev\/tty(USB|ACM|S|HS)/i,
    suggestion: '串口权限不足 — 当前用户不在 `dialout` 组：`sudo usermod -aG dialout $USER` 然后**重新登录**（不是 `sudo su` 切换）；临时用 `sudo chmod 666 /dev/ttyUSB0`',
  },
  {
    errorPattern: /could not open port|SerialException.*could not open/i,
    suggestion: '串口打不开 — `ls /dev/tty{USB,ACM,S,HS}*` 确认存在；设备名没出现多半是 USB 转 TTL 芯片驱动没装（CP210x/CH340/FTDI），`dmesg | tail` 看最近插拔日志',
  },

  // ── Generic peripheral: "device not found" ──────────────────────
  {
    errorPattern: /No such device|ENODEV|Device not found/i,
    suggestion: '设备未识别 — 跑通用 9 步诊断：`dmesg | tail -50 && lsusb && ls /dev/tty* /dev/video* /dev/i2c-* /dev/snd/`；定位到具体接口（USB / I2C / UART / CSI）再针对性排查',
  },

  // ── Forum upload ─────────────────────────────────────────────────
  {
    errorPattern: /upload.*failed|HTTP\s+413|file.*too large|Payload Too Large/i,
    suggestion: '论坛上传失败 — 单文件上限约 12MB（实际看 Discourse 设置）；图片建议长边 1280px 内；超大日志改用 .zip 或粘到 gist 后给链接',
  },
  {
    errorPattern: /short_url.*missing|uploads\.json.*csrf|CSRF.*invalid/i,
    suggestion: '论坛上传 CSRF/会话失效 — 调用 `forum_drobotics_auth_status` 重新拉取 Cookie；若仍失败，让用户重新登录主账号或在对话提供凭据',
  },
];
