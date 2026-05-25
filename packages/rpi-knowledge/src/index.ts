import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type PromptFragment,
} from '@device-knowledge/core';

const SOURCE_RETRIEVED_AT = '2026-05-25';

const RPI_SCOPE = {
  platforms: ['rpi-5', 'rpi-4b', 'rpi-cm4'],
  boards: ['raspberry-pi-5', 'raspberry-pi-4b', 'raspberry-pi-cm4'],
  socs: ['bcm2712', 'bcm2711'],
};

const rpiEcosystemText = [
  '## 树莓派生态（提要）',
  '- 官方文档与镜像说明见 raspberrypi.com/documentation。',
  '- 摄像头与显示栈随 OS 代际变化较大；以当前 `/boot/firmware` 与 libcamera 状态为准。',
].join('\n');

const promptFragments: PromptFragment[] = [
  {
    id: 'rpi-ecosystem-v1',
    section: 'ecosystem',
    tier: 'all',
    mode: 'all',
    priority: 41,
    content: [
      '## 树莓派设备上下文（知识模块）',
      '- 发行版多为 Raspberry Pi OS / Debian / Ubuntu；包管理与内核固件路径以**当前镜像**为准。',
      '- 推理常用 ONNX Runtime / PyTorch aarch64 builds；不要假设 RDK BPU / `hrut_smi`。',
      '- GPIO / 外设请对照当前主线的 pinout 与官方 wiring 文档。',
    ].join('\n'),
    source: {
      type: 'official-doc',
      url: 'https://www.raspberrypi.com/documentation/',
      retrievedAt: SOURCE_RETRIEVED_AT,
    },
    scope: RPI_SCOPE,
    tags: ['raspberry-pi', 'rpi', 'gpio', 'camera'],
    language: 'zh-CN',
    status: 'active',
    confidence: 'medium',
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: 'Raspberry Pi ecosystem prompt',
  },
];

const rpi5Profile = {
  platform: 'rpi-5',
  displayName: 'Raspberry Pi 5',
  soc: 'BCM2712 (Cortex-A76)',
  computeUnit: 'CPU / optional AI HAT+',
  computeTops: 0,
  cpu: 'Quad-core Cortex-A76 @ 2.4 GHz',
  ramGb: 8,
  modelFormat: 'onnx',
  diagnosticCommand: 'vcgencmd measure_temp && free -h && df -h /',
  runtimeBasePath: '/usr/lib',
  systemPython: '/usr/bin/python3',
  inferLibPackage: 'onnxruntime (vendor builds vary by OS)',
  detectionPatterns: ['raspberry pi', 'bcm2712', 'rpi-5'],
  limitations: ['ARM64 userspace on newer images; verify wheel availability vs aarch64.'],
  docBaseUrl: 'https://www.raspberrypi.com/documentation/',
  capabilityNotes: [
    'Use `/boot/firmware/config.txt` on Bookworm-based images for firmware tweaks (path may differ on older releases).',
    'Power: USB-C PD requirements depend on board revision and peripherals.',
  ],
};

const rpiProfiles = {
  'rpi-5': rpi5Profile,
  'rpi-4b': {
    ...rpi5Profile,
    platform: 'rpi-4b',
    displayName: 'Raspberry Pi 4 Model B',
    soc: 'BCM2711 (Cortex-A72)',
    computeUnit: 'CPU / VideoCore VI GPU',
    cpu: 'Quad-core Cortex-A72 @ 1.5 GHz',
    ramGb: 4,
    detectionPatterns: ['raspberry pi 4', 'bcm2711', 'rpi-4b'],
    limitations: ['RAM varies by board SKU; verify installed memory on the target device.'],
  },
  'rpi-cm4': {
    ...rpi5Profile,
    platform: 'rpi-cm4',
    displayName: 'Raspberry Pi Compute Module 4',
    soc: 'BCM2711 (Cortex-A72)',
    computeUnit: 'CPU / VideoCore VI GPU',
    cpu: 'Quad-core Cortex-A72 @ 1.5 GHz',
    ramGb: 4,
    detectionPatterns: ['raspberry pi compute module 4', 'bcm2711', 'cm4'],
    limitations: ['RAM and eMMC vary by CM4 SKU; verify installed hardware on the target device.'],
  },
};

export const rpiKnowledgeModuleData: DeviceKnowledgeModuleData & { ecosystemText: string } = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'raspberry-pi-sbc',
    name: 'Raspberry Pi',
    version: '0.1.0',
    origin: 'official',
    family: 'rpi',
    priority: 30,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '1.2.0',
    },
  },
  profiles: rpiProfiles,
  docs: [
    {
      id: 'rpi-doc-documentation',
      title: 'Raspberry Pi Documentation',
      url: 'https://www.raspberrypi.com/documentation/',
      sourceUrl: 'https://www.raspberrypi.com/documentation/',
      sourceType: 'official-doc',
      section: 'official',
      tags: ['rpi', 'gpio', 'camera'],
      language: 'en',
      status: 'active',
      confidence: 'medium',
      priority: 70,
      lastReviewedAt: SOURCE_RETRIEVED_AT,
      citationLabel: 'Raspberry Pi Documentation',
      source: {
        type: 'official-doc',
        url: 'https://www.raspberrypi.com/documentation/',
        retrievedAt: SOURCE_RETRIEVED_AT,
      },
      scope: RPI_SCOPE,
      chunkPolicy: {
        strategy: 'heading',
        maxTokens: 800,
        overlapTokens: 120,
      },
      metadataForEmbedding: ['title', 'section', 'tags', 'platforms'],
      metadataForPrompt: ['title', 'url', 'section', 'lastReviewedAt'],
    },
  ],
  promptFragments,
  commandPatterns: [],
  failureHints: [],
  skills: [],
  ecosystemText: rpiEcosystemText,
};

export function getRpiResearchSeeds(): string[] {
  return ['https://www.raspberrypi.com/documentation/'];
}
