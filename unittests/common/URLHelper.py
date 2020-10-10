import os

class URLHelper:
    def __init__(self):
        self.base_url = os.environ['BASE_URL']
        self.auth0_token = os.environ['AUTH0_TOKEN']
        self.auth0_header = {
            'Authorization': 'Bearer ' + self.auth0_token
        }