import type { CommandRiskLevel } from '@device-knowledge/core';

interface RdkWorkflowStepSeed {
  title: string;
  detail: string;
  command?: string;
  riskLevel?: CommandRiskLevel;
  expected?: string;
}

interface RdkWorkflowVerificationSeed {
  title: string;
  command?: string;
  expected: string;
}

interface RdkWorkflowGuideSeed {
  id: string;
  title: string;
  category: string;
  triggers: string[];
  prerequisites: string[];
  steps: RdkWorkflowStepSeed[];
  verification: RdkWorkflowVerificationSeed[];
  safetyNotes: string[];
  expectedOutcome: string;
  sourceUrl: string;
  relatedUrls: string[];
  relatedDocIds?: string[];
  platforms?: string[];
  priority: number;
}

const DOC_BASE = 'https://developer.d-robotics.cc/rdk_doc';
const DOC_S100 = `${DOC_BASE}/rdk_s`;

export const RDK_WORKFLOW_GUIDES: RdkWorkflowGuideSeed[] = [
  {
    id: 'rdk-workflow-identify-board-baseline',
    title: '确认 RDK 板型与运行基线',
    category: 'diagnostics',
    triggers: ['确认板型', 'identify board', 'board profile', '连接新设备', '不知道是哪块 RDK'],
    prerequisites: ['已经通过 SSH、串口或 RDK Studio 打开设备 shell。'],
    steps: [
      {
        title: '读取板型标识',
        detail: '先用板上事实确认硬件，不要根据用户描述猜测 X3/X5/Ultra/S100。',
        command: 'cat /sys/class/socinfo/board_id',
        riskLevel: 'safe',
        expected: '输出能映射到 X3、X5、Ultra、S100 或 S100P；未知输出需要继续收集日志。',
      },
      {
        title: '读取系统镜像版本',
        detail: '记录 OS/RDK 版本，后续包名、TROS 路径和工具链建议都要以版本为前提。',
        command: 'cat /etc/version',
        riskLevel: 'safe',
        expected: '输出镜像版本；如果文件不存在，改用系统 release 文件和 RDK Studio 设备信息交叉确认。',
      },
      {
        title: '按板型选择 BPU 监控命令',
        detail: 'X3 使用 hrut_smi；X5/Ultra 使用 hrut_bpuprofile -b 0；S100/S100P 使用 hrut_bpuprofile。',
        command: 'hrut_bpuprofile -b 0',
        riskLevel: 'safe',
        expected: 'X5/Ultra 能看到 BPU profile 输出；X3 或 S100 系列需要换对应命令。',
      },
    ],
    verification: [
      {
        title: '回答中先列出已确认基线',
        expected: '面向用户的下一步建议必须先说明板型、SoC/BPU 架构、系统版本和仍未知的信息。',
      },
      {
        title: '未知板型不套模板',
        expected: '无法确认时追问或请求命令输出，不默认套用 RDK X5 路径。',
      },
    ],
    safetyNotes: ['本流程只使用只读命令；不要在确认板型前执行刷机、升级或 GPIO 输出类操作。'],
    expectedOutcome: '助手能把后续安装、模型部署、摄像头、TROS 建议限定到正确板型。',
    sourceUrl: `${DOC_BASE}/Quick_start/hardware_introduction/rdk_x5`,
    relatedUrls: [
      `${DOC_BASE}/Quick_start/hardware_introduction/rdk_x3`,
      `${DOC_BASE}/Quick_start/hardware_introduction/rdk_ultra`,
      `${DOC_S100}/Quick_start/hardware_introduction/rdk_s100`,
    ],
    priority: 96,
  },
  {
    id: 'rdk-workflow-first-boot-studio-connect',
    title: '首次启动、联网并接入 RDK Studio',
    category: 'getting-started',
    triggers: ['快速上手', 'first boot', 'RDK Studio 连接', 'SSH 登录', '烧录后连接不上'],
    prerequisites: ['已准备匹配板型的官方镜像、电源、存储介质和主机端 RDK Studio。'],
    steps: [
      {
        title: '确认供电和启动状态',
        detail: '优先排除电源不足、镜像不匹配和存储介质质量问题。',
        expected: '板卡稳定启动，指示灯和串口/屏幕日志没有反复重启迹象。',
      },
      {
        title: '确认网络地址',
        detail: '通过路由器、串口、屏幕或 Studio 设备发现流程找到板端 IP。',
        command: 'ip addr',
        riskLevel: 'safe',
        expected: '能看到 eth0/wlan0 等接口地址；没有地址时先处理网络配置。',
      },
      {
        title: '验证远程登录',
        detail: '按板型和镜像确认默认用户，再通过 SSH 或 Studio 终端进入设备。',
        command: 'ssh root@<device-ip>',
        riskLevel: 'safe',
        expected: '成功进入 shell；认证失败时先核对镜像、用户和网络，不直接建议重刷。',
      },
      {
        title: '在 Studio 中确认设备资源',
        detail: '使用 RDK Studio 设备管理页查看硬件资源、终端、文件和集成工具是否可用。',
        expected: 'Studio 侧能显示设备资源，并能打开终端或文件管理能力。',
      },
    ],
    verification: [
      {
        title: '端到端连通',
        command: 'hostname && cat /etc/version',
        expected: '终端命令能返回设备名和系统版本。',
      },
      {
        title: 'Studio 连接状态',
        expected: 'RDK Studio 设备管理页显示在线，核心集成工具可进入。',
      },
    ],
    safetyNotes: ['刷机和重置网络都属于确认型操作；先完成只读诊断，再让用户确认是否继续。'],
    expectedOutcome: '用户能从新板开箱进入一个可被 Studio 管理、可执行命令的稳定状态。',
    sourceUrl: `${DOC_BASE}/Quick_start/RDK_Studio/Device_management/hardware_resource`,
    relatedUrls: [
      `${DOC_BASE}/Quick_start/RDK_Studio/flashing`,
      `${DOC_BASE}/Quick_start/RDK_Studio/Device_management/integration_tools`,
      `${DOC_BASE}/Quick_start/remote_login`,
    ],
    priority: 90,
  },
  {
    id: 'rdk-workflow-bpu-model-deployment',
    title: 'BPU 模型转换与部署闭环',
    category: 'model-deployment',
    triggers: ['部署模型', 'YOLO 转换', 'hb_mapper', 'pt 直接跑很慢', 'BPU 推理'],
    prerequisites: ['已确认板型和 BPU 架构。', '模型训练产物可导出 ONNX。', '主机侧具备官方工具链环境或 Docker。'],
    steps: [
      {
        title: '确认目标 BPU 架构',
        detail: 'X3=Bernoulli2，X5/Ultra=Bayes，S100/S100P=Nash；跨架构不能复用 .bin。',
        command: 'cat /sys/class/socinfo/board_id',
        riskLevel: 'safe',
        expected: '板型能映射到正确工具链 march 参数。',
      },
      {
        title: '在主机工具链中检查 ONNX',
        detail: '先做算子支持检查，避免把不支持的模型拷到板上才排障。',
        command: 'hb_mapper checker --model-type onnx --model <model.onnx>',
        riskLevel: 'moderate',
        expected: 'checker 通过；失败时根据不支持算子调整导出或模型结构。',
      },
      {
        title: '准备校准数据并生成 .bin',
        detail: '用覆盖真实输入分布的校准图片完成量化转换。',
        command: 'hb_mapper makertbin --config <model-config.yaml>',
        riskLevel: 'moderate',
        expected: '生成匹配目标架构的 .bin 文件和转换报告。',
      },
      {
        title: '拷贝模型并接入 runtime/TROS 节点',
        detail: '把 .bin 放入项目模型目录，使用 hobot_dnn 或对应 TROS 节点加载。',
        command: 'scp <model.bin> root@<device-ip>:/userdata/models/',
        riskLevel: 'moderate',
        expected: '板端能读取模型文件，launch/config 指向绝对存在的路径。',
      },
    ],
    verification: [
      {
        title: '转换性能评估',
        command: 'hb_eval_perf --model <model.bin>',
        expected: '输出 latency/fps，且结果满足项目目标或给出明确瓶颈。',
      },
      {
        title: '板端 BPU 参与推理',
        command: 'hrut_bpuprofile -b 0',
        expected: '推理时 BPU 利用率有变化；若没有变化，优先检查是否仍在 CPU 路径运行。',
      },
    ],
    safetyNotes: [
      '.pt 或原生 ONNX 拷到板上直接跑通常只走 CPU，不应当作为 BPU 部署成功。',
      '不要建议用户在板上安装 hb_mapper；转换链路属于主机侧工具链任务。',
    ],
    expectedOutcome: '用户得到一个经过 checker、量化、性能评估、板端加载验证的 BPU 部署闭环。',
    sourceUrl: `${DOC_BASE}/Advanced_development/toolchain_development/expert/quick_start`,
    relatedUrls: [
      `${DOC_BASE}/Advanced_development/toolchain_development/expert/user_guide`,
      `${DOC_BASE}/Advanced_development/toolchain_development/expert/api_reference`,
      'https://github.com/D-Robotics/rdk_model_zoo',
      'https://github.com/D-Robotics/rdk_model_zoo_s',
    ],
    priority: 94,
  },
  {
    id: 'rdk-workflow-camera-troubleshooting',
    title: 'USB/MIPI 摄像头排障闭环',
    category: 'vision',
    triggers: ['摄像头无画面', 'camera timeout', 'USB 摄像头', 'MIPI 摄像头', 'v4l2'],
    prerequisites: ['已确认板型和摄像头类型。', '已连接摄像头并能访问设备 shell。'],
    steps: [
      {
        title: '枚举视频设备',
        detail: '先确认内核是否暴露 video 节点。',
        command: 'ls /dev/video*',
        riskLevel: 'safe',
        expected: '存在 /dev/videoN；没有节点时先看 dmesg 和连接/供电。',
      },
      {
        title: 'USB 摄像头先看总线',
        detail: 'USB 摄像头需要确认设备枚举和带宽，再谈 ROS/TROS launch 参数。',
        command: 'lsusb',
        riskLevel: 'safe',
        expected: '能看到摄像头设备；看不到时排查线缆、供电和 USB 口。',
      },
      {
        title: '列出格式和帧率',
        detail: 'launch 参数必须匹配摄像头真实支持的 pixel format、分辨率和 fps。',
        command: 'v4l2-ctl -d /dev/video0 --list-formats-ext',
        riskLevel: 'safe',
        expected: '记录 MJPEG/YUYV 等格式及可用分辨率。',
      },
      {
        title: 'MIPI 摄像头查看驱动日志',
        detail: 'MIPI/CSI 问题通常先从驱动 probe、sensor id、lane 配置和扩展板连接排查。',
        command: 'dmesg | grep -i mipi',
        riskLevel: 'safe',
        expected: '能看到相关 probe 或错误日志；没有日志时扩大 grep 到 sensor 型号。',
      },
    ],
    verification: [
      {
        title: '低分辨率画面验证',
        expected: '先用 640x480 或文档推荐配置拿到稳定画面，再逐步提高分辨率或接入推理。',
      },
      {
        title: 'ROS/TROS topic 验证',
        command: 'ros2 topic list',
        expected: '摄像头节点启动后能看到图像 topic；没有 topic 时回到 launch 日志。',
      },
    ],
    safetyNotes: ['不要在没有确认设备节点和格式前反复修改 launch 参数；同一错误连续两次应回到官方文档和板端日志。'],
    expectedOutcome: '用户能定位问题属于硬件枚举、驱动、格式参数、ROS 节点还是推理链路。',
    sourceUrl: `${DOC_BASE}/Basic_Application/vision/usb_camera`,
    relatedUrls: [
      `${DOC_BASE}/Basic_Application/vision/mipi_camera`,
      `${DOC_BASE}/Robot_development/quick_demo/demo_sensor`,
    ],
    priority: 88,
  },
  {
    id: 'rdk-workflow-tros-environment-check',
    title: 'TROS/ROS2 环境确认与包定位',
    category: 'ros',
    triggers: ['ros2 command not found', 'TROS 环境', '找不到 launch', 'ros2 package', 'colcon'],
    prerequisites: ['已确认设备系统版本和登录用户。', '需要执行 ROS2/TROS 节点或定位包资源。'],
    steps: [
      {
        title: '加载 TROS 环境',
        detail: 'RDK TROS 默认路径通常在 /opt/tros/humble，部分镜像需要切换到配置好的用户。',
        command: 'source /opt/tros/humble/setup.bash',
        riskLevel: 'safe',
        expected: '当前 shell 能找到 ros2 命令。',
      },
      {
        title: '验证 ROS2 命令可用',
        detail: '先确认环境变量生效，再继续定位包或 launch。',
        command: 'ros2 pkg list | head',
        riskLevel: 'safe',
        expected: '输出若干 ROS2/TROS 包名。',
      },
      {
        title: '定位目标包前缀',
        detail: '不要猜 launch 文件路径，先让 ros2 告诉你包安装位置。',
        command: 'ros2 pkg prefix <pkg>',
        riskLevel: 'safe',
        expected: '输出目标包路径；找不到时检查包名或安装状态。',
      },
      {
        title: '查找 launch/config 资源',
        detail: '用 find 在实际安装目录中定位 launch.py、hbm、yaml 等资源。',
        command: 'find /opt/tros -name "*.launch.py"',
        riskLevel: 'safe',
        expected: '找到候选 launch 文件后再组织 ros2 launch 命令。',
      },
    ],
    verification: [
      {
        title: '节点可执行验证',
        command: 'ros2 run <pkg> <node> --ros-args --log-level debug',
        expected: '节点能启动或给出明确错误；错误应与包路径、参数或硬件资源关联。',
      },
      {
        title: '构建后环境验证',
        command: 'source install/setup.bash && ros2 pkg list | grep <pkg>',
        expected: '自定义包构建后能被当前 shell 发现。',
      },
    ],
    safetyNotes: ['不要把相对路径配置直接照搬到不同工作目录；优先使用板端 find/ros2 pkg prefix 得到绝对路径。'],
    expectedOutcome: '用户能稳定加载 TROS 环境，定位包资源，并把 launch/节点错误收敛到可诊断范围。',
    sourceUrl: `${DOC_BASE}/Robot_development/quick_start/install_tros`,
    relatedUrls: [
      `${DOC_BASE}/Robot_development/quick_start/preparation`,
      `${DOC_BASE}/Robot_development/quick_start/ros_pkg`,
      'https://github.com/D-Robotics/robot_dev_config',
    ],
    priority: 86,
  },
];
