BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

TEST_TOKEN='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlBTcXI2VXFLY3hHUW9xa3lQZTYwNiJ9.eyJpc3MiOiJodHRwczovL2Rldi1zZXkwbTYtcC5ldS5hdXRoMC5jb20vIiwic3ViIjoibjBPVmJpMW5QWXpGRUVmb3pYbFRKM1pIbTc2WEdOTVlAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vZGV2LXNleTBtNi1wLmV1LmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNjAxODA2MTIzLCJleHAiOjE2MDE4OTI1MjMsImF6cCI6Im4wT1ZiaTFuUFl6RkVFZm96WGxUSjNaSG03NlhHTk1ZIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.GbxRtFVzOVjuruZwusuWAof45ZMHlr1b8v7ticDO4pZibksa5bWCuBxugD3NmuYkYWHE-U-zQSphgy6D1Q6DpMqKqvAIDLkfo5QVO2elaOpT0DDYTLqJT_hDeMRDRwqMvbD27yJtSs7nWeGT-XZhF3WHzbbdFBGsN5P8QkMjtNIqvUEc6_xQbw0XSIAFWnpdC5zanLdira-bpMny0HItJ2Yn19xBrf1pYX50pVAKn8934V-HE9UMooc_ELpPjM8e2wb6e17izUX_lsrYHD8uxuJ6VJdai5IPzRm1_T_VojIEfLTOJGg_cGftVeBYrnA6aKGR9jsARCipIhEjYxOwHQ'
OFFLINE_URL=http://localhost:3000/dev
AWS_URL=https://7h5i8a44ek.execute-api.eu-west-3.amazonaws.com/dev
OFFLINE_DBSERVER=http://localhost:8000
AWS_DBSERVER=http://localhost:8000

is_offline="${1}off"

case $is_offline in
    "offline" | "Offline" | "off" | "Off" | "OFF")
        echo "Using offline URL $OFFLINE_URL"
        export BASE_URL=$OFFLINE_URL
        export SLS_MODE="OFFLINE"
        export DBSERVER=$OFFLINE_DBSERVER
        ;;
    *)
        echo "Using AWS URL $AWS_URL"
        export BASE_URL=$AWS_URL
        export SLS_MODE="ONLINE"
        export DBSERVER=$AWS_DBSERVER
        ;;
esac


export AUTH0_TOKEN=$TEST_TOKEN
export PYTHONPATH=$BASEDIR/unittests/common:$PYTHONPATH

#serverless offline workaround
export NODE_OPTIONS="--max_old_space_size=8192"

thispython=`which python`
if [ ! "$thispython" == "$BASEDIR/venv/bin/python" ]; then
    echo "If you plan to run the test suite in this shell, please first source venv/bin/activate"
fi