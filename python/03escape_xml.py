# escape_xml.py

import json
import html

def escape_xml_in_data(data):
    """
    递归遍历一个数据结构（字典或列表），并对所有字符串值进行XML/HTML转义。

    Args:
        data: 输入的数据，可以是字典、列表、字符串或其他基本类型。

    Returns:
        一个新的、经过处理的数据结构。
    """
    if isinstance(data, dict):
        # 如果是字典，递归处理它的每个值
        return {key: escape_xml_in_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        # 如果是列表，递归处理它的每个元素
        return [escape_xml_in_data(item) for item in data]
    elif isinstance(data, str):
        # 如果是字符串，使用 html.escape() 进行转义
        return html.escape(data)
    else:
        # 对于其他类型（如数字、布尔值、None），保持原样
        return data

def process_json_file(input_file, output_file):
    """
    读取一个JSON文件，将其内容中的XML标签转义，然后写入到新的JSON文件中。

    Args:
        input_file (str): 输入的JSON文件名。
        output_file (str): 输出的JSON文件名。
    """
    try:
        # 以UTF-8编码读取输入的JSON文件
        print(f"正在读取文件: '{input_file}'...")
        with open(input_file, 'r', encoding='utf-8') as f:
            original_data = json.load(f)

        # 递归处理数据，转义XML标签
        print("正在转义XML/HTML标签...")
        escaped_data = escape_xml_in_data(original_data)

        # 将处理后的数据以UTF-8编码写入到输出文件
        # indent=2 用于格式化输出，使其易于阅读
        # ensure_ascii=False 用于确保中文字符能正确显示，而不是被转义成 \\uXXXX
        print(f"正在将结果写入文件: '{output_file}'...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(escaped_data, f, indent=2, ensure_ascii=False)

        print("\n处理完成！")
        print(f"原始文件: '{input_file}'")
        print(f"转义后的文件: '{output_file}'")

    except FileNotFoundError:
        print(f"错误: 文件 '{input_file}' 未找到。请确保文件与脚本在同一目录下。")
    except json.JSONDecodeError:
        print(f"错误: 无法解析 '{input_file}' 中的JSON数据，请检查文件格式是否正确。")
    except Exception as e:
        print(f"发生未知错误: {e}")

# --- 主程序执行 ---
if __name__ == "__main__":
    input_filename = "springboot.json"
    output_filename = "springboot_escaped.json"
    process_json_file(input_filename, output_filename)