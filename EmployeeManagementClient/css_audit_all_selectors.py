import os
import re
import datetime
from collections import defaultdict


def analyze_all_css_selectors(start_path='.'):
    """
    Сканирует .css файлы в директории и ее поддиректориях
    для поиска всех уникальных CSS-селекторов и их вхождений,
    игнорируя папку node_modules и styles.css. Сравнивает файлы с наибольшим количеством
    вхождений, добавляет совпадающие правила в styles.css и удаляет их из исходных файлов.
    """
    log_file_name = "css_selector_usage_report.log"
    styles_css_path = os.path.join(start_path, 'styles.css')

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
        write_output(f"Игнорируемые папки и файлы: node_modules, styles.css\n")

        css_files = []
        for root, _, files in os.walk(start_path):
            if 'node_modules' in root:
                continue
            for file in files:
                if file.endswith('.css') and os.path.join(root, file) != styles_css_path:
                    css_files.append(os.path.join(root, file))

        if not css_files:
            write_output(f"CSS-файлы не найдены в директории: {os.path.abspath(start_path)} (исключая node_modules и styles.css).")
            return

        write_output(f"Сканирование {len(css_files)} CSS-файлов...\n")

        # Словарь для хранения всех найденных селекторов и мест их появления
        selector_occurrences = defaultdict(lambda: defaultdict(int))
        # Словарь для хранения содержимого правил для каждого селектора в каждом файле
        selector_rules = defaultdict(lambda: defaultdict(str))
        # Словарь для хранения полного текста правила (селектор + содержимое) для удаления
        selector_full_rules = defaultdict(lambda: defaultdict(list))

        # Регулярное выражение для CSS-правил
        css_rule_block_pattern = re.compile(
            r'(?P<selectors>[^{]+?)\s*\{(?P<content>[^}]*?)\}', re.DOTALL
        )

        for filepath in css_files:
            relative_path = os.path.relpath(filepath, start_path)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    content_without_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
                    matches = css_rule_block_pattern.finditer(content_without_comments)

                    for match in matches:
                        selectors_raw = match.group('selectors').strip()
                        rule_content = match.group('content').strip()
                        full_rule = match.group(0)  # Полное правило (селектор + содержимое)

                        if selectors_raw.startswith('@') or not selectors_raw:
                            continue

                        individual_selectors = []
                        current_selector = []
                        paren_level = 0
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
                        if current_selector:
                            individual_selectors.append("".join(current_selector).strip())

                        for s in individual_selectors:
                            s = s.strip()
                            if s:
                                normalized_selector = re.sub(r'\s+', ' ', s)
                                normalized_selector = re.sub(r'\s*([>+~])\s*', r'\1', normalized_selector)
                                normalized_selector = re.sub(r'\s*,\s*', r',', normalized_selector)
                                normalized_selector = normalized_selector.strip()

                                if normalized_selector:
                                    selector_occurrences[normalized_selector][relative_path] += 1
                                    selector_rules[normalized_selector][relative_path] = rule_content
                                    selector_full_rules[normalized_selector][relative_path].append(full_rule)

            except Exception as e:
                write_output(f"Ошибка при чтении файла {relative_path}: {e}", indent=1)

        # --- Сравнение и перенос в styles.css ---
        write_output(f"\n--- Сравнение и перенос общих CSS-правил в styles.css ---\n")

        # Читаем содержимое styles.css для проверки существующих селекторов
        styles_css_selectors = set()
        try:
            if os.path.exists(styles_css_path):
                with open(styles_css_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    content_without_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
                    matches = css_rule_block_pattern.finditer(content_without_comments)
                    for match in matches:
                        selectors_raw = match.group('selectors').strip()
                        if selectors_raw.startswith('@'):
                            continue
                        individual_selectors = []
                        current_selector = []
                        paren_level = 0
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
                        if current_selector:
                            individual_selectors.append("".join(current_selector).strip())

                        for s in individual_selectors:
                            s = s.strip()
                            if s:
                                normalized_selector = re.sub(r'\s+', ' ', s)
                                normalized_selector = re.sub(r'\s*([>+~])\s*', r'\1', normalized_selector)
                                normalized_selector = re.sub(r'\s*,\s*', r',', normalized_selector)
                                normalized_selector = normalized_selector.strip()
                                if normalized_selector:
                                    styles_css_selectors.add(normalized_selector)
        except Exception as e:
            write_output(f"Ошибка при чтении styles.css: {e}", indent=1)

        # Находим селекторы с вхождениями более 1 в любом файле
        selectors_to_merge = []
        for selector, files_and_counts in selector_occurrences.items():
            for file_path, count in files_and_counts.items():
                if count > 1:
                    selectors_to_merge.append(selector)
                    break

        if not selectors_to_merge:
            write_output("Селекторы с множественными вхождениями в одном файле не найдены.")
        else:
            rules_to_add = []
            files_to_update = defaultdict(list)
            for selector in selectors_to_merge:
                files_and_rules = selector_rules[selector]
                relevant_files = [f for f, c in selector_occurrences[selector].items() if c > 1]
                if len(relevant_files) < 2:
                    continue

                first_rule = files_and_rules[relevant_files[0]]
                all_match = True
                for file_path in relevant_files[1:]:
                    if files_and_rules[file_path] != first_rule:
                        all_match = False
                        break

                if all_match and selector not in styles_css_selectors:
                    rules_to_add.append((selector, first_rule))
                    write_output(f"Селектор '{selector}' с одинаковым содержимым в {len(relevant_files)} файлах будет добавлен в styles.css")
                    for file_path in relevant_files:
                        write_output(f"  - {file_path}: {selector_occurrences[selector][file_path]} раз(а)", indent=1)
                        files_to_update[file_path].append(selector)

            # Добавляем правила в styles.css
            if rules_to_add:
                try:
                    with open(styles_css_path, 'a', encoding='utf-8') as f:
                        f.write("\n/* Добавлено скриптом анализа */\n")
                        for selector, content in rules_to_add:
                            f.write(f"{selector} {{\n  {content}\n}}\n")
                    write_output(f"\nДобавлено {len(rules_to_add)} правил в {styles_css_path}")
                except Exception as e:
                    write_output(f"Ошибка при записи в styles.css: {e}", indent=1)

                # Удаляем перенесенные правила из исходных файлов
                for file_path, selectors in files_to_update.items():
                    try:
                        full_path = os.path.join(start_path, file_path)
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        for selector in selectors:
                            for full_rule in selector_full_rules[selector][file_path]:
                                content = content.replace(full_rule, '')

                        # Очищаем лишние пустые строки
                        content = re.sub(r'\n\s*\n+', '\n', content).strip()
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        write_output(f"Удалены правила для селекторов {', '.join(selectors)} из {file_path}")
                    except Exception as e:
                        write_output(f"Ошибка при обновлении файла {file_path}: {e}", indent=1)
            else:
                write_output("Нет правил для добавления в styles.css (либо правила различаются, либо селекторы уже присутствуют).")

        # --- Отчет ---
        write_output(f"\n--- Использование селекторов по проекту ---\n")

        if not selector_occurrences:
            write_output(
                "Уникальные CSS-селекторы не найдены. Убедитесь, что файлы .css корректны и не содержат только комментарии или пустые правила.")
            write_output("Возможно, регулярное выражение требует доработки для вашего специфического CSS.")
            return

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
            sorted_files_for_selector = sorted(files_and_counts.items(), key=lambda item: item[1], reverse=True)
            for file_path, count in sorted_files_for_selector:
                write_output(f"    - {file_path}: {count} раз(а)", indent=2)
            write_output("-" * 80 + "\n")

        write_output("\n--- Анализ завершен ---")
        write_output("Примечание: Скрипт использует регулярные выражения для извлечения селекторов.")
        write_output(
            "Для 100% корректной обработки всех возможных CSS-конструкций рекомендуется использовать CSS-парсер (например, `cssutils`).")


if __name__ == "__main__":
    scan_directory = '.'
    analyze_all_css_selectors(scan_directory)