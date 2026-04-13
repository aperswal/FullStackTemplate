"""Architectural tests mirroring apps/web/lib/arch.test.ts.

Scans production Python source files for pattern violations to enforce
structural consistency at the same level as the TypeScript codebase.
"""

import ast
import re
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"

# Files allowed to use os.getenv / os.environ directly
_ENV_EXEMPT_FILES = {"config.py", "__init__.py"}

_MAX_FILE_LINES = 300
_MAX_FUNCTION_LINES = 50


def _production_py_files() -> list[Path]:
    """Return all .py files in scripts/ excluding exempt files."""
    return [f for f in SCRIPTS_DIR.glob("*.py") if f.name not in _ENV_EXEMPT_FILES]


def test_no_raw_env_access() -> None:
    """Production code must not use os.getenv or os.environ directly.

    Use ``scripts.config.get_settings()`` instead.
    Mirrors the TS ESLint ``no-restricted-syntax`` rule banning ``process.env``.
    """
    patterns = [
        re.compile(r"os\.getenv\("),
        re.compile(r"os\.environ\["),
        re.compile(r"os\.environ\.get\("),
    ]
    violations: list[str] = []

    for path in _production_py_files():
        for line_num, line in enumerate(path.read_text().splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            for pat in patterns:
                if pat.search(line):
                    violations.append(f"{path.name}:{line_num}: {stripped}")

    assert not violations, (
        "Raw os.getenv/os.environ found in production code. "
        "Use scripts.config.get_settings() instead:\n" + "\n".join(violations)
    )


def test_no_bare_raise_exception() -> None:
    """Production code must not use ``raise Exception(...)`` directly.

    Use typed exceptions from ``scripts.errors`` instead.
    Mirrors the TS arch test banning ``throw new Error()``.
    """
    violations: list[str] = []

    for path in _production_py_files():
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Raise) and node.exc is not None:
                exc = node.exc
                # Check for raise Exception(...) or raise Exception
                if isinstance(exc, ast.Call) and isinstance(exc.func, ast.Name):
                    if exc.func.id == "Exception":
                        violations.append(f"{path.name}:{node.lineno}: raise Exception(...)")
                elif isinstance(exc, ast.Name) and exc.id == "Exception":
                    violations.append(f"{path.name}:{node.lineno}: raise Exception")

    assert not violations, (
        "Bare 'raise Exception' found. "
        "Use ClientError, ServerError, or ExternalServiceError instead:\n" + "\n".join(violations)
    )


def test_no_bare_except_exception() -> None:
    """Production code must not use ``except Exception:`` without re-raising.

    Catch specific exceptions or re-raise after logging.
    """
    except_pattern = re.compile(r"except\s+Exception\b")
    violations: list[str] = []

    for path in _production_py_files():
        lines = path.read_text().splitlines()
        for line_num, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            if except_pattern.search(line):
                # Check if there's a 'raise' in the next few lines of the except block
                has_raise = False
                indent = len(line) - len(line.lstrip())
                for subsequent in lines[line_num:]:
                    sub_stripped = subsequent.strip()
                    if not sub_stripped or sub_stripped.startswith("#"):
                        continue
                    sub_indent = len(subsequent) - len(subsequent.lstrip())
                    if sub_indent <= indent and sub_stripped:
                        break
                    if "raise" in sub_stripped:
                        has_raise = True
                        break
                if not has_raise:
                    violations.append(f"{path.name}:{line_num}: {stripped}")

    assert not violations, (
        "Bare 'except Exception' without re-raise found. "
        "Catch specific exceptions instead:\n" + "\n".join(violations)
    )


def test_file_max_lines() -> None:
    """Production files must not exceed 300 lines.

    Mirrors the TS ESLint ``max-lines: 300`` rule.
    """
    violations: list[str] = []

    for path in SCRIPTS_DIR.glob("*.py"):
        if path.name == "__init__.py":
            continue
        line_count = len(path.read_text().splitlines())
        if line_count > _MAX_FILE_LINES:
            violations.append(f"{path.name}: {line_count} lines (max {_MAX_FILE_LINES})")

    assert not violations, "Files exceed max line limit:\n" + "\n".join(violations)


def test_function_max_lines() -> None:
    """Production functions must not exceed 50 lines (excluding blanks and comments).

    Mirrors the TS ESLint ``max-lines-per-function: 50`` and Go ``funlen: 50`` rules.
    """
    violations: list[str] = []

    for path in _production_py_files():
        source = path.read_text()
        lines = source.splitlines()
        tree = ast.parse(source, filename=str(path))
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            start = node.lineno
            end = node.end_lineno
            if end is None:
                continue
            body_lines = lines[start - 1 : end]
            effective = sum(
                1 for line in body_lines if line.strip() and not line.strip().startswith("#")
            )
            if effective > _MAX_FUNCTION_LINES:
                violations.append(
                    f"{path.name}:{start}: {node.name}() has {effective} lines "
                    f"(max {_MAX_FUNCTION_LINES})"
                )

    assert not violations, "Functions exceed max line limit:\n" + "\n".join(violations)


def test_public_functions_have_docstrings() -> None:
    """All public functions in production code must have docstrings.

    Mirrors the TS ``explicit-module-boundary-types`` and ruff ``D`` rules.
    """
    violations: list[str] = []

    for path in _production_py_files():
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name.startswith("_"):
                    continue
                if not ast.get_docstring(node):
                    violations.append(f"{path.name}:{node.lineno}: {node.name}()")

    assert not violations, "Public functions missing docstrings:\n" + "\n".join(violations)


_SQL_KEYWORDS = {"SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE TABLE"}
_HEALTH_CHECK_LITERALS = {"SELECT 1", "SELECT 1;"}


def _find_sql_keyword(text: str) -> str | None:
    """Return the first SQL keyword found in ``text`` (uppercased), or None."""
    upper = text.upper()
    for kw in _SQL_KEYWORDS:
        if kw in upper:
            return kw
    return None


def _check_fstring_sql(node: ast.JoinedStr, filename: str) -> list[str]:
    """Return violations for f-strings containing SQL keywords."""
    parts = [
        v.value for v in node.values if isinstance(v, ast.Constant) and isinstance(v.value, str)
    ]
    kw = _find_sql_keyword(" ".join(parts))
    if kw:
        return [f"{filename}:{node.lineno}: SQL keyword '{kw}' in f-string"]
    return []


def _check_concat_sql(node: ast.BinOp, filename: str) -> list[str]:
    """Return violations for string concatenation containing SQL keywords."""
    hits: list[str] = []
    for side in (node.left, node.right):
        if not (isinstance(side, ast.Constant) and isinstance(side.value, str)):
            continue
        if side.value.strip() in _HEALTH_CHECK_LITERALS:
            continue
        kw = _find_sql_keyword(side.value)
        if kw:
            hits.append(f"{filename}:{node.lineno}: SQL keyword '{kw}' in string concatenation")
    return hits


def test_no_raw_sql_strings() -> None:
    """Production code must not contain raw SQL in f-strings or concatenation.

    All queries should use parameterized queries. Prevents SQL injection.
    Simple health-check strings like ``"SELECT 1"`` are allowed.
    """
    violations: list[str] = []

    for path in _production_py_files():
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.JoinedStr):
                violations.extend(_check_fstring_sql(node, path.name))
            elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
                violations.extend(_check_concat_sql(node, path.name))

    assert not violations, (
        "Raw SQL found in f-strings or concatenation. "
        "Use parameterized queries instead:\n" + "\n".join(violations)
    )


def test_no_mutable_default_arguments() -> None:
    """Function defaults must not be mutable objects.

    Using ``list``, ``dict``, or ``set`` as default arguments is a classic
    Python gotcha — the default is shared across all calls.
    """
    mutable_names = {"list", "dict", "set"}
    violations: list[str] = []

    for path in _production_py_files():
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            for default in node.args.defaults + node.args.kw_defaults:
                if default is None:
                    continue
                # list(), dict(), set() calls
                if (
                    isinstance(default, ast.Call)
                    and isinstance(default.func, ast.Name)
                    and default.func.id in mutable_names
                ):
                    violations.append(
                        f"{path.name}:{node.lineno}: {node.name}() has mutable default "
                        f"{default.func.id}()"
                    )
                # [], {}, set() literals
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    type_name = type(default).__name__.lower()
                    violations.append(
                        f"{path.name}:{node.lineno}: {node.name}() has mutable default "
                        f"({type_name} literal)"
                    )

    assert not violations, (
        "Mutable default arguments found. Use None and assign inside the function:\n"
        + "\n".join(violations)
    )


def test_no_import_star() -> None:
    """Production code must not use ``from x import *``.

    Prevents namespace pollution and makes dependencies explicit.
    """
    violations: list[str] = []

    for path in _production_py_files():
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.names:
                for alias in node.names:
                    if alias.name == "*":
                        module = node.module or "(relative)"
                        violations.append(f"{path.name}:{node.lineno}: from {module} import *")

    assert not violations, "Wildcard imports found. Import specific names instead:\n" + "\n".join(
        violations
    )
