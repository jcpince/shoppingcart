MKFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
ROOTDIR := $(dir $(MKFILE_PATH))

LOGSDIR := $(ROOTDIR)/logs
SLS_MODE := "$(SLS_MODE)"

ifeq ($(AUTH0_TOKEN),)
  $(error AUTH0_TOKEN is not set, please source setenv.sh)
endif

test: test-backend test-frontend

test-backend:
	mkdir -p $(ROOTDIR)/logs
	cd $(ROOTDIR)/unittests/backend && pytest 2>&1 |tee -a $(LOGSDIR)/test-bakend-${SLS_MODE}.log

test-frontend:
	@echo "No tests for the frontent yet..."

run-backend-offline:
ifneq ($(SLS_MODE), "OFFLINE")
		$(error Backend can only be ran offline, please source setenv.sh offline)
endif
	mkdir -p $(ROOTDIR)/logs
	cd $(ROOTDIR)/backend && sls offline 2>&1 |tee -a $(LOGSDIR)/run-bakend-${SLS_MODE}.log

run-dynamodb-offline:
ifneq ($(SLS_MODE), "OFFLINE")
		$(error DynamoDB can only be ran offline, please source setenv.sh offline)
endif
	mkdir -p $(ROOTDIR)/logs
	cd $(ROOTDIR)/backend && sls dynamodb start --migrate 2>&1 |tee -a $(LOGSDIR)/run-dynamodb-${SLS_MODE}.log

deploy-backend:
	cd $(ROOTDIR)/backend && sls deploy -v 2>&1 |tee -a $(LOGSDIR)/run-bakend-${SLS_MODE}.log