# GPIO / 外设命令

> 来源:整理自 D-Robotics RDK 官方文档、工具链与社区实践,逐条保留出处链接;由 device-knowledge 知识库忠实转换而来,未改写技术事实。

## GPIO 相关命令

| 命令模式 | 说明 | 风险 | 适用板型 |
| --- | --- | --- | --- |
| `i2cdetect\|i2cget\|i2cset` | I2C bus detection/read/write | moderate | x3/x5/ultra/s100/s100p |
| `spidev_test` | SPI loopback test | moderate | x3/x5/ultra/s100/s100p |
| `gpio` | GPIO pin control | moderate | x3/x5/ultra/s100/s100p |
| `cat\s+\/sys\/kernel\/debug\/pinctrl` | Pin mux status query | safe | x3/x5/ultra/s100/s100p |
