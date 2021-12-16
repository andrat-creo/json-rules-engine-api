CURR_PATH := $(shell pwd)

.PHONY: build-dev-env
build-dev-env:  ## Build dev instance on your local machine
	@docker build --file ./Dockerfile --tag rules-engine .

.PHONY: run-dev-env
run-dev-env:  ## Run dev instance - use IP written below, not from command prompt. For some reason volume with ${pwd} doesn't work...
	@docker run	--rm \
				--name rules-engine \
				--volume $(CURR_PATH)/app:/app \
				--publish 127.0.0.1:8888:8000 \
				rules-engine

.PHONY: run-debug-env
run-debug-env:  ## Run debug instance - use IP written below, not from command prompt
	@docker run	--rm \
				--name rules-engine-debug \
				--volume $(CURR_PATH)/app:/app \
				--publish 127.0.0.1:8888:8000 \
				--publish 127.0.0.1:9229:9229 \
				rules-engine