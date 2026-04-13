package main

import (
	"bufio"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// productionGoFiles returns all .go files that are not test files and not in
// directories explicitly allowed to break certain rules.
func productionGoFiles(t *testing.T, excludeDirs ...string) []string {
	t.Helper()

	var files []string
	err := filepath.WalkDir(".", func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			for _, ex := range excludeDirs {
				if strings.HasPrefix(path, ex) {
					return filepath.SkipDir
				}
			}
			return nil
		}
		if strings.HasSuffix(path, ".go") && !strings.HasSuffix(path, "_test.go") {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		t.Fatalf("failed to walk directory: %v", err)
	}
	return files
}

// scanFileForPattern checks whether any line in a file matches a pattern.
func scanFileForPattern(t *testing.T, path string, patterns []string) []string {
	t.Helper()

	f, err := os.Open(path)
	if err != nil {
		t.Fatalf("failed to open %s: %v", path, err)
	}
	defer func() { _ = f.Close() }()

	var violations []string
	scanner := bufio.NewScanner(f)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		// Skip comments
		if strings.HasPrefix(trimmed, "//") {
			continue
		}

		for _, pat := range patterns {
			if strings.Contains(line, pat) {
				violations = append(violations, path+":"+itoa(lineNum)+": "+trimmed)
			}
		}
	}
	return violations
}

// itoa converts an int to a string without importing strconv.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}

// TestNoRawEnvAccess ensures production code does not call os.Getenv or os.Setenv directly.
// The config package is the single allowed access point, mirroring the TS env validation pattern.
func TestNoRawEnvAccess(t *testing.T) {
	files := productionGoFiles(t, "config")
	patterns := []string{"os.Getenv", "os.Setenv"}

	var allViolations []string
	for _, f := range files {
		allViolations = append(allViolations, scanFileForPattern(t, f, patterns)...)
	}

	if len(allViolations) > 0 {
		t.Errorf("raw os.Getenv/os.Setenv found in production code. Use the config package instead:\n%s",
			strings.Join(allViolations, "\n"))
	}
}

// TestNoPanicInProduction ensures production code does not call panic().
// Errors should be returned, not panicked.
func TestNoPanicInProduction(t *testing.T) {
	files := productionGoFiles(t)
	patterns := []string{"panic("}

	var allViolations []string
	for _, f := range files {
		allViolations = append(allViolations, scanFileForPattern(t, f, patterns)...)
	}

	if len(allViolations) > 0 {
		t.Errorf("panic() found in production code. Return an error instead:\n%s",
			strings.Join(allViolations, "\n"))
	}
}

// TestFileMaxLines ensures no production .go file exceeds 300 lines,
// matching the TS max-lines: 300 ESLint rule.
func TestFileMaxLines(t *testing.T) {
	files := productionGoFiles(t)
	maxLines := 300

	for _, path := range files {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", path, err)
		}
		lines := strings.Count(string(data), "\n")
		if lines > maxLines {
			t.Errorf("%s has %d lines (max %d)", path, lines, maxLines)
		}
	}
}

// TestExportedFunctionsHaveDocComments uses go/parser to verify every exported
// function and type has a doc comment, matching the TS explicit-module-boundary-types rule.
func TestExportedFunctionsHaveDocComments(t *testing.T) {
	files := productionGoFiles(t)
	fset := token.NewFileSet()

	for _, path := range files {
		node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			t.Fatalf("failed to parse %s: %v", path, err)
		}

		for _, decl := range node.Decls {
			switch d := decl.(type) {
			case *ast.FuncDecl:
				if d.Name.IsExported() && d.Doc == nil {
					pos := fset.Position(d.Pos())
					t.Errorf("%s:%d: exported function %s has no doc comment", pos.Filename, pos.Line, d.Name.Name)
				}
			case *ast.GenDecl:
				if d.Tok == token.TYPE {
					for _, spec := range d.Specs {
						ts, ok := spec.(*ast.TypeSpec)
						if ok && ts.Name.IsExported() && d.Doc == nil {
							pos := fset.Position(ts.Pos())
							t.Errorf("%s:%d: exported type %s has no doc comment", pos.Filename, pos.Line, ts.Name.Name)
						}
					}
				}
			}
		}
	}
}

// TestNoRawSQLStrings ensures production code does not contain raw SQL string literals.
// All queries must use parameterized queries or a query builder. Prevents SQL injection risk.
func TestNoRawSQLStrings(t *testing.T) {
	files := productionGoFiles(t)
	fset := token.NewFileSet()
	sqlKeywords := []string{"SELECT ", "INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ", "CREATE TABLE"}
	// Parameterized query markers that indicate safe usage
	paramMarkers := []string{"$1", "?"}

	var violations []string
	for _, path := range files {
		node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			t.Fatalf("failed to parse %s: %v", path, err)
		}

		ast.Inspect(node, func(n ast.Node) bool {
			lit, ok := n.(*ast.BasicLit)
			if !ok || lit.Kind != token.STRING {
				return true
			}
			val := lit.Value
			upper := strings.ToUpper(val)
			for _, kw := range sqlKeywords {
				if strings.Contains(upper, kw) {
					// Allow parameterized queries
					isParameterized := false
					for _, marker := range paramMarkers {
						if strings.Contains(val, marker) {
							isParameterized = true
							break
						}
					}
					if !isParameterized {
						pos := fset.Position(lit.Pos())
						violations = append(violations, pos.Filename+":"+itoa(pos.Line)+": raw SQL: "+val)
					}
					break
				}
			}
			return true
		})
	}

	if len(violations) > 0 {
		t.Errorf("raw SQL strings found in production code. Use parameterized queries or a query builder:\n%s",
			strings.Join(violations, "\n"))
	}
}

// TestAllJSONStructsHaveTags verifies that in structs with at least one json tag,
// ALL exported fields have json tags. Catches missing tags on new fields.
func TestAllJSONStructsHaveTags(t *testing.T) {
	files := productionGoFiles(t)
	fset := token.NewFileSet()

	var violations []string
	for _, path := range files {
		node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			t.Fatalf("failed to parse %s: %v", path, err)
		}

		ast.Inspect(node, func(n ast.Node) bool {
			st, ok := n.(*ast.StructType)
			if !ok || st.Fields == nil {
				return true
			}

			// Check if any field has a json tag
			hasJSONTag := false
			for _, field := range st.Fields.List {
				if field.Tag != nil && strings.Contains(field.Tag.Value, `json:`) {
					hasJSONTag = true
					break
				}
			}
			if !hasJSONTag {
				return true
			}

			// All exported fields must have json tags
			for _, field := range st.Fields.List {
				for _, name := range field.Names {
					if name.IsExported() {
						if field.Tag == nil || !strings.Contains(field.Tag.Value, `json:`) {
							pos := fset.Position(name.Pos())
							violations = append(violations, pos.Filename+":"+itoa(pos.Line)+": exported field "+name.Name+" missing json tag")
						}
					}
				}
			}
			return true
		})
	}

	if len(violations) > 0 {
		t.Errorf("exported fields in JSON structs missing json tags:\n%s",
			strings.Join(violations, "\n"))
	}
}

// TestNoGlobalMutableState ensures production code does not declare package-level var
// (mutable global state). Allowed: sqlDriver in main.go for test injection.
func TestNoGlobalMutableState(t *testing.T) {
	files := productionGoFiles(t)
	fset := token.NewFileSet()

	allowList := map[string]map[string]bool{
		"main.go":   {"sqlDriver": true},
		"config.go": {"errInvalidConfig": true},
	}

	var violations []string
	for _, path := range files {
		node, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
		if err != nil {
			t.Fatalf("failed to parse %s: %v", path, err)
		}

		base := filepath.Base(path)
		for _, decl := range node.Decls {
			gd, ok := decl.(*ast.GenDecl)
			if !ok || gd.Tok != token.VAR {
				continue
			}
			for _, spec := range gd.Specs {
				vs, ok := spec.(*ast.ValueSpec)
				if !ok {
					continue
				}
				for _, name := range vs.Names {
					if allowed, exists := allowList[base]; exists && allowed[name.Name] {
						continue
					}
					pos := fset.Position(name.Pos())
					violations = append(violations, pos.Filename+":"+itoa(pos.Line)+": package-level var "+name.Name)
				}
			}
		}
	}

	if len(violations) > 0 {
		t.Errorf("global mutable state found in production code. Use function-local variables or dependency injection:\n%s",
			strings.Join(violations, "\n"))
	}
}

// TestNoCommentedOutCode scans for patterns that suggest commented-out code,
// matching the TS ERA (eradicate) rule.
func TestNoCommentedOutCode(t *testing.T) {
	files := productionGoFiles(t)
	commentedCodePatterns := []string{
		"// func ",
		"// var ",
		"// type ",
		"// if ",
		"// for ",
		"// return ",
		"// switch ",
	}

	for _, path := range files {
		f, err := os.Open(path)
		if err != nil {
			t.Fatalf("failed to open %s: %v", path, err)
		}

		scanner := bufio.NewScanner(f)
		lineNum := 0
		for scanner.Scan() {
			lineNum++
			line := strings.TrimSpace(scanner.Text())
			for _, pat := range commentedCodePatterns {
				if strings.HasPrefix(line, pat) {
					t.Errorf("%s:%d: looks like commented-out code: %s", path, lineNum, line)
				}
			}
		}
		_ = f.Close()
	}
}
