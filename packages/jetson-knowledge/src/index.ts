import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type PromptFragment,
} from '@device-knowledge/core';

const SOURCE_RETRIEVED_AT = '2026-05-25';

const JETSON_SCOPE = {
  platforms: [
    'jetson-agx-orin',
    'jetson-orin-nano',
    'jetson-orin-nx',
    'jetson-xavier-nx',
    'jetson-nano',
  ],
  socs: ['orin', 'xavier', 'tegra'],
};

const jetsonEcosystemText = [
  '## Jetson 生态（提要）',
  '- JetPack bundles CUDA, TensorRT, and multimedia stacks for Jetson.',
  '- Prefer NVIDIA samples and `nvcr.io` containers that list your JetPack major as supported.',
].join('\n');

const promptFragments: PromptFragment[] = [
  {
    id: 'jetson-ecosystem-v1',
    section: 'ecosystem',
    tier: 'all',
    mode: 'all',
    priority: 42,
    content: [
      '## Jetson 设备上下文（知识模块）',
      '- 板级 SDK 为 JetPack（L4T）；容器镜像需匹配 JetPack 版本。',
      '- 推理优先查阅 TensorRT / CUDA 官方示例；勿套用 RDK BPU / TROS 路径。',
      '- 诊断入口：`tegrastats`、`jtop`（若已装）、以及官方 Jetson 文档中的健康检查命令。',
    ].join('\n'),
    source: {
      type: 'official-doc',
      url: 'https://developer.nvidia.com/embedded/jetson',
      retrievedAt: SOURCE_RETRIEVED_AT,
    },
    scope: JETSON_SCOPE,
    tags: ['jetson', 'jetpack', 'tensorrt', 'cuda'],
    language: 'zh-CN',
    status: 'active',
    confidence: 'medium',
    lastReviewedAt: SOURCE_RETRIEVED_AT,
    citationLabel: 'Jetson ecosystem prompt',
  },
];

const orinNanoProfile = {
  platform: 'jetson-orin-nano',
  displayName: 'Jetson Orin Nano',
  soc: 'Orin Nano',
  computeUnit: 'GPU (Ampere iGPU)',
  computeTops: 40,
  cpu: '6-core ARM Cortex-A78AE',
  ramGb: 8,
  modelFormat: 'tensorrt',
  diagnosticCommand: 'tegrastats --interval 1 | head -n 5',
  runtimeBasePath: '/usr/src/tensorrt',
  systemPython: '/usr/bin/python3',
  inferLibPackage: 'tensorrt',
  detectionPatterns: ['tegra', 'jetson', 'nvidia orin'],
  limitations: ['JetPack / L4T major versions must match prebuilt wheels and containers.'],
  docBaseUrl: 'https://developer.nvidia.com/embedded/jetson',
  capabilityNotes: [
    'Use `tegrastats` or `jtop` (if installed) for thermals; `nvidia-smi` when GPU stack exposes it.',
    'Align CUDA / TensorRT versions with the installed JetPack per NVIDIA docs.',
  ],
};

const jetsonProfiles = {
  'jetson-orin-nano': orinNanoProfile,
  'jetson-agx-orin': {
    ...orinNanoProfile,
    platform: 'jetson-agx-orin',
    displayName: 'Jetson AGX Orin',
    soc: 'Orin',
    computeTops: 275,
    cpu: '12-core ARM Cortex-A78AE',
    ramGb: 64,
    detectionPatterns: ['tegra', 'jetson', 'agx orin'],
  },
  'jetson-orin-nx': {
    ...orinNanoProfile,
    platform: 'jetson-orin-nx',
    displayName: 'Jetson Orin NX',
    soc: 'Orin NX',
    computeTops: 100,
    cpu: '8-core ARM Cortex-A78AE',
    ramGb: 16,
    detectionPatterns: ['tegra', 'jetson', 'orin nx'],
  },
  'jetson-xavier-nx': {
    ...orinNanoProfile,
    platform: 'jetson-xavier-nx',
    displayName: 'Jetson Xavier NX',
    soc: 'Xavier NX',
    computeUnit: 'GPU (Volta iGPU)',
    computeTops: 21,
    detectionPatterns: ['tegra', 'jetson', 'xavier nx'],
  },
  'jetson-nano': {
    ...orinNanoProfile,
    platform: 'jetson-nano',
    displayName: 'Jetson Nano',
    soc: 'Tegra X1',
    computeUnit: 'GPU (Maxwell iGPU)',
    computeTops: 0.5,
    cpu: 'Quad-core ARM Cortex-A57',
    ramGb: 4,
    detectionPatterns: ['tegra', 'jetson', 'jetson nano'],
  },
};

export const jetsonKnowledgeModuleData: DeviceKnowledgeModuleData & { ecosystemText: string } = {
  manifest: {
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: 'jetson-sbc',
    name: 'NVIDIA Jetson',
    version: '0.1.0',
    origin: 'official',
    family: 'jetson',
    priority: 20,
    compatibility: {
      dmossKnowledgeModule: '^0.3.1',
      minRdkStudio: '1.2.0',
    },
  },
  profiles: jetsonProfiles,
  docs: [
    {
      id: 'jetson-doc-linux-developer-guide',
      title: 'Jetson Linux Developer Guide',
      url: 'https://docs.nvidia.com/jetson/',
      sourceUrl: 'https://docs.nvidia.com/jetson/',
      sourceType: 'official-doc',
      section: 'official',
      tags: ['jetson', 'jetpack', 'l4t'],
      language: 'en',
      status: 'active',
      confidence: 'medium',
      priority: 70,
      lastReviewedAt: SOURCE_RETRIEVED_AT,
      citationLabel: 'Jetson Linux Developer Guide',
      source: {
        type: 'official-doc',
        url: 'https://docs.nvidia.com/jetson/',
        retrievedAt: SOURCE_RETRIEVED_AT,
      },
      scope: JETSON_SCOPE,
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
  ecosystemText: jetsonEcosystemText,
};

export function getJetsonResearchSeeds(): string[] {
  return ['https://developer.nvidia.com/embedded/jetson'];
}
