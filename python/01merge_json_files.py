import json
import os

def merge_json_files(input_prefix="", num_files=10, output_filename="linux.json"):
    """
    合并多个JSON文件为一个JSON文件。
    每个输入文件应包含一个JSON数组。
    """
    merged_data = []

    print(f"开始合并JSON文件到 {output_filename}...")

    for i in range(1, num_files + 1):
        # 构造文件名，例如 "linux_part_01.json", "linux_part_02.json"
        # 确保文件名与您实际输出的格式匹配，如果只是 1.json, 2.json，需要调整
        filename = f"{input_prefix}{i:02d}.json" # ':02d' 格式化为两位数字，前面补零

        # 如果您的文件名是 "01.json", "02.json" 这种形式
        # filename = f"{i:02d}.json"

        # 如果您的文件名是 "linux_01.json", "linux_02.json" 这种形式
        # filename = f"linux_{i:02d}.json"

        if not os.path.exists(filename):
            print(f"警告: 文件 {filename} 不存在，跳过。")
            continue

        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    merged_data.extend(data)
                else:
                    print(f"警告: 文件 {filename} 的根元素不是JSON数组，跳过其内容。")
        except json.JSONDecodeError as e:
            print(f"错误: 解析文件 {filename} 失败: {e}")
        except Exception as e:
            print(f"读取文件 {filename} 时发生未知错误: {e}")

    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2, ensure_ascii=False)
        print(f"成功合并 {len(merged_data)} 条命令到 {output_filename}。")
    except Exception as e:
        print(f"写入合并文件 {output_filename} 失败: {e}")

if __name__ == "__main__":
    # 假设您的文件命名约定是 linux_part_01.json, linux_part_02.json ...
    # 如果您的文件命名是 01.json, 02.json 等，请修改 input_prefix 或直接使用 ""
    # 或者如果文件都在当前目录，没有前缀，请设置 input_prefix=""
    # 例如，如果您将文件命名为 01.json, 02.json ...
    # merge_json_files(input_prefix="", num_files=10, output_filename="linux.json")

    # 示例调用 (请根据您实际的文件名调整 input_prefix 和 num_files)
    # 假设你的文件是 01.json, 02.json, ..., 10.json
    merge_json_files(input_prefix="", num_files=10, output_filename="linux.json")

    # 如果你的文件是 linux_01.json, linux_02.json, ...
    # merge_json_files(input_prefix="linux_", num_files=10, output_filename="linux.json")

    # 如果你的文件是 custom_01.json, custom_02.json, ...
    # merge_json_files(input_prefix="custom_", num_files=10, output_filename="linux.json")