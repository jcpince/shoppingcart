import os

if 'BASE_URL' not in os.environ.keys():
    print('Missing environment variables, please source setenv.sh [offline]')
    exit(-1)

try:
    import requests
    import logging
    import pytest
    import json
except ModuleNotFoundError as e:
    print(e)
    print('Some modules are not found, did you activate your venv (see README.md)')
    exit(-1)

import URLHelper

logger = logging.getLogger(__name__)
urlHelper = URLHelper.URLHelper()

storeUrl = urlHelper.base_url + '/store'
auth0_headers = urlHelper.auth0_header

USERNAME = 'Toto'

if os.environ['SLS_MODE'] == 'OFFLINE':
    DEFAULT_TIMEOUT = 1.2
else:
    # large timeout for first connection...
    DEFAULT_TIMEOUT = 1.6

class CheckStoreClass:
    
    # REST Api requests
    def clearStore(self, timeout=DEFAULT_TIMEOUT*2):
        resp = requests.delete(storeUrl + '/clear', headers=auth0_headers, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()

    def createItem(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.put(storeUrl + '/create_item', headers=auth0_headers, data=data, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()
    
    def deleteItem(self, contents, timeout=DEFAULT_TIMEOUT):
        data = json.JSONEncoder().encode(contents)
        resp = requests.delete(storeUrl + '/delete_item', headers=auth0_headers, data=data, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()
    
    def getItems(self, contents, timeout=DEFAULT_TIMEOUT):
        # Don't JSONize the params here
        resp = requests.get(storeUrl + '/items', headers=auth0_headers, params=contents, timeout=timeout)
        return resp.status_code, json.loads(resp.text), resp.elapsed.total_seconds()

    def addItem(self, item):
        code, resp, time = self.createItem(item)
        logger.info('createItem(%s) returned %d: \'%s\' in %f seconds' % (item, code, resp, time))
        assert(code == 201)
        assert('temporary-upload-url' in resp.keys())
        assert(resp['temporary-upload-url'] != '')
        assert('item' in resp.keys())
        product = resp['item']
        assert('name' in product.keys())
        assert(product['name'] == item['name'])
        assert('identifier' in product.keys())
        assert(product['identifier'] != '')

    def fillStore(self):
        item = { 'name': 'tomatoes', 'category': 'vegetables', 'description': 'tomatoes', 'is_public': False, 'owner': USERNAME}
        self.addItem(item)
        item = { 'name': 'tomatoes', 'category': 'vegetables', 'description': 'black tomatoes', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        item = { 'name': 'peas', 'category': 'vegetables', 'description': 'peas', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        item = { 'name': 'potatoes', 'category': 'vegetables', 'description': 'potatoes', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        item = { 'name': 'bananas', 'category': 'fruits', 'description': 'bananas', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        item = { 'name': 'pears', 'category': 'fruits', 'description': 'pears', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        item = { 'name': 'apples', 'category': 'fruits', 'description': 'apples', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)
        
    
    # Tests
    @pytest.mark.run(order=0)
    def cleanupTable_check(self):
        code, resp, time = self.clearStore()
        logger.info('clearStore() returned %d: \'%s\' in %f seconds' % (code, resp, time))
        assert(code == 200)
        assert('Status' in resp.keys())
        assert(resp['Status'] == 'Succeeded')
    
    @pytest.mark.run(order=6)
    def cleanupTable2_check(self):
        code, resp, time = self.clearStore()
        logger.info('clearStore() returned %d: \'%s\' in %f seconds' % (code, resp, time))
        assert(code == 200)
        assert('Status' in resp.keys())
        assert(resp['Status'] == 'Succeeded')

    @pytest.mark.run(order=1)
    def addItem_check(self):
        item = { 'name': 'carrots', 'category': 'vegetables', 'description': 'carrots', 'is_public': True, 'owner': 'ALL'}
        self.addItem(item)

    @pytest.mark.run(order=2)
    def deleteItem_check(self):
        contents = { 'name': 'carrots', 'category': 'vegetables', 'description': 'carrots', 'is_public': True, 'owner': 'ALL'}
        code, resp, time = self.createItem(contents)
        logger.info('createItem(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 201)
        assert('temporary-upload-url' in resp.keys())
        assert(resp['temporary-upload-url'] != '')
        assert('item' in resp.keys())
        product = resp['item']
        assert('name' in product.keys())
        assert(product['name'] == 'carrots')
        assert('identifier' in product.keys())
        assert(product['identifier'] != '')
        # now delete it
        code, resp, time = self.deleteItem(product)
        logger.info('deleteItem(%s) returned %d: \'%s\' in %f seconds' % (product, code, resp, time))
        assert(code == 200)

    @pytest.mark.run(order=3)
    def fillStore_check(self):
        self.fillStore()

    def printProducts(self, products):
        print('%d products:' % len(products))
        for product in products:
            print("\tname(%s), desc(%s), owner(%s), public(%s)" %
                (product['name'], product['description'], product['owner'], product['is_public']))

    @pytest.mark.run(order=4)
    def upload_check(self):
        item = { 'name': 'oranges', 'category': 'fruits', 'description': 'oranges', 'is_public': False, 'owner': USERNAME }
        code, resp, time = self.createItem(item)
        logger.info('createItem(%s) returned %d: \'%s\' in %f seconds' % (item, code, resp, time))
        assert(code == 201)
        assert('temporary-upload-url' in resp.keys())
        assert(resp['temporary-upload-url'] != '')
        assert('item' in resp.keys())
        product = resp['item']
        assert('name' in product.keys())
        assert(product['name'] == item['name'])
        assert('identifier' in product.keys())
        assert(product['identifier'] != '')
        # Now, upload the image...
        filename = '/data/work/repos/shoppingcart/unittests/resources/banana.jpg'
        headers = {'Content-type': 'image/jpeg', 'Slug': filename}
        ret = requests.put(resp['temporary-upload-url'], headers=headers, data=open(filename, 'rb'))
        logger.info('put returned %s: %s' % (str(ret), str(ret.text)))
        assert(ret.status_code == 200)

        # Finally remove the object
        code, resp, time = self.deleteItem(product)
        logger.info('deleteItem(%s) returned %d: \'%s\' in %f seconds' % (product, code, resp, time))
        assert(code == 200)

    @pytest.mark.run(order=5)
    def getItems_check(self):
        contents = { 'owner': 'ALL', 'criteria': 'vegetables', 'by_category': True, 'with_public': True}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 4)

        contents = { 'owner': USERNAME, 'criteria': 'vegetables', 'by_category': True, 'with_public': True}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 5)

        contents = { 'owner': USERNAME, 'criteria': 'vegetables', 'by_category': True, 'with_public': False}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 1)

        contents = { 'owner': USERNAME, 'criteria': 'tomatoes', 'by_category': False, 'with_public': False}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 1)

        contents = { 'owner': "Raymond", 'criteria': 'tomatoes', 'by_category': False, 'with_public': True}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 1)

        contents = { 'owner': 'ALL', 'criteria': 'fruits', 'by_category': True, 'with_public': True}
        code, resp, time = self.getItems(contents)
        logger.info('getItems(%s) returned %d: \'%s\' in %f seconds' % (contents, code, resp, time))
        assert(code == 200)
        assert('products' in resp.keys())
        self.printProducts(resp['products'])
        assert(len(resp['products']) == 3)


if __name__ == '__main__':
    logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)
    c = CheckStoreClass()
    c.cleanupTable_check()

    c.addItem_check()
    c.deleteItem_check()

    c.fillStore_check()

    c.upload_check()

    c.getItems_check()

    c.cleanupTable_check()