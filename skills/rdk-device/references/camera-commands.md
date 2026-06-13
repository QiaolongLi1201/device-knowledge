# RDK 摄像头命令

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

## 摄像头相关命令

| 命令模式 | 说明 | 风险 | 适用板型 |
| --- | --- | --- | --- |
| `v4l2-ctl` | V4L2 camera control / capability query | safe | x3/x5/ultra/s100/s100p |
| `lsusb` | USB device enumeration (camera detection) | safe | x3/x5/ultra/s100/s100p |
| `ls\s+\/dev\/video` | Camera device file listing | safe | x3/x5/ultra/s100/s100p |
