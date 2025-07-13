import json

def transform_k8s_json(input_filepath: str, output_filepath: str):
    """
    读取一个 JSON 文件，将 'examples' 字段的内容转换为 Markdown 格式，
    追加到 'notes' 字段，然后删除 'examples' 字段。

    Args:
        input_filepath (str): 输入的 JSON 文件路径。
        output_filepath (str): 输出的 JSON 文件路径。
    """
    try:
        # 以 UTF-8 编码读取 JSON 文件
        with open(input_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 遍历 JSON 数组中的每个对象
        for item in data:
            # 检查 'examples' 字段是否存在且不为空
            if 'examples' in item and item['examples']:
                # 创建一个列表来存放格式化后的 Markdown 示例
                markdown_examples = []
                for example in item['examples']:
                    description = example.get('description', '')
                    code = example.get('code', '')

                    # 将每个示例格式化为 "描述\n```shell\n代码\n```" 的形式
                    formatted_example = f"{description}\n```shell\n{code}\n```"
                    markdown_examples.append(formatted_example)

                # 用两个换行符连接所有示例，形成一个完整的 Markdown 字符串
                examples_as_markdown = "\n\n".join(markdown_examples)

                # 获取原始的 notes 内容
                original_notes = item.get('notes', '')

                # 准备新的 notes 内容
                # 如果原始 notes 不为空，则先添加两个换行符
                separator = "\n\n" if original_notes else ""
                header = "### 示例 \n\n"

                # 将格式化后的示例追加到原始 notes 的末尾
                item['notes'] = original_notes + separator + header + examples_as_markdown

                # 删除原始的 'examples' 字段
                del item['examples']

        # 将修改后的数据写入新文件
        with open(output_filepath, 'w', encoding='utf-8') as f:
            # 使用 indent=2 美化输出, ensure_ascii=False 以正确显示中文
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"处理完成！已将修改后的内容保存到 '{output_filepath}'。")

    except FileNotFoundError:
        print(f"错误：找不到文件 '{input_filepath}'。")
    except json.JSONDecodeError:
        print(f"错误：文件 '{input_filepath}' 不是有效的 JSON 格式。")
    except Exception as e:
        print(f"发生未知错误: {e}")

if __name__ == "__main__":
    # 定义输入和输出文件名
    input_file = 'k8s.json'
    output_file = 'k8s_modified.json'

    # 执行转换
    transform_k8s_json(input_file, output_file)