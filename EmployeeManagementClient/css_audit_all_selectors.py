import os
import re
import datetime
from collections import defaultdict


def analyze_all_css_selectors(start_path='.'):
  """
  Сканирует .css файлы в директории и ее поддиректориях
  для поиска всех уникальных CSS-селекторов и их вхождений,
  игнорируя папку node_modules.
  """
  log_file_name = "css_selector_usage_report.log"

  # Открываем файл для записи логов
  with open(log_file_name, 'w', encoding='utf-8') as log_file:
    def write_output(message, indent=0):
      """Вспомогательная функция для записи в консоль и в файл логов."""
      padded_message = "  " * indent + message
      print(padded_message)
      log_file.write(padded_message + '\n')

    write_output(f"--- Полный отчет по использованию CSS-селекторов ---")
    write_output(f"Дата и время запуска: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    write_output(f"Директория сканирования: {os.path.abspath(start_path)}")
    write_output(f"Игнорируемая папка: node_modules\n")

    css_files = []
    for root, _, files in os.walk(start_path):
      # Игнорируем папку node_modules
      if 'node_modules' in root:
        continue

      for file in files:
        if file.endswith('.css'):
          css_files.append(os.path.join(root, file))

    if not css_files:
      write_output(f"CSS-файлы не найдены в директории: {os.path.abspath(start_path)} (исключая node_modules).")
      return

    write_output(f"Сканирование {len(css_files)} CSS-файлов...\n")

    # Словарь для хранения всех найденных селекторов и мест их появления
    # Ключ: селектор (например, '.my-class')
    # Значение: defaultdict(int) -> {file_path: count}
    selector_occurrences = defaultdict(lambda: defaultdict(int))

    # Регулярное выражение для поиска CSS-правил: Селекторы { ... }
    # Оно захватывает все, что ДО { и все, что внутри {}.
    # Флаг re.DOTALL позволяет . соответствовать переносам строк, что важно для многострочных правил.
    # (?P<selectors>[^{]+?) - нежадный захват селекторов (группа "selectors")
    # \{.*?\} - нежадный захват содержимого блока {}
    css_rule_block_pattern = re.compile(
      r'(?P<selectors>[^{]+?)\s*\{[^}]*?\}', re.DOTALL
    )

    for filepath in css_files:
      relative_path = os.path.relpath(filepath, start_path)
      try:
        with open(filepath, 'r', encoding='utf-8') as f:
          content = f.read()

          # Удаляем все комментарии перед анализом
          content_without_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

          # Находим все блоки правил (селектор { ... })
          matches = css_rule_block_pattern.finditer(content_without_comments)

          for match in matches:
            selectors_raw = match.group('selectors').strip()

            # --- Отладочная информация (раскомментируй, если нужно) ---
            # write_output(f"  [DEBUG] Raw selectors found: '{selectors_raw}' in {relative_path}", indent=1)

            # Игнорируем @-правила (которые могут выглядеть как селекторы)
            if selectors_raw.startswith('@') or not selectors_raw:
              continue

            # Разделяем строку с селекторами на отдельные селекторы по запятой
            # Затем для каждого убираем лишние пробелы и нормализуем
            # Используем более robust split по запятой, которая не внутри скобок (для attribute selectors)
            # (?:[^,()]|\([^)]*\))+
            # Этого все еще может быть недостаточно для очень сложных случаев.
            individual_selectors = []
            current_selector = []
            paren_level = 0  # Уровень вложенности скобок для атрибутов/псевдоклассов
            for char in selectors_raw:
              if char == '(':
                paren_level += 1
              elif char == ')':
                paren_level -= 1
              elif char == ',' and paren_level == 0:
                individual_selectors.append("".join(current_selector).strip())
                current_selector = []
                continue
              current_selector.append(char)
            if current_selector:  # Добавляем последний селектор
              individual_selectors.append("".join(current_selector).strip())

            for s in individual_selectors:
              s = s.strip()
              if s:  # Убедимся, что селектор не пустой
                # Нормализация селектора:
                # 1. Удаляем лишние пробелы
                normalized_selector = re.sub(r'\s+', ' ', s)
                # 2. Удаляем пробелы вокруг комбинаторов (>, +, ~)
                normalized_selector = re.sub(r'\s*([>+~])\s*', r'\1', normalized_selector)
                # 3. Удаляем пробелы вокруг запятых (если они просочились)
                normalized_selector = re.sub(r'\s*,\s*', r',', normalized_selector)
                # 4. Окончательно обрезаем пробелы
                normalized_selector = normalized_selector.strip()

                # --- Отладочная информация (раскомментируй, если нужно) ---
                # if normalized_selector == '.main-content':
                #     write_output(f"    [DEBUG] Found normalized selector: '{normalized_selector}' in {relative_path}", indent=2)

                if normalized_selector:  # Исключаем пустые селекторы после нормализации
                  selector_occurrences[normalized_selector][relative_path] += 1


      except Exception as e:
        write_output(f"Ошибка при чтении файла {relative_path}: {e}", indent=1)

    # --- Отчет ---
    write_output(f"\n--- Использование селекторов по проекту ---\n")

    if not selector_occurrences:
      write_output(
        "Уникальные CSS-селекторы не найдены. Убедитесь, что файлы .css корректны и не содержат только комментарии или пустые правила.")
      write_output("Возможно, регулярное выражение требует доработки для вашего специфического CSS.")
      return

    # Сортируем селекторы: сначала по общему количеству вхождений (по убыванию),
    # затем по имени селектора (по возрастанию) для стабильности.
    sorted_selectors = sorted(
      selector_occurrences.items(),
      key=lambda item: (sum(item[1].values()), item[0]),
      reverse=True
    )

    for selector, files_and_counts in sorted_selectors:
      total_count_for_selector = sum(files_and_counts.values())
      write_output(f"Селектор: '{selector}'")
      write_output(f"  Общее количество вхождений: {total_count_for_selector}", indent=1)
      write_output(f"  Найден в {len(files_and_counts)} файлах:", indent=1)

      # Сортируем файлы, где найден селектор, по количеству вхождений в них
      sorted_files_for_selector = sorted(files_and_counts.items(), key=lambda item: item[1], reverse=True)
      for file_path, count in sorted_files_for_selector:
        write_output(f"    - {file_path}: {count} раз(а)", indent=2)
      write_output("-" * 80 + "\n")  # Разделитель для читаемости

    write_output("\n--- Анализ завершен ---")
    write_output("Примечание: Скрипт использует регулярные выражения для извлечения селекторов.")
    write_output(
      "Хотя он стал точнее, для 100% корректной обработки всех возможных валидных и невалидных CSS-конструкций (например, очень сложные вложенные правила, CSS-переменные в селекторах, или SCSS-специфичные фичи) рекомендуется использовать полноценный CSS-парсер (например, `cssutils` для Python, или инструменты на Node.js).")


if __name__ == "__main__":
  # Директория сканирования.
  # '.' означает текущую директорию (откуда запускаете скрипт),
  # включая все ее подпапки, но игнорируя 'node_modules'.
  scan_directory = '.'

  analyze_all_css_selectors(scan_directory)
