import requests
import logging
import json

import URLHelper

logger = logging.getLogger(__name__)
urlHelper = URLHelper.URLHelper()

class CheckHelloClass:
    def getToto(self):
        url = urlHelper.base_url + "/toto"
        resp = requests.get(url, headers=urlHelper.auth0_header)
        return json.loads(resp.text)
    
    def base_check(self):
        resp = self.getToto()
        logger.info("getToto returned \'%s\'" % resp)
        assert('text' in resp.keys())
        assert(resp['text'] == 'Hello world')

if __name__ == "__main__":
    c = CheckHelloClass()
    resp = c.getToto()
    print(resp)