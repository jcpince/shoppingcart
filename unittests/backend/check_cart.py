import pytest
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

cartsUrl = urlHelper.base_url + "/cart"
auth0_headers = urlHelper.auth0_header

GROUPID =  "uid_group0"
ITEMID =   "uid_item0"
CARTID =   "uid_cart0"
CARTNAME = "name_cart0"
USERID =   "uid_user0"

if os.environ['SLS_MODE'] == "OFFLINE":
    DEFAULT_TIMEOUT = 10 #0.6
else:
    # large timeout for first connection...
    DEFAULT_TIMEOUT = 1.4

def pytest_namespace():
    return {'cartitem_id': None, 'cart_id': None}

class CheckCartClass:
    # REST Api requests
    def clearCarts(self, timeout=DEFAULT_TIMEOUT*10):
        resp = requests.delete(cartsUrl + '/clear', headers=auth0_headers, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()

    def addCart(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(cartsUrl + "/create_cart", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def deleteCart(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(cartsUrl + "/delete_cart", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def emptyCart(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.patch(cartsUrl + "/empty", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def getCartItems(self, cart_id, timeout=DEFAULT_TIMEOUT):
        resp = requests.get(cartsUrl + "/" + cart_id, headers=auth0_headers, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def addCartItem(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(cartsUrl + "/items", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def removeCartItem(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(cartsUrl + "/items", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def modifyCartItem(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.patch(cartsUrl + "/items", headers=auth0_headers, data=data, timeout=timeout)
        json_resp = None
        if resp.text:
            json_resp = json.loads(resp.text)
        return resp.status_code, json_resp, resp.elapsed.total_seconds()

    def safeAddCartItem(self, cart_id, itemid):
        contents = { "userid" : USERID, "cartid" : cart_id, "itemid" : itemid,
                "quantity": 100, "unit": "grams"  }
        code, resp, time = self.addCartItem(contents)
        logger.info("addCartItem(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 201)
        assert("identifier" in resp.keys())
        return resp['identifier']

    @pytest.mark.run(order=0)
    def clearCarts_check(self):
        code, resp, time = self.clearCarts()
        logger.info('clearCarts() returned %d: \'%s\' in %f seconds' % (code, resp, time))
        assert(code == 200)
        assert('Status' in resp.keys())
        assert(resp['Status'] == 'Succeeded')

    @pytest.mark.run(order=8)
    def clearCarts2_check(self):
        code, resp, time = self.clearCarts()
        logger.info('clearCarts() returned %d: \'%s\' in %f seconds' % (code, resp, time))
        assert(code == 200)
        assert('Status' in resp.keys())
        assert(resp['Status'] == 'Succeeded')

    @pytest.mark.run(order=1)
    def addCart_check(self):
        contents = { "name" : CARTNAME, "ownerid" : USERID }
        code, resp, time = self.addCart(contents)
        logger.info("addCart(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 201)
        assert("identifier" in resp.keys())
        pytest.cart_id = resp['identifier']

    @pytest.mark.run(order=2)
    def addExistingCart_check(self):
        contents = { "name" : CARTNAME, "ownerid" : USERID }
        code, resp, time = self.addCart(contents)
        logger.info("addCart(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 401)
        assert("Error" in resp.keys())
        assert(resp["Error"] == "Cart " + CARTNAME +
            " from owner " + USERID + " already exists")

    # @pytest.mark.run(order=2)
    # def getOwnerCarts_check(self):
    #     ownerid = "toto"
    #     code, resp, time = self.getOwnerCarts(ownerid)
    #     logger.info("getOwnerCarts(%s) returned %d: \'%s\' in %f seconds" % (ownerid, code, resp, time))
    #     assert(code == 200)

    @pytest.mark.run(order=2)
    def addCartItem_check(self):
        assert(pytest.cart_id)
        pytest.cartitem_id = self.safeAddCartItem(pytest.cart_id, ITEMID)

    @pytest.mark.run(order=3)
    def modifyCartItem_check(self):
        assert(pytest.cart_id)
        assert(pytest.cartitem_id)
        contents = { "identifier" : pytest.cartitem_id, "userid" : USERID,
                "itemid" : ITEMID, "cartid": pytest.cart_id, "quantity": 200,
                "unit": "milligramms"}
        code, resp, time = self.modifyCartItem(contents)
        logger.info("modifyCartItem(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())

        # now check the item changed
        code, items, time = self.getCartItems(pytest.cart_id)
        logger.info("getCartItems(%s) returned %d: \'%s\' in %f seconds" % (pytest.cart_id, code, items, time))
        assert(code == 200)
        assert(len(items) == 1)
        assert(items[0]['itemid'] == ITEMID)
        assert(items[0]['quantity'] == 200)
        assert(items[0]['unit'] == 'milligramms')

    @pytest.mark.run(order=4)
    def removeCartItem_check(self):
        assert(pytest.cartitem_id)
        contents = { "identifier" : pytest.cartitem_id, "userid" : USERID,
                "itemid" : ITEMID, "cartid": pytest.cart_id }
        code, resp, time = self.removeCartItem(contents)
        logger.info("removeCartItem(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())

    @pytest.mark.run(order=6)
    def emptyCart_check(self):
        assert(pytest.cart_id)
        cart_id = pytest.cart_id
        self.safeAddCartItem(cart_id, ITEMID + "0")
        self.safeAddCartItem(cart_id, ITEMID + "1")
        self.safeAddCartItem(cart_id, ITEMID + "2")

        contents = { "identifier" : cart_id, "ownerid" : USERID }
        code, resp, time = self.emptyCart(contents)
        logger.info("emptyCart(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())

    @pytest.mark.run(order=5)
    def getCartItems_check(self):
        assert(pytest.cart_id)
        cart_id = pytest.cart_id
        self.safeAddCartItem(cart_id, ITEMID + "0")
        self.safeAddCartItem(cart_id, ITEMID + "1")
        self.safeAddCartItem(cart_id, ITEMID + "2")

        code, items, time = self.getCartItems(cart_id)
        logger.info("getCartItems(%s) returned %d: \'%s\' in %f seconds" % (cart_id, code, items, time))
        assert(code == 200)
        assert(len(items) == 3)
        assert(items[0]['itemid'].startswith(ITEMID))
        assert(items[1]['itemid'].startswith(ITEMID))
        assert(items[2]['itemid'].startswith(ITEMID))
        contents = { "identifier" : cart_id }
        self.emptyCart(contents)

    @pytest.mark.run(order=7)
    def deleteCart_check(self):
        assert(pytest.cart_id)
        contents = { "identifier" : pytest.cart_id, "ownerid" : USERID }
        code, resp, time = self.deleteCart(contents)
        logger.info("deleteCart(%s) returned %d: \'%s\' in %f seconds" % (contents, code, resp, time))
        assert(code == 200)
        assert("identifier" in resp.keys())

if __name__ == "__main__":
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)

    c = CheckCartClass()

    c.clearCarts_check()

    c.addCart_check()

    c.addExistingCart_check()

    c.addCartItem_check()

    c.modifyCartItem_check()

    c.removeCartItem_check()

    c.removeCartItem_check()

    c.getCartItems_check()

    c.emptyCart_check()

    c.deleteCart_check()

    c.clearCarts2_check()
