---
title: TVLCOM 项目介绍（python版）
published: 2025-11-26
updated: 2025-11-26
description: '介绍基于 TLV 帧格式的轻量通信框架 TVLCOM。'
image: ''
tags: [Demo, python, TVLCOM]
category: 'Examples'
draft: false
---

# TVLCOM：基于 TLV 帧格式的轻量通信框架

这篇文章来介绍 **TVLCOM**——一个用 Python 实现的、基于自定义帧结构 + TLV（Type-Length-Value）的轻量通信框架，适合上位机与嵌入式设备之间进行串口通信、命令/数据交互和自定义控制协议。

::github{repo="UF4OVER/TVLCOM"}

## 项目亮点

:::tip[为什么选择 TVLCOM?]
- 固定帧格式（Header + FrameID + TLV 数据 + CRC16 + Tail）
- TLV 构造与解析工具，扩展类型方便
- 字节流解析状态机，适合串口等流式链路
- 回调分发器（Dispatcher），带 ACK/NACK 机制
- 传输层可插拔（内置串口，易扩展为 TCP/UDP 等）
  :::

> [!IMPORTANT]
> 如果你的场景需要一个“既简单、又可靠、还容易扩展”的轻量通信协议，TVLCOM 会很合适。

## 快速开始

:::note[环境准备]
- Python >= 3.10
- Windows / Linux / macOS 均可（以 Windows 串口为主要测试场景）
- 依赖：pyserial
  :::

```powershell
# 进入项目目录
cd E:\PROJECT_Python\TVLCOM

# 创建虚拟环境（可选）
python -m venv .venv
.\.venv\Scripts\activate

# 安装依赖（可编辑模式开发）
pip install -e .
```

:::caution[串口端口号]
请根据实际情况修改示例代码中的串口端口号（例如 `COM3` 更换为你的实际端口）。
:::

### 运行示例程序

```powershell
cd E:\PROJECT_Python\TVLCOM
python main.py
```

> [!TIP]
> 终端会周期性打印发送帧的日志；如果设备正确回包或做了回环测试，会看到对应的回调打印（字符串、命令、自定义类型等）。

## 基本用法示例

:::important[发送一帧字符串 + 命令]
```python
from PYTVLCOM import (
    Dispatcher,
    TLVParser,
    FrameDefine,
    create_transport,
    createStringEntry,
    createCtrlCmdEntry,
    buildFrame,
)

transport = create_transport("serial", port="COM3", baud=115200, timeout=0.1)

dispatcher = Dispatcher(transport)
parser = TLVParser(dispatcher.handleFrame, on_error=print)

@dispatcher.type_handler(FrameDefine.TLV_TYPE_STRING)
def on_string(value_bytes: bytes):
    print("收到字符串:", value_bytes.decode("utf-8", errors="ignore"))
    return True

@dispatcher.cmd_handler(0x10)
def on_cmd_0x10():
    print("收到命令 0x10")
    return True

str_tlv = createStringEntry("hello TVLCOM")
cmd_tlv = createCtrlCmdEntry(0x10)
payload = cmd_tlv + str_tlv

frame = buildFrame(0x01, payload)
transport.send(frame)

# 简单接收循环（示意）
while True:
    data = transport.feed(1024)
    for b in data:
        parser.process_byte(b)
```
:::

### 只用作帧构造工具

```python
from PYTVLCOM import buildFrame, createInt32Entry, createStringEntry, FrameDefine

tlv1 = createInt32Entry(FrameDefine.TLV_TYPE_INTEGER, 42)
tlv2 = createStringEntry("parameter updated")

payload = tlv1 + tlv2
frame = buildFrame(0x02, payload)

your_send_function(frame)  # 将 frame 发送到你自己的链路
```

## 协议与帧格式（速览）

:::note[固定帧结构]
| 字段顺序 | 长度 | 描述 |
|----------|------|------|
| Header   | 2B   | 固定 0xF0 0x0F 用于同步 |
| FrameID  | 1B   | 帧编号/逻辑会话 ID |
| DataLen  | 1B   | TLV 数据区总字节长度 |
| Data     | N    | 若干 TLV 串接 |
| CRC16    | 2B   | 对 FrameID + DataLen + Data 做 CCITT(0x1021, init=0xFFFF)，**大端** |
| Tail     | 2B   | 固定 0xE0 0x0D 结束标记 |
:::

### TLV 类型（内置）
- `0x01` 控制命令（1 字节命令码）
- `0x02` 32 位整数（4 字节，小端）
- `0x03` UTF-8 字符串
- `0x08` ACK
- `0x09` NACK

> [!NOTE]
> DataLen 最大 240（参见 `FrameDefine.TLV_MAX_DATA_LENGTH`）。

## 进阶话题

:::tip[扩展传输层]
实现你自己的 `Transport`（TCP/UDP/CAN 等），并通过 `@register_transport('your_name')` 注册，然后用 `create_transport('your_name', ...)` 统一创建实例。
:::

:::warning[CRC 不匹配如何排查]
- 两端必须使用相同的 CRC16-CCITT 参数（多项式 0x1021、初值 0xFFFF）。
- 计算范围为 `FrameID + DataLen + Data`，并以大端序写入结果。
  :::

## 更多信息（隐藏彩蛋）

:spoiler[TLV 解析要点：循环读取 Data，每次取 `[type, len, value]` 并校验越界与长度一致性；任意阶段出现错误应回退到 SYNC。]

## 结语

TVLCOM 力求在“简单”与“可用”之间取得平衡，用统一帧格式与 TLV 表达常用的数据与命令场景，同时提供解析与分发工具，减少你在上位机/设备端的协议实现负担。欢迎基于此扩展更多 TLV 类型与传输方式。
