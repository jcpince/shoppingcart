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

usersUrl = urlHelper.base_url + "/users"
auth0_headers = urlHelper.auth0_header

USERNAME = "Toto"

if os.environ['SLS_MODE'] == "OFFLINE":
    DEFAULT_TIMEOUT = 0.6
else:
    # large timeout for first connection...
    DEFAULT_TIMEOUT = 1.4

class CheckUsersClass:
    
    # REST Api requests
    def addUser(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(usersUrl + "/add", headers=auth0_headers, data=data, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()
    
    def deleteUser(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(usersUrl + "/delete", headers=auth0_headers, data=data, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()
    
    def connectUser(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(usersUrl + "/connect", headers=auth0_headers, data=data, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()
    
    # Tests
    @pytest.mark.run(order=2)
    def addUser_check(self):
        contents = { "name" : USERNAME}
        code, resp, time = self.addUser(contents)
        logger.info("addUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 201)
        assert("name" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=2)
    def addInvalidUser_check(self):
        contents = { "nam" : USERNAME}
        code, resp, time = self.addUser(contents)
        logger.info("addUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 400)
        assert("Error" in resp.keys() or "message" in resp.keys())
        if "Error" in resp.keys():
            assert(resp['Error'] == "Invalid Request (no valid name)")
        else:
            assert(resp['message'] == "Invalid request body")
    
    @pytest.mark.run(order=1)
    def cleanupTable_check(self):
        contents = { "name" : USERNAME}
        code, resp, time = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))

    @pytest.mark.run(order=4)
    def deleteUser_check(self):
        contents = { "name" : USERNAME}
        code, resp, time = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("name" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=4)
    def deleteInvalidUser_check(self):
        contents = { "name" : "wrong name"}
        code, resp, time = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 404)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "User not found")
    
    @pytest.mark.run(order=4)
    def deleteInvalidUser2_check(self):
        contents = { "name" : ""}
        code, resp, time = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 400)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "Invalid Request (no valid name)")
    
    @pytest.mark.run(order=3)
    def connectUser_check(self):
        contents = { "name" : USERNAME}
        code, resp, time = self.connectUser(contents)
        logger.info("connectUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("name" in resp.keys())
        assert("uuid" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=3)
    def addExistingUser_check(self):
        contents = { "name" : USERNAME}
        code, resp, time = self.addUser(contents)
        logger.info("addUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 401)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "User already registered")
    
    @pytest.mark.run(order=3)
    def connectInvalidUser_check(self):
        contents = { "name" : "wrong name"}
        code, resp, time = self.connectUser(contents)
        logger.info("connectUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 404)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "User not found")
    
    @pytest.mark.run(order=3)
    def connectInvalidUser2_check(self):
        contents = { "name" : ""}
        code, resp, time = self.connectUser(contents)
        logger.info("connectUser(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 400)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "Invalid Request (no valid name)")

if __name__ == "__main__":
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)
    c = CheckUsersClass()
    c.cleanupTable_check()

    c.addUser_check()
    c.addInvalidUser_check()

    c.connectUser_check()
    c.connectInvalidUser_check()
    c.connectInvalidUser2_check()
    c.addExistingUser_check()

    c.deleteUser_check()
    c.deleteInvalidUser_check()
    c.deleteInvalidUser2_check()