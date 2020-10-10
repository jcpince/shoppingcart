import requests
import logging
import pytest
import json

import URLHelper

logger = logging.getLogger(__name__)
urlHelper = URLHelper.URLHelper()

usersUrl = urlHelper.base_url + "/users"
auth0_headers = urlHelper.auth0_header

USERNAME = "Toto"

class CheckUsersClass:
    
    # REST Api requests
    def addUser(self, contents):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(usersUrl + "/add", headers=auth0_headers, data=data)
        return resp.status_code, json.loads(resp.text)
    
    def deleteUser(self, contents):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(usersUrl + "/delete", headers=auth0_headers, data=data)
        return resp.status_code, json.loads(resp.text)
    
    def connectUser(self, contents):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(usersUrl + "/connect", headers=auth0_headers, data=data)
        return resp.status_code, json.loads(resp.text)
    
    # Tests
    @pytest.mark.run(order=2)
    def addUser_check(self):
        contents = { "name" : USERNAME}
        code, resp = self.addUser(contents)
        logger.info("addUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 200)
        assert("name" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=2)
    def addInvalidUser_check(self):
        contents = { "nam" : USERNAME}
        code, resp = self.addUser(contents)
        logger.info("addUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 400)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "Invalid Request (no valid name)")
    
    @pytest.mark.run(order=1)
    def cleanupTable_check(self):
        contents = { "name" : USERNAME}
        code, resp = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\'" % (contents, code, resp))

    @pytest.mark.run(order=4)
    def deleteUser_check(self):
        contents = { "name" : USERNAME}
        code, resp = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 200)
        assert("name" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=4)
    def deleteInvalidUser_check(self):
        contents = { "name" : "wrong name"}
        code, resp = self.deleteUser(contents)
        logger.info("deleteUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 404)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "User not found")
    
    @pytest.mark.run(order=3)
    def connectUser_check(self):
        contents = { "name" : USERNAME}
        code, resp = self.connectUser(contents)
        logger.info("connectUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 200)
        assert("name" in resp.keys())
        assert("uuid" in resp.keys())
        assert(resp['name'] == USERNAME)
    
    @pytest.mark.run(order=3)
    def connectInvalidUser_check(self):
        contents = { "name" : "wrong name"}
        code, resp = self.connectUser(contents)
        logger.info("connectUser(%s) returned %d: \'%s\'" % (contents, code, resp))
        assert(code == 404)
        assert("Error" in resp.keys())
        assert(resp['Error'] == "User not found")

if __name__ == "__main__":
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)
    c = CheckUsersClass()
    c.deleteUser({ "name" : USERNAME})
    c.addUser_check()
    c.addInvalidUser_check()
    c.connectUser_check()
    c.connectInvalidUser_check()
    c.deleteUser_check()
    c.deleteInvalidUser_check()