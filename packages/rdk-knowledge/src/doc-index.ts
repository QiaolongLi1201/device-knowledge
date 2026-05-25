/**
 * RDK Documentation Index — curated entries for search and prompt injection.
 *
 * URL convention:
 *   X3/X5/Ultra → DOC_BASE  = https://developer.d-robotics.cc/rdk_doc
 *   S100/S100P  → DOC_S100  = https://developer.d-robotics.cc/rdk_doc/rdk_s
 */

interface DocIndexEntry {
  title: string;
  url: string;
  section: string;
  tags: string[];
}

const DOC_BASE = 'https://developer.d-robotics.cc/rdk_doc';
const DOC_S100 = `${DOC_BASE}/rdk_s`;
const NODEHUB_URL = 'https://developer.d-robotics.cc/en/nodehub';
const FORUM_URL = 'https://developer.d-robotics.cc/forum';

export const RDK_DOC_INDEX: DocIndexEntry[] = [
  // ── Getting Started ──────────────────────────────────────────────
  { title: 'RDK X5 快速上手',       url: `${DOC_BASE}/Quick_start/hardware_introduction/rdk_x5`,       section: 'getting-started', tags: ['quick-start', 'setup', 'boot', 'flash', 'x5'] },
  { title: 'RDK X3 快速上手',       url: `${DOC_BASE}/Quick_start/hardware_introduction/rdk_x3`,       section: 'getting-started', tags: ['quick-start', 'setup', 'boot', 'flash', 'x3'] },
  { title: 'RDK Ultra 快速上手',    url: `${DOC_BASE}/Quick_start/hardware_introduction/rdk_ultra`,    section: 'getting-started', tags: ['quick-start', 'setup', 'boot', 'flash', 'ultra'] },
  { title: 'S100 快速上手',          url: `${DOC_S100}/Quick_start/hardware_introduction/rdk_s100`,     section: 'getting-started', tags: ['s100', 's100p', 'quick-start', 'setup'] },
  { title: 'X3 系统镜像烧录',        url: `${DOC_BASE}/Quick_start/install_os/rdk_x3`,                  section: 'getting-started', tags: ['image', 'flash', 'burn', 'sd-card', 'x3'] },
  { title: 'X5 系统镜像烧录',        url: `${DOC_BASE}/Quick_start/install_os/rdk_x5`,                  section: 'getting-started', tags: ['image', 'flash', 'burn', 'sd-card', 'x5'] },
  { title: 'S100 系统镜像烧录',      url: `${DOC_S100}/Quick_start/install_os/rdk_s100/FAQ`,            section: 'getting-started', tags: ['image', 'flash', 'burn', 'emmc', 's100'] },
  { title: '网络配置（有线/WiFi/蓝牙）', url: `${DOC_BASE}/System_configuration/network_blueteeth`,      section: 'getting-started', tags: ['network', 'wifi', 'ethernet', 'bluetooth', 'ip', 'nmcli'] },
  { title: '远程登录（SSH/串口）',   url: `${DOC_BASE}/Quick_start/remote_login`,                       section: 'getting-started', tags: ['ssh', 'serial', 'putty', 'login'] },
  { title: 'RDK Studio 设备管理',    url: `${DOC_BASE}/Quick_start/RDK_Studio/Device_management/hardware_resource`, section: 'studio', tags: ['studio', 'device', 'connect', 'resource', 'management'] },
  { title: 'RDK Studio 烧录系统',    url: `${DOC_BASE}/Quick_start/RDK_Studio/flashing`,                section: 'studio', tags: ['studio', 'flash', 'burn', 'image'] },
  { title: 'RDK Studio 集成工具',    url: `${DOC_BASE}/Quick_start/RDK_Studio/Device_management/integration_tools`, section: 'studio', tags: ['studio', 'terminal', 'file', 'vnc', 'ide', 'tool'] },
  { title: 'RDK Studio OpenClaw 配置', url: `${DOC_BASE}/Quick_start/RDK_Studio/openclaw/config_openclaw`, section: 'studio', tags: ['studio', 'openclaw', 'agent', 'board'] },
  { title: 'RDK Studio NodeHub',     url: `${DOC_BASE}/Quick_start/RDK_Studio/nodehub`,                 section: 'studio', tags: ['studio', 'nodehub', 'app', 'example'] },

  // ── Vision / Camera ──────────────────────────────────────────────
  { title: 'USB 摄像头使用（hobot_usb_cam）', url: `${DOC_BASE}/Basic_Application/vision/usb_camera`, section: 'vision', tags: ['camera', 'usb', 'v4l2', 'mjpeg', 'hobot_usb_cam'] },
  { title: 'MIPI 摄像头使用',                  url: `${DOC_BASE}/Basic_Application/vision/mipi_camera`, section: 'vision', tags: ['camera', 'mipi', 'csi', 'imx219', 'gc4663'] },
  { title: 'YOLO 目标检测',                    url: `${DOC_BASE}/Basic_Application/pydev_demo_sample/yolov5_sample`, section: 'vision', tags: ['yolo', 'detection', 'object-detection', 'yolov5', 'yolov8', 'mono2d'] },
  { title: '人体检测与姿态估计',               url: `${DOC_BASE}/Robot_development/boxs/body/mono2d_body_detection`, section: 'vision', tags: ['body', 'pose', 'skeleton', 'mono2d', 'detection'] },
  { title: 'DOSOD 开放词汇检测',               url: `${DOC_BASE}/Robot_development/boxs/detection/hobot_dosod`, section: 'vision', tags: ['dosod', 'open-vocabulary', 'text-prompt', 'yolo-world'] },
  { title: '图像分类',                         url: `${DOC_BASE}/Basic_Application/pydev_demo_sample/basic_sample`, section: 'vision', tags: ['classification', 'mobilenet', 'efficientnet', 'resnet'] },
  { title: '语义分割',                         url: `${DOC_BASE}/Basic_Application/pydev_demo_sample/segment_sample`, section: 'vision', tags: ['segmentation', 'semantic', 'deeplabv3', 'unet'] },
  { title: 'Web 可视化推流',                   url: `${DOC_BASE}/Basic_Application/pydev_demo_sample/web_display_camera_sample`, section: 'vision', tags: ['web', 'display', 'stream', '8000', 'websocket', 'visualization'] },
  { title: '视觉SLAM与建图',                   url: `${DOC_BASE}/Robot_development/apps/slam`, section: 'vision', tags: ['slam', 'stereo', 'mapping', 'depth', 'vslam'] },
  { title: 'StereoNet 双目深度估计',           url: 'https://github.com/D-Robotics/hobot_stereonet', section: 'vision', tags: ['stereo', 'depth', 'stereonet', 'hobot_stereonet', 'bpu'] },
  { title: 'OpenCV 加速绑定（hobot_cv）',      url: 'https://github.com/D-Robotics/hobot_cv', section: 'vision', tags: ['opencv', 'hobot_cv', 'resize', 'crop', 'yuv', 'acceleration'] },

  // ── ROS / TROS ───────────────────────────────────────────────────
  { title: 'TROS 安装与环境配置', url: `${DOC_BASE}/Robot_development/quick_start/install_tros`, section: 'ros', tags: ['tros', 'ros2', 'humble', 'install', 'setup'] },
  { title: 'TROS 环境准备',       url: `${DOC_BASE}/Robot_development/quick_start/preparation`, section: 'ros', tags: ['tros', 'ros2', 'humble', 'environment'] },
  { title: 'TROS Hello World',    url: `${DOC_BASE}/Robot_development/quick_start/hello_world`, section: 'ros', tags: ['tros', 'ros2', 'hello-world', 'package'] },
  { title: 'ROS2 package 使用',   url: `${DOC_BASE}/Robot_development/quick_start/ros_pkg`, section: 'ros', tags: ['ros2', 'package', 'colcon', 'workspace'] },
  { title: '传感器数据采集',       url: `${DOC_BASE}/Robot_development/quick_demo/demo_sensor`, section: 'ros', tags: ['lidar', 'imu', 'sensor', 'driver', 'camera'] },
  { title: 'Livox 激光雷达 ROS2 驱动', url: 'https://github.com/D-Robotics/livox_ros_driver2', section: 'ros', tags: ['livox', 'lidar', 'driver', 'ros2', 'hap', 'mid-360', 'avia'] },
  { title: 'Nav2 导航部署',        url: `${DOC_BASE}/Robot_development/apps/navigation2`, section: 'ros', tags: ['nav2', 'navigation', 'slam', 'map', 'amcl', 'path-planning'] },
  { title: 'TROS 编译入口（robot_dev_config）', url: 'https://github.com/D-Robotics/robot_dev_config', section: 'ros', tags: ['tros', 'colcon', 'build', 'robot_dev_config', 'workspace'] },
  { title: 'rosbag2 (D-Robotics fork)', url: 'https://github.com/D-Robotics/rosbag2', section: 'ros', tags: ['rosbag', 'rosbag2', 'record', 'playback'] },

  // ── BPU / Toolchain ──────────────────────────────────────────────
  { title: 'BPU 工具链概述',       url: `${DOC_BASE}/Advanced_development/toolchain_development/overview`, section: 'toolchain', tags: ['bpu', 'toolchain', 'hbdk', 'compile', 'quantize'] },
  { title: '工具链快速上手',       url: `${DOC_BASE}/Advanced_development/toolchain_development/expert/quick_start`, section: 'toolchain', tags: ['model', 'conversion', 'onnx', 'bin', 'hb_mapper', 'calibration'] },
  { title: '工具链开发指南',       url: `${DOC_BASE}/Advanced_development/toolchain_development/expert/user_guide`, section: 'toolchain', tags: ['model', 'conversion', 'onnx', 'bin', 'hb_mapper', 'calibration'] },
  { title: '工具链 API 手册',      url: `${DOC_BASE}/Advanced_development/toolchain_development/expert/api_reference`, section: 'toolchain', tags: ['api', 'operator', 'op', 'support', 'onnx', 'bpu', 'transformer'] },
  { title: '工具链 FAQ',           url: `${DOC_BASE}/FAQ/toolchain`, section: 'toolchain', tags: ['faq', 'ptq', 'qat', 'quantize', 'calibration', 'int8', 'mixed-precision'] },

  // ── LLM / VLM ────────────────────────────────────────────────────
  { title: '端侧大模型部署 (LLM)', url: `${DOC_BASE}/Robot_development/boxs/generate/hobot_llm`, section: 'llm', tags: ['llm', 'large-language-model', 'deepseek', 'qwen', 'on-device', 'transformers'] },
  { title: 'S100 端侧大模型部署 (LLM)', url: `${DOC_S100}/Robot_development/boxs/generate/hobot_llm`, section: 'llm', tags: ['s100', 'llm', 'large-language-model', 'deepseek', 'qwen', 'on-device'] },
  { title: 'S100 文本图片特征检索', url: `${DOC_S100}/Robot_development/boxs/function/hobot_clip`, section: 'llm', tags: ['s100', 'vlm', 'vision-language', 'clip', 'multimodal'] },
  { title: 'TTS/ASR 语音',         url: `${DOC_BASE}/Robot_development/boxs/audio/hobot_audio`, section: 'llm', tags: ['tts', 'asr', 'speech', 'voice', 'audio'] },

  // ── Hardware / GPIO ──────────────────────────────────────────────
  { title: '40pin 管脚定义',   url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/40pin_define`, section: 'hardware', tags: ['gpio', '40pin', 'pinout', 'digital', 'Hobot.GPIO'] },
  { title: '40pin GPIO 使用',   url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/gpio`, section: 'hardware', tags: ['gpio', '40pin', 'pinout', 'digital', 'Hobot.GPIO'] },
  { title: 'I2C 接口使用',     url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/i2c`,  section: 'hardware', tags: ['i2c', 'bus', 'sensor', 'i2cdetect'] },
  { title: 'SPI 接口使用',     url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/spi`,  section: 'hardware', tags: ['spi', 'bus', 'peripheral'] },
  { title: 'UART 串口通信',    url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/uart`, section: 'hardware', tags: ['uart', 'serial', 'tty', 'rs232'] },
  { title: 'PWM 输出控制',     url: `${DOC_BASE}/Basic_Application/01_40pin_user_sample/pwm`,  section: 'hardware', tags: ['pwm', 'motor', 'servo', 'duty-cycle'] },
  { title: 'S100 MCU IPC',     url: `${DOC_S100}/Advanced_development/mcu_development/S100/mcu_ipc`, section: 'hardware', tags: ['s100', 'mcu', 'r52', 'ipc', 'realtime'] },
  { title: 'X5 板级 IO C 库（x5-hobot-io）', url: 'https://github.com/D-Robotics/x5-hobot-io', section: 'hardware', tags: ['x5', 'io', 'gpio', 'i2c', 'spi', 'pwm', 'c-library'] },
  { title: 'X5 平台工具集（x5-hobot-utils）', url: 'https://github.com/D-Robotics/x5-hobot-utils', section: 'hardware', tags: ['x5', 'utils', 'system', 'flash', 'tool'] },
  { title: 'X3 镜像构建（rdk-gen）',           url: 'https://github.com/D-Robotics/rdk-gen', section: 'hardware', tags: ['x3', 'image', 'flash', 'rdk-gen', 'build'] },
  { title: 'X5 镜像构建（x5-rdk-gen）',        url: 'https://github.com/D-Robotics/x5-rdk-gen', section: 'hardware', tags: ['x5', 'image', 'flash', 'x5-rdk-gen', 'build'] },

  // ── System ───────────────────────────────────────────────────────
  { title: '系统配置入口',      url: `${DOC_BASE}/System_configuration`,       section: 'system', tags: ['system', 'config', 'srpi-config'] },
  { title: '系统更新与升级',    url: `${DOC_BASE}/Release_Note/release_note`, section: 'system', tags: ['update', 'upgrade', 'apt', 'ota', 'release'] },
  { title: 'S100 文件共享工具', url: `${DOC_S100}/System_configuration/share_file_tool`, section: 'system', tags: ['s100', 'storage', 'file', 'share', 'mount'] },
  { title: '性能调优与散热',    url: `${DOC_BASE}/System_configuration/frequency_management`, section: 'system', tags: ['performance', 'thermal', 'cooling', 'cpu-freq', 'governor'] },
  { title: '多媒体编解码',      url: `${DOC_BASE}/Advanced_development/multimedia_development/overview`, section: 'system', tags: ['video', 'codec', 'h264', 'h265', 'encode', 'decode'] },

  // ── Ecosystem ────────────────────────────────────────────────────
  { title: 'NodeHub 应用中心',     url: NODEHUB_URL, section: 'ecosystem', tags: ['nodehub', 'app', 'install', 'example', 'project'] },
  { title: '开发者社区论坛',       url: FORUM_URL,   section: 'ecosystem', tags: ['forum', 'community', 'qa', 'discussion'] },
  { title: 'GitHub D-Robotics 仓库', url: 'https://github.com/D-Robotics',               section: 'ecosystem', tags: ['github', 'source', 'open-source', 'hobot'] },
  { title: 'Model Zoo (X3/X5/Ultra · Bayes)', url: 'https://github.com/D-Robotics/rdk_model_zoo', section: 'ecosystem', tags: ['model-zoo', 'pretrained', 'yolo', 'detection', 'bin', 'bayes', 'bernoulli2'] },
  { title: 'Model Zoo (S100/S100P · Nash)',   url: 'https://github.com/D-Robotics/rdk_model_zoo_s', section: 'ecosystem', tags: ['model-zoo', 's100', 'nash', 'pretrained', 'llm', 'vlm', 'dosod'] },
  { title: 'RDK 文档源码',         url: 'https://github.com/D-Robotics/rdk_doc',          section: 'ecosystem', tags: ['docs', 'source', 'markdown', 'rdk_doc'] },
  { title: '系统镜像下载清单',     url: 'https://github.com/D-Robotics/system_download',  section: 'ecosystem', tags: ['download', 'image', 'firmware', 'release'] },
];
