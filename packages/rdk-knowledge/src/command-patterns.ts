/**
 * RDK Command Patterns — command semantics for tool execution analysis.
 *
 * Each pattern tells the Agent what a command does and its risk level,
 * enabling smarter tool-call decisions (e.g. requiring confirmation for dangerous ops).
 */

interface CommandPattern {
  pattern: RegExp;
  category: string;
  description: string;
  riskLevel: 'safe' | 'moderate' | 'dangerous';
}

export const RDK_COMMAND_PATTERNS: CommandPattern[] = [
  // ── diagnostics ──────────────────────────────────────────────────
  { pattern: /^hrut_bpuprofile(\s|$)/i,              category: 'diagnostics', description: 'BPU profiling tool (X5/Ultra; use -b 0 to select bpu0)',                                          riskLevel: 'safe' },
  { pattern: /cat\s+\/sys\/devices\/system\/bpu\/bpu\d+\/ratio/i,   category: 'diagnostics', description: 'BPU utilization via sysfs (universal across all RDK boards, recommended fallback)', riskLevel: 'safe' },
  { pattern: /cat\s+\/sys\/devices\/system\/bpu\/bpu\d+\/devfreq/i, category: 'diagnostics', description: 'BPU current frequency via sysfs (universal)',                                       riskLevel: 'safe' },
  { pattern: /^hrut_smi$/i,                          category: 'diagnostics', description: 'BPU utilization monitor (X3 only; NOT installed on RDK X5 — use hrut_bpuprofile or sysfs instead)', riskLevel: 'safe' },
  { pattern: /^bputop$/i,                            category: 'diagnostics', description: 'BPU load top-like view (X3/Ultra only; NOT installed on RDK X5 — use hrut_bpuprofile or sysfs)',    riskLevel: 'safe' },
  { pattern: /^hrut_count$/i,                        category: 'diagnostics', description: 'BPU inference counter',                                                                            riskLevel: 'safe' },
  { pattern: /^hrut_somstatus$/i,                    category: 'diagnostics', description: 'SoC status (temperature, voltage, clock) — universal across all RDK boards',                       riskLevel: 'safe' },
  { pattern: /cat\s+\/sys\/devices\/virtual\/thermal/i, category: 'diagnostics', description: 'CPU/BPU thermal zone reading',                                                                  riskLevel: 'safe' },
  { pattern: /cat\s+\/sys\/class\/socinfo/i,         category: 'diagnostics', description: 'SoC identification (board_id, chip_id)',     riskLevel: 'safe' },
  { pattern: /free\s+-[hm]/i,                        category: 'diagnostics', description: 'Memory usage',                              riskLevel: 'safe' },
  { pattern: /df\s+-[hT]/i,                          category: 'diagnostics', description: 'Disk space usage',                          riskLevel: 'safe' },
  { pattern: /dmesg/i,                               category: 'diagnostics', description: 'Kernel ring buffer (hardware/driver logs)',  riskLevel: 'safe' },
  { pattern: /journalctl/i,                          category: 'diagnostics', description: 'Systemd journal logs',                      riskLevel: 'safe' },
  { pattern: /\btop\s|htop/i,                          category: 'diagnostics', description: 'Process/CPU monitor',                       riskLevel: 'safe' },

  // ── ROS2 / TROS ─────────────────────────────────────────────────
  { pattern: /ros2\s+launch/i,    category: 'ros', description: 'ROS2 launch file execution',     riskLevel: 'moderate' },
  { pattern: /ros2\s+run/i,       category: 'ros', description: 'ROS2 run single node',           riskLevel: 'moderate' },
  { pattern: /ros2\s+topic/i,     category: 'ros', description: 'ROS2 topic inspection',          riskLevel: 'safe' },
  { pattern: /ros2\s+node/i,      category: 'ros', description: 'ROS2 node inspection',           riskLevel: 'safe' },
  { pattern: /ros2\s+param/i,     category: 'ros', description: 'ROS2 parameter query/set',       riskLevel: 'safe' },
  { pattern: /ros2\s+service/i,   category: 'ros', description: 'ROS2 service call/list',         riskLevel: 'safe' },
  { pattern: /ros2\s+action/i,    category: 'ros', description: 'ROS2 action send goal / list',   riskLevel: 'safe' },
  { pattern: /ros2\s+pkg/i,       category: 'ros', description: 'ROS2 package query',             riskLevel: 'safe' },
  { pattern: /ros2\s+interface/i, category: 'ros', description: 'ROS2 interface (msg/srv) show',  riskLevel: 'safe' },
  { pattern: /ros2\s+bag/i,       category: 'ros', description: 'ROS2 bag record/play',           riskLevel: 'moderate' },
  { pattern: /source\s+\/opt\/tros/i, category: 'ros', description: 'TROS environment setup',     riskLevel: 'safe' },
  { pattern: /colcon\s+build/i,   category: 'ros', description: 'ROS2 workspace build',           riskLevel: 'moderate' },
  { pattern: /rosdep\s+install/i, category: 'ros', description: 'ROS2 dependency install',        riskLevel: 'moderate' },

  // ── camera ───────────────────────────────────────────────────────
  { pattern: /v4l2-ctl/i,         category: 'camera', description: 'V4L2 camera control / capability query', riskLevel: 'safe' },
  { pattern: /lsusb/i,            category: 'camera', description: 'USB device enumeration (camera detection)', riskLevel: 'safe' },
  { pattern: /ls\s+\/dev\/video/i, category: 'camera', description: 'Camera device file listing',              riskLevel: 'safe' },

  // ── BPU toolchain ────────────────────────────────────────────────
  { pattern: /hbdk/i,              category: 'toolchain', description: 'BPU model compilation toolchain (Horizon)',   riskLevel: 'moderate' },
  { pattern: /hb_mapper/i,        category: 'toolchain', description: 'ONNX→BIN model conversion',                   riskLevel: 'moderate' },
  { pattern: /hb_eval_perf/i,     category: 'toolchain', description: 'BPU model performance evaluation',            riskLevel: 'safe' },
  { pattern: /hb_model_modifier/i, category: 'toolchain', description: 'Compiled model inspection/modification',     riskLevel: 'moderate' },
  { pattern: /hrt_model_exec/i,   category: 'toolchain', description: 'Run inference on compiled model',             riskLevel: 'safe' },

  // ── package management ───────────────────────────────────────────
  { pattern: /\bapt(?:-get)?\s+(install|update|upgrade|remove|purge)/i, category: 'package', description: 'APT package management',  riskLevel: 'moderate' },
  { pattern: /pip3?\s+install/i,   category: 'package', description: 'Python package install',       riskLevel: 'moderate' },
  { pattern: /npm\s+install/i,     category: 'package', description: 'Node.js package install',      riskLevel: 'moderate' },

  // ── system ───────────────────────────────────────────────────────
  { pattern: /systemctl\s+(start|stop|restart|enable|disable|status)/i, category: 'system', description: 'Systemd service management', riskLevel: 'moderate' },
  { pattern: /nmcli/i,            category: 'network', description: 'NetworkManager CLI (WiFi/ethernet)',  riskLevel: 'moderate' },
  { pattern: /ip\s+(addr|link|route)/i, category: 'network', description: 'IP address/routing query',     riskLevel: 'safe' },

  // ── GPIO / I2C / SPI ─────────────────────────────────────────────
  { pattern: /i2cdetect|i2cget|i2cset/i, category: 'gpio', description: 'I2C bus detection/read/write', riskLevel: 'moderate' },
  { pattern: /spidev_test/i,             category: 'gpio', description: 'SPI loopback test',            riskLevel: 'moderate' },
  { pattern: /gpio/i,                    category: 'gpio', description: 'GPIO pin control',             riskLevel: 'moderate' },
  { pattern: /cat\s+\/sys\/kernel\/debug\/pinctrl/i, category: 'gpio', description: 'Pin mux status query', riskLevel: 'safe' },

  // ── Docker ───────────────────────────────────────────────────────
  { pattern: /docker\s+(run|exec|build|compose)/i, category: 'container', description: 'Docker container management', riskLevel: 'moderate' },

  // ── kernel / driver development ──────────────────────────────────
  { pattern: /make\s+-C\s+\/lib\/modules\/[^ ]+\/build\s+M=/i, category: 'system', description: 'Out-of-tree kernel module build in workspace', riskLevel: 'moderate' },
  { pattern: /apt(?:-get)?\s+install\b.*linux-headers/i, category: 'package', description: 'Kernel headers for driver build (does not install a boot kernel)', riskLevel: 'moderate' },
  { pattern: /\b(insmod|rmmod|modprobe)\b/i, category: 'system', description: 'Temporary kernel module load/unload; runtime risk but not persistent by itself', riskLevel: 'moderate' },

  // ── destructive (require confirmation) ───────────────────────────
  { pattern: /dd\s+if=/i,          category: 'system', description: 'Raw disk write (dd)',        riskLevel: 'dangerous' },
  { pattern: /mkfs/i,              category: 'system', description: 'Filesystem format',          riskLevel: 'dangerous' },
  { pattern: /rm\s+-rf?\s+\//i,    category: 'system', description: 'Recursive root delete',      riskLevel: 'dangerous' },
  { pattern: /fdisk|parted/i,      category: 'system', description: 'Partition table modification', riskLevel: 'dangerous' },
  { pattern: /flashcp|flash_erase/i, category: 'system', description: 'Flash memory write/erase', riskLevel: 'dangerous' },
  { pattern: /make\b.*modules_install|depmod\b/i, category: 'system', description: 'Kernel module installation / dependency index mutation', riskLevel: 'dangerous' },
  { pattern: /update-initramfs|mkinitramfs|dracut|rdk-miniboot-update|hbupdate|u-boot-update|fw_setenv/i, category: 'system', description: 'Boot chain / initramfs / bootloader mutation', riskLevel: 'dangerous' },
  { pattern: /(?:cp|mv|install|rsync|tee|sed\s+-i|rm|chmod|chown|>|>>).*(?:\/boot|\/lib\/modules|\/etc\/(fstab|modules|modules-load\.d|modprobe\.d))/i, category: 'system', description: 'Boot or kernel module path write', riskLevel: 'dangerous' },
];
