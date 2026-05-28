/**
 * RDK 知识模块背书的核心技能清单。
 *
 * 这里只**声明**技能归属（ID 列表），SKILL.md 文件本体仍由宿主
 * （RDK Studio / D-Moss Agent）从 `<workspace>/skills/**` 扫描。
 *
 * 这些 ID 与 `skills/**` 下的目录名一一对应；`SkillRegistry` 解析别名时
 * 会同时考虑目录名和 frontmatter `name`（都会小写后比较）。
 *
 * 分两档：
 *  - **最小集**（`priority: 80`）：建立 RDK 语境/硬件常识的三件套，
 *    对于所有 RDK 任务都应优先呈现。
 *  - **扩展集**（`priority: 70`）：设备/板端委派/工具链桥接/ROS，
 *    在具体任务中作为高权重候选；略低于最小集以避免总是顶到最前。
 */

interface EndorsedSkillRef {
  id: string;
  category?: string;
  platforms?: readonly string[];
  priority?: number;
}

const RDK_PLATFORMS = ['rdk-x3', 'rdk-x5', 'rdk-ultra', 'rdk-s100', 'rdk-s100p'];

export const RDK_ENDORSED_SKILLS: ReadonlyArray<EndorsedSkillRef> = [
  {
    id: 'rdk-ecosystem',
    category: 'ecosystem',
    platforms: RDK_PLATFORMS,
    priority: 80,
  },
  {
    id: 'rdk-hardware',
    category: 'hardware',
    platforms: RDK_PLATFORMS,
    priority: 80,
  },
  {
    id: 'rdk-board-knowledge',
    category: 'hardware',
    platforms: RDK_PLATFORMS,
    priority: 80,
  },

  {
    id: 'rdk-device',
    category: 'device-control',
    platforms: RDK_PLATFORMS,
    priority: 70,
  },
  {
    id: 'rdk-board-delegate',
    category: 'collaboration',
    platforms: RDK_PLATFORMS,
    priority: 70,
  },
  {
    id: 'rdk-openclaw-bridge',
    category: 'integration',
    platforms: RDK_PLATFORMS,
    priority: 70,
  },
  {
    id: 'rdk-ros',
    category: 'ros-ecosystem',
    platforms: RDK_PLATFORMS,
    priority: 70,
  },
  {
    id: 'rdk-peripheral-cookbook',
    category: 'hardware',
    platforms: RDK_PLATFORMS,
    priority: 70,
  },
];
