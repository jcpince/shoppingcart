import os

if 'BASE_URL' not in os.environ.keys():
    print("Missing environment variables, please source setenv.sh [offline]")
    exit(-1)

try:
    import requests
    import logging
    import pytest
    import json
except ModuleNotFoundError as e:
    print(e)
    print("Some modules are not found, did you activate your venv (see README.md)")
    exit(-1)

import URLHelper

logger = logging.getLogger(__name__)
urlHelper = URLHelper.URLHelper()

groupsUrl = urlHelper.base_url + "/groups"
auth0_headers = urlHelper.auth0_header

USERNAME = "Toto"
GROUPID = "group0_uid"

if os.environ['SLS_MODE'] == "OFFLINE":
    DEFAULT_TIMEOUT = 10 #0.6
else:
    # large timeout for first connection...
    DEFAULT_TIMEOUT = 1.4

class CheckGroupsClass:
    
    # REST Api requests
    def addGroup(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(groupsUrl + "/add", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()
    
    def deleteGroup(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(groupsUrl + "/delete", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()
    
    def updateGroup(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.patch(groupsUrl + "/update", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    # Tests
    @pytest.mark.run(order=1)
    def cleanupTable_check(self):
        contents = { "identifier" : GROUPID}
        code, resp, time = self.deleteGroup(contents)
        logger.info("deleteGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))

    @pytest.mark.run(order=2)
    def addGroup_check(self):
        contents = { "identifier" : GROUPID}
        code, resp, time = self.addGroup(contents)
        logger.info("addGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 201)
        assert("identifier" in resp.keys())
        assert(resp['identifier'] == GROUPID)

    @pytest.mark.run(order=2)
    def addInvalidGroup_check(self):
        contents = { "identity" : GROUPID}
        code, resp, time = self.addGroup(contents)
        logger.info("addGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 400)
        assert("Error" in resp.keys() or "message" in resp.keys())
        if "Error" in resp.keys():
            assert(resp['Error'] == "Invalid Request (no valid identifier)")
        else:
            assert(resp['message'] == "Invalid request body")

    @pytest.mark.run(order=3)
    def addExistingGroup_check(self):
        contents = { "identifier" : GROUPID}
        code, resp, time = self.addGroup(contents)
        logger.info("addGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 401)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "Group already exists")
    
    @pytest.mark.run(order=3)
    def addUserToGroup_check(self):
        contents = { "identifier" : GROUPID, "userid": USERNAME, "addUser": True}
        code, resp, time = self.updateGroup(contents)
        logger.info("updateGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())
        assert(resp['identifier'] == GROUPID)
    
    @pytest.mark.run(order=4)
    def removeUserFromGroup_check(self):
        contents = { "identifier" : GROUPID, "userid": USERNAME, "addUser": False}
        code, resp, time = self.updateGroup(contents)
        logger.info("updateGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())
        assert(resp['identifier'] == GROUPID)
    
    @pytest.mark.run(order=4)
    def removeWrongUserFromGroup_check(self):
        contents = { "identifier" : GROUPID, "userid": "hjgf", "addUser": False}
        code, resp, time = self.updateGroup(contents)
        logger.info("updateGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())
        assert(resp['identifier'] == GROUPID)
    
    @pytest.mark.run(order=5)
    def deleteGroup_check(self):
        contents = { "identifier" : GROUPID}
        code, resp, time = self.deleteGroup(contents)
        logger.info("deleteGroup(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())
        assert(resp['identifier'] == GROUPID)

if __name__ == "__main__":
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)
    c = CheckGroupsClass()
    c.cleanupTable_check()

    c.addGroup_check()
    c.addInvalidGroup_check()

    c.addExistingGroup_check()

    c.addUserToGroup_check()
    c.removeWrongUserFromGroup_check()
    c.removeUserFromGroup_check()

    c.deleteGroup_check()

