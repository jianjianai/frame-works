# 交付响度调整

Frame 原始导出保留不变，交付版通过 FFmpeg 两遍响度调整，视频流直接复制。目标 -16 LUFS、-1.8 dBTP；实测 -16.17 LUFS、-1.62 dBTP。下面的 Python 脚本接受三个参数：原始 MP4、输出 MP4、测量 JSON 路径。

```python
"""Normalize a completed Frame export; copy the rendered video unchanged."""
import json
import re
import subprocess
import sys
import uuid
from pathlib import Path


def measure(stderr):
    blocks = re.findall(r'\{\s*"input_i"[^{}]+\}', stderr)
    if not blocks:
        raise RuntimeError('FFmpeg did not return a loudness report')
    return json.loads(blocks[-1])


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-4000:])
    return result


def main():
    source, destination, report = map(lambda p: Path(p).resolve(), sys.argv[1:])
    if destination.exists():
        raise RuntimeError('Delivery already exists; choose a new destination')
    target = 'I=-16:TP=-1.8:LRA=8'
    initial = measure(run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(source),
                           '-vn', '-af', 'loudnorm=' + target + ':print_format=json',
                           '-f', 'null', '-']).stderr)
    correction = ':'.join(['loudnorm=' + target,
        'measured_I=' + initial['input_i'], 'measured_TP=' + initial['input_tp'],
        'measured_LRA=' + initial['input_lra'], 'measured_thresh=' + initial['input_thresh'],
        'offset=' + initial['target_offset'], 'linear=true', 'print_format=json'])
    temporary = destination.with_name(destination.stem + '-' + uuid.uuid4().hex + '.part.mp4')
    encoded = measure(run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(source),
        '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'copy', '-af', correction,
        '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
        str(temporary)]).stderr)
    final = measure(run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(temporary),
                         '-vn', '-af', 'loudnorm=' + target + ':print_format=json',
                         '-f', 'null', '-']).stderr)
    temporary.replace(destination)
    result = {'source': str(source), 'delivery': str(destination),
              'target': {'integratedLufs': -16, 'truePeakDbtp': -1.8, 'lra': 8},
              'input': initial, 'encoding': encoded, 'deliveryMeasurement': final,
              'video': 'stream copy; no video re-encoding'}
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({'delivery': str(destination), 'integratedLufs': final['input_i'],
                      'truePeakDbtp': final['input_tp'], 'lra': final['input_lra']}))


if __name__ == '__main__':
    main()
```
