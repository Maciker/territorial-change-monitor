.PHONY: test lint

test:
	pytest

lint:
	ruff check src tests
