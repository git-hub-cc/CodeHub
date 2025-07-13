# 脚本文件名: create_files_pro.py

import os
import json

# 定义一个存放输出文件的目录名
output_dir = "json_files"

# 创建目录，如果它不存在的话
# exist_ok=True 表示如果目录已存在，则不会报错
os.makedirs(output_dir, exist_ok=True)

# 循环从 1 到 40
for i in range(1, 41):
    # 格式化文件名
    filename = f"{i:02d}.json"

    # 使用 os.path.join 来构建跨平台兼容的文件路径
    file_path = os.path.join(output_dir, filename)

    # 定义一个空的Python字典，它将转换为空的JSON对象
    empty_data = {}

    # 使用 'w' 模式打开文件，并指定编码为 utf-8，这是处理JSON的标准做法
    with open(file_path, 'w', encoding='utf-8') as f:
        # 使用 json.dump() 将Python对象（字典）写入文件
        # 这是生成JSON文件的首选方法，因为它能处理更复杂的数据并确保格式正确
        json.dump(empty_data, f)

    print(f"已在 '{output_dir}/' 目录下创建文件: {filename}")

print(f"\n所有文件在目录 '{output_dir}' 中创建完成！")