#!/usr/bin/env python3
"""Generate simple PNG app icons without third-party dependencies."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
BG = (239, 232, 219, 255)
INK = (43, 38, 34, 255)
LINE = (215, 207, 194, 255)
BOARD = (255, 253, 248, 255)
ACCENT = (30, 86, 196, 255)


def png(width: int, height: int, pixels: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = b""
    stride = width * 4
    for y in range(height):
        raw += b"\x00" + pixels[y * stride : (y + 1) * stride]
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def draw_icon(size: int) -> bytes:
    pixels = bytearray(size * size * 4)
    radius = int(size * 0.18)

    def set_px(x: int, y: int, color: tuple[int, int, int, int]) -> None:
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4
            pixels[i : i + 4] = bytes(color)

    def in_rounded_rect(x: int, y: int, x0: int, y0: int, x1: int, y1: int, r: int) -> bool:
        if x < x0 or x > x1 or y < y0 or y > y1:
            return False
        cx = x0 + r if x < x0 + r else x1 - r if x > x1 - r else x
        cy = y0 + r if y < y0 + r else y1 - r if y > y1 - r else y
        if cx == x or cy == y:
            return True
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

    for y in range(size):
        for x in range(size):
            set_px(x, y, BG if in_rounded_rect(x, y, 0, 0, size - 1, size - 1, radius) else (0, 0, 0, 0))

    pad = int(size * 0.16)
    inner = size - pad * 2
    board_r = max(2, int(size * 0.04))
    for y in range(pad, size - pad):
        for x in range(pad, size - pad):
            if in_rounded_rect(x, y, pad, pad, size - pad - 1, size - pad - 1, board_r):
                set_px(x, y, BOARD)

    # grid lines
    stroke = max(2, size // 64)
    thick = max(3, size // 32)
    for i in range(10):
        pos = pad + int(inner * i / 9)
        weight = thick if i % 3 == 0 else stroke
        color = INK if i % 3 == 0 else LINE
        for y in range(pad, size - pad):
            for w in range(weight):
                set_px(pos + w, y, color)
        for x in range(pad, size - pad):
            for w in range(weight):
                set_px(x, pos + w, color)

    # filled center-ish cell with a "9" block
    cell = inner / 9
    col, row = 5, 3
    x0 = int(pad + cell * col + cell * 0.18)
    y0 = int(pad + cell * row + cell * 0.18)
    x1 = int(pad + cell * (col + 1) - cell * 0.18)
    y1 = int(pad + cell * (row + 1) - cell * 0.18)
    for y in range(y0, y1):
        for x in range(x0, x1):
            set_px(x, y, ACCENT)

    return png(size, size, bytes(pixels))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "icon-192.png").write_bytes(draw_icon(192))
    (OUT / "icon-512.png").write_bytes(draw_icon(512))
    (OUT / "apple-touch-icon.png").write_bytes(draw_icon(180))
    print(f"wrote icons in {OUT}")


if __name__ == "__main__":
    main()
