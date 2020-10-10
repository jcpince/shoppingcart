MKFILE_PATH := $(abspath $(lastword $(MAKEFILE_LIST)))
ROOTDIR := $(dir $(MKFILE_PATH))

LOGSDIR := $(ROOTDIR)/logs

ifeq ($(AUTH0_TOKEN),)
  $(error AUTH0_TOKEN is not set, please source setenv.sh)
endif

test-offline: test-backend-offline test-frontend-offline

test-backend-offline:
	mkdir -p $(ROOTDIR)/logs
	cd $(ROOTDIR)/unittests/backend && pytest 2>&1 |tee -a $(LOGSDIR)/test-bakend-offline.log

test-frontend-offline:
	@echo "No tests for the frontent yet..."

run-backend-offline:
	mkdir -p $(ROOTDIR)/logs
	cd $(ROOTDIR)/backend && sls offline 2>&1 |tee -a $(LOGSDIR)/run-bakend-offline.log