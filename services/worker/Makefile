.PHONY: lint test build verify coverage-check coverage-ratchet format format-check

GOFUMPT := $(shell go env GOPATH)/bin/gofumpt

lint:
	golangci-lint run ./...

format:
	$(GOFUMPT) -w .
	goimports -w .

format-check:
	@test -z "$$($(GOFUMPT) -l .)" || (echo "Files need gofumpt formatting:"; $(GOFUMPT) -l .; exit 1)

test:
	go test -v -race -coverprofile=coverage.out ./...

coverage-check:
	@go tool cover -func=coverage.out | grep total | awk '{total=$$3} END {if (total+0 < 95) {print "Coverage " total " below 95%"; exit 1}}'

coverage-ratchet:
	./scripts/coverage-ratchet.sh

build:
	go build ./...

verify: format-check lint test coverage-check coverage-ratchet build
