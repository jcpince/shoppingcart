import requests
import logging
import json
import os

logger = logging.getLogger(__name__)

BASE_URL = os.environ['BASE_URL']
AUTH0_TOKEN = os.environ['AUTH0_TOKEN']
auth0_headers = {
    'Authorization': 'Bearer ' + AUTH0_TOKEN
    }

class CheckDBClass:    
    def getToto(self):
        url = BASE_URL + "/toto"
        resp = requests.get(url, headers=auth0_headers)
        return json.loads(resp.text)
    
    def base_check(self):
        resp = self.getToto()
        logger.info("getToto returned \'%s\'" % resp)
        assert('text' in resp.keys())
        assert(resp['text'] == 'Hello world')

if __name__ == "__main__":
    c = CheckDBClass()
    resp = c.getToto()
    print(resp)