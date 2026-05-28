/**
 * RDK Device Profiles — hardware capability data for D-Robotics RDK boards.
 *
 * Profiles use DeviceProfileBase fields directly. RdkDeviceProfile extends
 * the base with RDK-specific convenience aliases (bpuTops, bpuCmd, etc.)
 * consumed by server adapters.
 */

interface DeviceProfileBase {
  platform: string;
  displayName: string;
  soc?: string;
  computeUnit?: string;
  computeTops?: number;
  cpu?: string;
  ramGb?: number;
  modelFormat?: string;
  diagnosticCommand?: string;
  runtimeBasePath?: string;
  systemPython?: string;
  inferLibPackage?: string;
  detectionPatterns?: string[];
  limitations?: string[];
  docBaseUrl?: string;
  capabilityNotes?: string[];
  cameraInterfaces?: Array<Record<string, unknown>>;
  gpio?: Record<string, unknown>;
  networkInterfaces?: string[];
  storageSpec?: string;
  powerSpec?: string;
  supportedOs?: string[];
  recommendedUseCases?: string[];
  sourceUrls?: string[];
  lastReviewedAt?: string;
}

export interface RdkDeviceProfile extends DeviceProfileBase {
  bpuTops: number;
  bpuCmd: string;
  trosPath: string;
  bpuInferLib: string;
  bpuArch: 'Bernoulli2' | 'Bayes' | 'Nash';
}

const RDK_REVIEWED_AT = '2026-05-28';
const RDK_DOC_BASE = 'https://developer.d-robotics.cc/rdk_doc/';
const RDK_PRODUCT_BASE = 'https://developer.d-robotics.cc/en';

function profile(
  p: Omit<
    RdkDeviceProfile,
    'computeUnit' | 'computeTops' | 'diagnosticCommand' | 'runtimeBasePath' | 'inferLibPackage'
  >,
): RdkDeviceProfile {
  return {
    ...p,
    computeUnit: 'BPU',
    computeTops: p.bpuTops,
    diagnosticCommand: p.bpuCmd,
    runtimeBasePath: p.trosPath,
    inferLibPackage: p.bpuInferLib,
  };
}

export const RDK_PROFILES: Record<string, RdkDeviceProfile> = {
  'rdk-x3': profile({
    platform: 'rdk-x3',
    displayName: 'RDK X3',
    soc: 'Sunrise 3 (X3J3)',
    bpuTops: 5,
    bpuArch: 'Bernoulli2',
    cpu: 'Quad-core Cortex-A53 @1.5GHz',
    ramGb: 2,
    modelFormat: '.bin (Bernoulli2)',
    bpuCmd: 'hrut_smi',
    trosPath: '/opt/tros/humble',
    systemPython: '/usr/bin/python3.8',
    bpuInferLib: 'bpu_infer_lib_x3',
    detectionPatterns: ['x3', 'X3', 'sunrise3', 'j3', 'xj3', 'X3J3'],
    limitations: [
      'Max 5 TOPS — heavy models (YOLOv5x, large transformers) will be very slow',
      '2 GB RAM — models larger than ~500 MB will OOM',
      'Only one USB 3.0 host port on the development kit — multi-camera USB bandwidth is limited',
      'Bernoulli2 BPU — limited operator support, no Transformer/Attention ops',
    ],
    docBaseUrl: RDK_DOC_BASE,
    capabilityNotes: [
      '5 TOPS BPU 适合轻量模型 (YOLOv5s/MobileNet/FCOS/EfficientDet)',
      '2 GB 内存限制大模型，LLM 不可用',
      '2 路 MIPI CSI (2-lane) + 1 路 USB 3.0 Type-A Host；40PIN 另有 2 路 USB2 Host 信号',
      '适用场景：教学入门、轻量检测、GPIO 传感器实验',
    ],
    cameraInterfaces: [
      { type: 'mipi', count: 2, notes: '2-lane MIPI CSI-2' },
      { type: 'usb', count: 1, notes: 'USB 3.0 Type-A host for USB camera; USB2 Host signals are exposed on 40PIN' },
    ],
    gpio: {
      pinCount: 40,
      gpioCount: 28,
      i2cBuses: 2,
      spiBuses: 1,
      uartPorts: 3,
      pwmChannels: 2,
      voltage: '3.3V',
    },
    networkInterfaces: ['eth0'],
    storageSpec: 'microSD (no eMMC)',
    powerSpec: '5V/3A USB-C',
    supportedOs: ['Ubuntu 20.04 (aarch64)'],
    recommendedUseCases: ['教学入门', '轻量视觉检测', 'GPIO 传感器控制', 'ROS2 学习'],
    sourceUrls: [
      `${RDK_DOC_BASE}Quick_start/hardware_introduction/rdk_x3`,
    ],
    lastReviewedAt: RDK_REVIEWED_AT,
  }),

  'rdk-x5': profile({
    platform: 'rdk-x5',
    displayName: 'RDK X5',
    soc: 'Sunrise 5',
    bpuTops: 10,
    bpuArch: 'Bayes',
    cpu: 'Octa-core Cortex-A55 @1.5GHz',
    ramGb: 8,
    modelFormat: '.bin (Bayes)',
    bpuCmd: 'hrut_bpuprofile -b 0',
    trosPath: '/opt/tros/humble',
    systemPython: '/usr/bin/python3.10',
    bpuInferLib: 'bpu_infer_lib_x5',
    detectionPatterns: ['x5', 'X5', 'sunrise5', 'Sunrise 5'],
    limitations: [
      'LLM limited to ≤2B parameter quantized models on-device',
      'Bayes BPU — partial Attention op support, some Transformer models may fail conversion',
    ],
    docBaseUrl: RDK_DOC_BASE,
    capabilityNotes: [
      '10 TOPS Bayes BPU — YOLO / 分类 / 分割 / 姿态估计主力平台',
      'RDK X5 有 4GB/8GB LPDDR4 配置；LLM/多路视觉优先选 8GB',
      'DOSOD 开放词汇检测 (~12 fps)，端侧 LLM (≤2B)',
      '4K 视频编解码，CAN FD，Wi-Fi，4 路 USB 3.0',
      '适用场景：机器人视觉、TROS pipeline、端侧 AI 推理',
    ],
    cameraInterfaces: [
      { type: 'mipi', count: 2, notes: '2 x 4-lane MIPI CSI-2' },
      { type: 'usb', count: 4, notes: 'USB 3.0' },
    ],
    gpio: {
      pinCount: 40,
      gpioCount: 28,
      i2cBuses: 3,
      spiBuses: 2,
      uartPorts: 5,
      pwmChannels: 8,
      voltage: '3.3V',
    },
    networkInterfaces: ['eth0', 'wlan0', 'can0'],
    storageSpec: 'MicroSD boot media on RDK X5 development kit; module/carrier variants may add onboard storage',
    powerSpec: '5V/5A USB-C',
    supportedOs: ['Ubuntu 22.04 (aarch64)'],
    recommendedUseCases: [
      '机器人视觉',
      'TROS pipeline',
      '端侧 AI 推理',
      'DOSOD 开放词汇检测',
      'ROS2 开发',
    ],
    sourceUrls: [
      `${RDK_DOC_BASE}Quick_start/hardware_introduction/rdk_x5`,
      `${RDK_PRODUCT_BASE}/rdkx5`,
    ],
    lastReviewedAt: RDK_REVIEWED_AT,
  }),

  'rdk-ultra': profile({
    platform: 'rdk-ultra',
    displayName: 'RDK Ultra',
    soc: 'Sunrise 5 Ultra',
    bpuTops: 96,
    bpuArch: 'Bayes',
    cpu: 'Octa-core Cortex-A55',
    ramGb: 8,
    modelFormat: '.bin (Bayes)',
    bpuCmd: 'hrut_bpuprofile -b 0',
    trosPath: '/opt/tros/humble',
    systemPython: '/usr/bin/python3.10',
    bpuInferLib: 'bpu_infer_lib_x5',
    detectionPatterns: ['ultra', 'Ultra', 'RDK Ultra'],
    limitations: [
      'Higher power consumption — needs active cooling (12V/3A DC)',
      'Same Bayes architecture as X5 — model .bin compatible but performance scaled up',
    ],
    docBaseUrl: RDK_DOC_BASE,
    capabilityNotes: [
      '96 TOPS Bayes BPU — 可运行 YOLOv5x/v8x 等大模型实时推理',
      '8 GB RAM，支持多路视觉同时推理',
      '与 X5 共享 Bayes 工具链，X5 编译的 .bin 可直接使用',
      '需主动散热，长时间运行用 `hrut_somstatus` 监控温度',
      '适用场景：高性能边缘推理、多路视觉处理、工业检测',
    ],
    cameraInterfaces: [
      { type: 'mipi', count: 4, notes: '4-lane MIPI CSI-2' },
      { type: 'usb', count: 4, notes: 'USB 3.0' },
    ],
    gpio: {
      pinCount: 40,
      gpioCount: 28,
      i2cBuses: 3,
      spiBuses: 2,
      uartPorts: 5,
      pwmChannels: 8,
      voltage: '3.3V',
    },
    networkInterfaces: ['eth0', 'wlan0'],
    storageSpec: 'eMMC 64GB + microSD',
    powerSpec: '12V/5A DC',
    supportedOs: ['Ubuntu 22.04 (aarch64)'],
    recommendedUseCases: ['大规模模型推理', '多路视觉处理', '高性能边缘计算', '工业检测'],
    sourceUrls: [
      `${RDK_DOC_BASE}Quick_start/hardware_introduction/rdk_ultra`,
    ],
    lastReviewedAt: RDK_REVIEWED_AT,
  }),

  'rdk-s100': profile({
    platform: 'rdk-s100',
    displayName: 'RDK S100',
    soc: 'S100 (Nash)',
    bpuTops: 80,
    bpuArch: 'Nash',
    cpu: 'Hexa-core Cortex-A78AE @1.5GHz + Quad-core Cortex-R52+ MCU @1.2GHz',
    ramGb: 12,
    modelFormat: '.bin (Nash)',
    bpuCmd: 'hrut_bpuprofile',
    trosPath: '/opt/tros/humble',
    systemPython: '/usr/bin/python3.10',
    bpuInferLib: 'bpu_infer_lib_s100',
    detectionPatterns: ['s100', 'S100', 'RDK S100', 'rdk_s100'],
    limitations: [
      '12-20V DC 供电，功耗高于 X5',
      'Nash BPU 模型格式与 Bayes(X5) 不兼容，需重新编译',
      'MIPI/GMSL 相机需配扩展板',
    ],
    docBaseUrl: `${RDK_DOC_BASE}rdk_s/`,
    capabilityNotes: [
      '80 TOPS Nash BPU (S100P=128 TOPS)，160+ ONNX 算子，CNN + Transformer 优化',
      'MCU (4×R52+ @1.2GHz) 支持高帧率低延迟关节控制，具身智能首选',
      'DOSOD ~45 fps，可运行 LLM/VLM (DeepSeek/InternVL2)',
      '12 GB LPDDR5 (S100P=24 GB)，GMSL + MIPI 多路相机，双千兆网口',
      '适用场景：具身智能、人形机器人、大模型推理、高级视觉应用',
    ],
    cameraInterfaces: [
      { type: 'mipi', count: 2, notes: '2 x 4-lane MIPI CSI-2 via the camera expansion board' },
      { type: 'gmsl', count: 4, notes: 'Fakra-Mini 4-in-1 GMSL2 on the camera expansion board' },
      { type: 'usb', count: 4, notes: 'USB 3.0' },
    ],
    gpio: {
      pinCount: 40,
      gpioCount: 20,
      i2cBuses: 4,
      spiBuses: 2,
      uartPorts: 6,
      pwmChannels: 8,
      voltage: '3.3V',
      notes: 'MCU (R52+) handles real-time GPIO',
    },
    networkInterfaces: ['eth0', 'eth1', 'can0'],
    storageSpec: 'eMMC 64GB + microSD + M.2 NVMe',
    powerSpec: '12-20V DC barrel; size supply for workload (official examples include 12V@5.5A and 20V@7.5A)',
    supportedOs: ['Ubuntu 22.04 (aarch64)'],
    recommendedUseCases: [
      '具身智能',
      '人形机器人',
      '大模型推理 (LLM/VLM)',
      '多路相机视觉',
      '实时关节控制',
    ],
    sourceUrls: [
      `${RDK_DOC_BASE}rdk_s/Quick_start/hardware_introduction/rdk_s100`,
      `${RDK_DOC_BASE}rdk_s/Quick_start/hardware_introduction/rdk_s100_camera_expansion_board`,
      `${RDK_PRODUCT_BASE}/rdks100`,
    ],
    lastReviewedAt: RDK_REVIEWED_AT,
  }),

  'rdk-s100p': profile({
    platform: 'rdk-s100p',
    displayName: 'RDK S100P',
    soc: 'S100P (Nash)',
    bpuTops: 128,
    bpuArch: 'Nash',
    cpu: 'Hexa-core Cortex-A78AE @2.0GHz + Quad-core Cortex-R52+ MCU @1.2GHz',
    ramGb: 24,
    modelFormat: '.bin (Nash)',
    bpuCmd: 'hrut_bpuprofile',
    trosPath: '/opt/tros/humble',
    systemPython: '/usr/bin/python3.10',
    bpuInferLib: 'bpu_infer_lib_s100',
    detectionPatterns: ['s100p', 'S100P', 'RDK S100P', 'rdk_s100p'],
    limitations: [
      'Nash BPU 模型格式与 Bernoulli2/Bayes 不兼容，需重新编译',
      '高负载供电和散热要求高于 X 系列，长时间满载必须留足电源余量',
      'MIPI/GMSL 相机需配扩展板',
    ],
    docBaseUrl: `${RDK_DOC_BASE}rdk_s/`,
    capabilityNotes: [
      '128 TOPS Nash BPU，24 GB LPDDR5，面向大模型/VLM/多路感知原型',
      'CPU 主频 2.0GHz，MCU (4×R52+ @1.2GHz) 支持实时控制协同',
      '与 S100 共用 Nash 工具链和 S100 文档路径，模型仍需按 Nash 架构编译',
      '适用场景：具身智能、高算力视觉、多路相机、端侧大模型研究',
    ],
    cameraInterfaces: [
      { type: 'mipi', count: 2, notes: '2 x 4-lane MIPI CSI-2 via the camera expansion board' },
      { type: 'gmsl', count: 4, notes: 'Fakra-Mini 4-in-1 GMSL2 on the camera expansion board' },
      { type: 'usb', count: 4, notes: 'USB 3.0' },
    ],
    gpio: {
      pinCount: 40,
      gpioCount: 20,
      i2cBuses: 4,
      spiBuses: 2,
      uartPorts: 6,
      pwmChannels: 8,
      voltage: '3.3V',
      notes: 'MCU (R52+) handles real-time GPIO',
    },
    networkInterfaces: ['eth0', 'eth1', 'can0'],
    storageSpec: 'eMMC 64GB + microSD + M.2 NVMe',
    powerSpec: '12-20V DC barrel; size supply for workload (official examples include 12V@5.5A and 20V@7.5A)',
    supportedOs: ['Ubuntu 22.04 (aarch64)'],
    recommendedUseCases: ['具身智能', '高算力 VLM/LLM 原型', '多路相机视觉', '实时关节控制'],
    sourceUrls: [
      `${RDK_DOC_BASE}rdk_s/Quick_start/hardware_introduction/rdk_s100`,
      `${RDK_DOC_BASE}rdk_s/Quick_start/hardware_introduction/rdk_s100_camera_expansion_board`,
      `${RDK_PRODUCT_BASE}/rdks100`,
    ],
    lastReviewedAt: RDK_REVIEWED_AT,
  }),
};

const DEFAULT_RESEARCH_SEEDS = [
  RDK_DOC_BASE,
  'https://github.com/D-Robotics',
];

/** Return raw RDK-specific profiles (for server adapter import) */
export function getRdkProfilesRaw(): Record<string, RdkDeviceProfile> {
  return { ...RDK_PROFILES };
}

/** Convert to generic DeviceProfileBase format (RDK aliases already populated by profile()) */
export function getRdkDeviceProfiles(): Record<string, DeviceProfileBase> {
  return { ...RDK_PROFILES };
}

/** URLs to prioritize for web_fetch / web_search on RDK tasks */
export function getRdkResearchSeeds(platform: string): string[] {
  const p = RDK_PROFILES[platform];
  if (!p) return [...DEFAULT_RESEARCH_SEEDS];
  const out = p.docBaseUrl ? [p.docBaseUrl] : [];
  for (const u of DEFAULT_RESEARCH_SEEDS) {
    if (!out.includes(u)) out.push(u);
  }
  return out;
}
