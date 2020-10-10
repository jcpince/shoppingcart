## Run the test offline
sls offline

## Install a new python venv
virtualenv venv --python=python3
. venv/bin/activate
python -m pip install --upgrade pip
python -m pip install requests

## Get a new token from the test API
curl --request POST   --url https://dev-sey0m6-p.eu.auth0.com/oauth/token   --header 'content-type: application/json'   --data '{"client_id":"n0OVbi1nPYzFEEfozXlTJ3ZHm76XGNMY","client_secret":"8DzDppBlQzbRoYeT8D2cTa-ONRme7ghd6IfyHFkTUi9mYr73JQKuDEj-h2YZjC-D","audience":"https://dev-sey0m6-p.eu.auth0.com/api/v2/","grant_type":"client_credentials"}'


Current token:
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlBTcXI2VXFLY3hHUW9xa3lQZTYwNiJ9.eyJpc3MiOiJodHRwczovL2Rldi1zZXkwbTYtcC5ldS5hdXRoMC5jb20vIiwic3ViIjoibjBPVmJpMW5QWXpGRUVmb3pYbFRKM1pIbTc2WEdOTVlAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vZGV2LXNleTBtNi1wLmV1LmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNjAxODA2MTIzLCJleHAiOjE2MDE4OTI1MjMsImF6cCI6Im4wT1ZiaTFuUFl6RkVFZm96WGxUSjNaSG03NlhHTk1ZIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.GbxRtFVzOVjuruZwusuWAof45ZMHlr1b8v7ticDO4pZibksa5bWCuBxugD3NmuYkYWHE-U-zQSphgy6D1Q6DpMqKqvAIDLkfo5QVO2elaOpT0DDYTLqJT_hDeMRDRwqMvbD27yJtSs7nWeGT-XZhF3WHzbbdFBGsN5P8QkMjtNIqvUEc6_xQbw0XSIAFWnpdC5zanLdira-bpMny0HItJ2Yn19xBrf1pYX50pVAKn8934V-HE9UMooc_ELpPjM8e2wb6e17izUX_lsrYHD8uxuJ6VJdai5IPzRm1_T_VojIEfLTOJGg_cGftVeBYrnA6aKGR9jsARCipIhEjYxOwHQ

## test fwk
Make based

In a shell:
> . setenv.sh
> make run-backend-offline

In another shell:
> . setenv.sh
> . venv/bin/activate
> make test-offline